const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from header - try both x-auth-token and Authorization
  let token = req.header('x-auth-token');
  
  // If no x-auth-token, check for Authorization Bearer token
  if (!token) {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]; // Extract token from "Bearer <token>"
    }
  }
  
  // Check if no token
  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }
  
  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
}; 