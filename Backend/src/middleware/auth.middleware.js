const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const error = new Error('Unauthorized');
    error.statusCode = 401;
    return next(error);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_change_me');
    req.user = decoded;
    next();
  } catch (err) {
    const error = new Error('Invalid token');
    error.statusCode = 401;
    next(error);
  }
};

module.exports = { authenticate };
