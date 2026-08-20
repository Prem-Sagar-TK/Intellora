const jwt = require('jsonwebtoken');

/**
 * Generate a short-lived access token (15 minutes).
 * JWT_SECRET must be present — enforced by the startup guard in server.js.
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '15m',
  });
};

module.exports = generateToken;
