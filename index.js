const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000; // You can change this port number as needed

// Parse request body as JSON
app.use(bodyParser.json());

// Define the POST route for user data
app.post('/users', (req, res) => {
  const { name, email } = req.body;

  // Validate the request data (optional)
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  // Process the user data (e.g., save to a database)
  // Replace this with your actual logic
  console.log('Received user data:', { name, email });

  // Send a success response
  res.status(201).json({ message: 'User data created successfully' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});