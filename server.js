const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/user');
const Post = require('./models/post');
// Initialize express app
const app = express();
const port = 3000;
const host = '192.168.43.3';
// Body parser middleware to parse request body
app.use(bodyParser.json());

// MongoDB connection (update with your MongoDB URL)
mongoose.connect('mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.3.1', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// Secret key for JWT
const JWT_SECRET = '6365656your_jwt_55433223secret_key544re';

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ message: 'Access denied, no token provided' });

    try {
        const decoded = jwt.verify(token.split(' ')[1], JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
}

// POST API to create a new user (Signup)
app.post('/api/signup', async (req, res) => {
    const { name, email, phone, password } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create and save user
        const user = new User({ name, email, phone, password: hashedPassword });
        await user.save();

        res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create user', details: err.message });
    }
});

// POST API for user login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if the user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Compare password with hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ message: 'Login successful', token });
    } catch (err) {
        res.status(500).json({ error: 'Login failed', details: err.message });
    }
});


// POST API for user logout (Invalidate the token - a simplified example)
app.post('/api/logout', (req, res) => {
    // Invalidate the token by simply returning success (actual logout implementation may vary based on token storage)
    res.status(200).json({ message: 'Logout successful' });
});

// Protected route - example of how to protect routes with JWT
app.get('/api/profile', async (req, res) => {
    const token = req.headers.authorization;

    try {
        if (!token) {
            return res.status(401).json({ message: 'Access denied, no token provided' });
        }

        // Verify the token
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ user });
    } catch (err) {
        res.status(401).json({ message: 'Invalid token', details: err.message });
    }
});

// POST API to create a post (Authenticated)
app.post('/api/posts', authenticateToken, async (req, res) => {
    const { title, content, imageUrl } = req.body;
    const userId = req.user.userId;

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const post = new Post({
            postId: new mongoose.Types.ObjectId().toString(),
            userId: user._id,
            title,
            content,
            imageUrl,
            username: user.name
        });

        await post.save();
        res.status(201).json({ message: 'Post created successfully', post });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create post', details: err.message });
    }
});

// GET API to fetch all posts (Authenticated)
app.get('/api/posts', authenticateToken, async (req, res) => {
    try {
        const posts = await Post.find();
        res.status(200).json(posts);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch posts', details: err.message });
    }
});

// DELETE API to delete a post (Authenticated)
app.delete('/api/posts/:postId', authenticateToken, async (req, res) => {
    const postId = req.params.postId;
    const userId = req.user.userId;

    try {
        const post = await Post.findOne({ postId, userId });
        if (!post) return res.status(404).json({ message: 'Post not found or not authorized to delete' });

        await Post.deleteOne({ postId });
        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete post', details: err.message });
    }
});

// Start server
app.listen(port, host,  () => {
    console.log(`Server running on port ${port}`);
});
