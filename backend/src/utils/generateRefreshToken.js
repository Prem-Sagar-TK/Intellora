const jwt = require('jsonwebtoken');

/**
 * Generate a long-lived refresh token (7 days).
 * Stored in an httpOnly cookie — never exposed to JS.
 * JWT_REFRESH_SECRET must be a *different* secret from JWT_SECRET.
 */
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });
};

module.exports = generateRefreshToken;
