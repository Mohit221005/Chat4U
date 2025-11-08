import logger from '../lib/logger.js';
import ApiError from '../utils/ApiError.js';

/**
 * Async handler wrapper to catch errors in async route handlers
 * Eliminates the need for try-catch blocks in controllers
 * 
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 * 
 * @example
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await User.find();
 *   res.json(users);
 * }));
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Convert errors to ApiError instances
 * Handles MongoDB errors, validation errors, JWT errors, etc.
 * 
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @returns {ApiError} Converted ApiError instance
 */
const convertToApiError = (err, req) => {
  // If already an ApiError, return as is
  if (err instanceof ApiError) {
    return err;
  }
  
  let statusCode = 500;
  let message = err.message || 'Internal Server Error';
  
  // Handle MongoDB duplicate key error (E11000)
  if (err.name === 'MongoError' && err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern)[0];
    message = `${field} already exists`;
  }
  
  // Handle MongoDB validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map(e => e.message)
      .join(', ');
  }
  
  // Handle MongoDB cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please login again.';
  }
  
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please login again.';
  }
  
  // Handle Multer errors (file upload)
  if (err.name === 'MulterError') {
    statusCode = 400;
    message = `File upload error: ${err.message}`;
  }
  
  return new ApiError(statusCode, message, true, err.stack);
};

/**
 * Global error handler middleware
 * Catches all errors and returns consistent JSON response
 * 
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const errorHandler = (err, req, res, next) => {
  // Convert error to ApiError
  const apiError = convertToApiError(err, req);
  
  // Log error
  const logData = {
    error: apiError.message,
    statusCode: apiError.statusCode,
    stack: apiError.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?._id,
  };
  
  if (apiError.statusCode >= 500) {
    logger.error('Server Error', logData);
  } else {
    logger.warn('Client Error', logData);
  }
  
  // Prepare response
  const response = {
    success: false,
    message: apiError.message,
  };
  
  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = apiError.stack;
  }
  
  // Include validation errors if present
  if (apiError.errors) {
    response.errors = apiError.errors;
  }
  
  // Send response
  res.status(apiError.statusCode).json(response);
};

/**
 * Handle 404 Not Found errors
 * Should be placed after all routes
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const notFoundHandler = (req, res, next) => {
  const error = new ApiError(404, `Route ${req.originalUrl} not found`);
  next(error);
};

/**
 * Gracefully handle uncaught exceptions
 * Log the error and exit the process
 */
export const handleUncaughtException = () => {
  process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION! Shutting down...', {
      error: err.message,
      stack: err.stack,
    });
    
    // Exit process (supervisor like PM2 will restart)
    process.exit(1);
  });
};

/**
 * Gracefully handle unhandled promise rejections
 * Log the error and exit the process
 */
export const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION! Shutting down...', {
      error: err.message,
      stack: err.stack,
    });
    
    // Exit process (supervisor like PM2 will restart)
    process.exit(1);
  });
};
