const express = require('express');
const router = express.Router();

// Example payment route
router.post('/payment', (req, res) => {
  res.send('Payment processed!');
});

module.exports = router;
