/**
 * Request Logger Middleware
 * Logs incoming requests and detects slow requests
 */

export const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Capture response
  res.on('finish', () => {
    const duration = Date.now() - start;

    // Warn on slow requests (>1000ms)
    if (duration > 1000) {
      console.warn(`⚠️  Slow request detected: ${req.method} ${req.path} took ${duration}ms`);
    }
  });

  next();
};

export default requestLogger;
