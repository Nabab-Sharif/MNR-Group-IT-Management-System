const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Endpoints (to be implemented)

// Get user profile
app.get('/api/users/:userId', (req, res) => {
  // Logic to fetch user details, product totals, and transaction history
  res.json({ message: `Details for user ${req.params.userId}` });
});

// Add a new product transaction
app.post('/api/transactions', (req, res) => {
  // Logic to add a new product for a user
  // - Record transaction date
  // - Find previous transaction date
  // - Update user's product totals
  res.json({ message: 'Product transaction added successfully' });
});

// Edit a transaction
app.put('/api/transactions/:transactionId', (req, res) => {
  // Logic to edit an existing transaction
  res.json({ message: `Transaction ${req.params.transactionId} updated` });
});

// Delete a transaction
app.delete('/api/transactions/:transactionId', (req, res) => {
  // Logic to delete a transaction
  res.json({ message: `Transaction ${req.params.transactionId} deleted` });
});

// Transfer product to another user
app.post('/api/products/transfer', (req, res) => {
    const { productId, fromUserId, toUserId } = req.body;
    // Logic to transfer a product
    res.json({ message: `Product transferred from ${fromUserId} to ${toUserId}` });
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
