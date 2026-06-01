// Middleware uwierzytelniający na podstawie tokenu JWT
const jwt = require('jsonwebtoken');

/**
 * authMiddleware - sprawdza nagłówek Authorization, weryfikuje token JWT
 * i zapisuje dane użytkownika w obiekcie req.user.
 */
const authMiddleware = (req, res, next) => {
  try {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Brak tokenu autoryzacyjnego' });
    }

    const token = authorizationHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Brak tokenu autoryzacyjnego' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      message: 'Nieprawidłowy lub wygasły token',
      error: error.message,
    });
  }
};

module.exports = authMiddleware;
