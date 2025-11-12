const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  const jwt_sec = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

  try {
    req.user = jwt.verify(token, jwt_sec);
    next();
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = authMiddleware;
