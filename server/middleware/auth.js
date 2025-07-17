const jwt = require('jsonwebtoken');
const { users } = require('../data/store');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    // Check if user still exists
    const currentUser = users.find(u => u.id === user.id);
    if (!currentUser) {
      return res.status(403).json({ error: 'User not found' });
    }
    
    req.user = user;
    next();
  });
};

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

module.exports = {
  authenticateToken,
  generateToken,
  JWT_SECRET
};