/**
 * Centralized error-handling middleware.
 *
 * Must be registered LAST in server.js after all routes:
 *   app.use(errorHandler);
 *
 * Controllers can either call next(err) or throw (Express 5 auto-catches async throws).
 */
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error('[ErrorHandler]', err);

  // Zod validation error
  if (err.name === 'ZodError') {
    const errors = err.issues.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(422).json({ message: 'Validation failed', errors });
  }

  // Mongoose validation error (schema-level, e.g. required field missing)
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(422).json({ message: 'Validation failed', errors });
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({ message: 'Invalid resource ID format' });
  }

  // Mongoose duplicate key (e.g. duplicate email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ message: `${field} already exists` });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired' });
  }

  // Generic fallback
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
