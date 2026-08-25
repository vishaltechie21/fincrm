/**
 * Global error handler middleware.
 * Ensures consistent response format and prevents raw database errors from leaking to client.
 */
function errorHandler(err, req, res, next) {
  console.error('Error caught in middleware:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message: message,
    errors: err.errors || null
  });
}

module.exports = errorHandler;
