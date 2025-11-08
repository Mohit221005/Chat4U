import logger from "../lib/logger.js";
import config from "../config/index.js";

/**
 * Request timeout middleware
 * Prevents long-running requests from blocking the server
 * 
 * @param {number} [timeoutMs] - Timeout in milliseconds (default from config)
 * @returns {Function} Express middleware function
 * 
 * @example
 * // Use default timeout (30s)
 * app.use(requestTimeout());
 * 
 * // Use custom timeout
 * app.use('/api/upload', requestTimeout(60000)); // 60 seconds for uploads
 */
export const requestTimeout = (timeoutMs) => {
  const timeout = timeoutMs || config.timeout.default;

  return (req, res, next) => {
    // Set timeout
    const timer = setTimeout(() => {
      // Only send response if headers haven't been sent yet
      if (!res.headersSent) {
        logger.warn("Request timeout", {
          method: req.method,
          path: req.path,
          timeout,
          ip: req.ip,
        });

        res.status(408).json({
          success: false,
          message: "Request timeout - operation took too long",
        });
      }
    }, timeout);

    // Clear timeout when response finishes
    res.on("finish", () => {
      clearTimeout(timer);
    });

    // Clear timeout on response close (connection terminated)
    res.on("close", () => {
      clearTimeout(timer);
    });

    next();
  };
};

export default requestTimeout;
