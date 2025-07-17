const express = require('express');
const { sampleQuotes } = require('../data/store');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get random quote
router.get('/random', authenticateToken, (req, res) => {
  try {
    const randomIndex = Math.floor(Math.random() * sampleQuotes.length);
    const quote = sampleQuotes[randomIndex];
    
    res.json({
      ...quote,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get quote error:', error);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

// Get all quotes
router.get('/', authenticateToken, (req, res) => {
  try {
    res.json(sampleQuotes);
  } catch (error) {
    console.error('Get quotes error:', error);
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
});

// Get quote by category (future feature)
router.get('/category/:category', authenticateToken, (req, res) => {
  try {
    const { category } = req.params;
    
    // For now, return random quote (can be extended with categorized quotes)
    const randomIndex = Math.floor(Math.random() * sampleQuotes.length);
    const quote = sampleQuotes[randomIndex];
    
    res.json({
      ...quote,
      category,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get category quote error:', error);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

module.exports = router;