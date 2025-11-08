import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/index.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Custom log format for console output
 * Colorizes output and includes timestamp
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    
    return msg;
  })
);

/**
 * JSON format for file output
 * Structured logging for easy parsing
 */
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Winston logger instance
 * Logs to both console and file with different formats
 * 
 * Log levels:
 * - error: Critical errors that need immediate attention
 * - warn: Warning messages for potentially harmful situations
 * - info: Informational messages about application flow
 * - debug: Detailed information for debugging (dev only)
 */
const logger = winston.createLogger({
  level: config.logging.level,
  format: fileFormat,
  defaultMeta: { service: 'talksy-backend' },
  transports: [
    // Console transport with colors (all environments)
    new winston.transports.Console({
      format: consoleFormat,
    }),
    
    // Error log file (all errors)
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      maxsize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles,
    }),
    
    // Combined log file (all levels)
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles,
    }),
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/exceptions.log'),
      maxsize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles,
    }),
  ],
  
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/rejections.log'),
      maxsize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles,
    }),
  ],
});

/**
 * Create a child logger with additional context
 * Useful for adding module-specific metadata
 * 
 * @param {Object} meta - Additional metadata to include in logs
 * @returns {Object} Child logger instance
 * 
 * @example
 * const authLogger = createChildLogger({ module: 'auth' });
 * authLogger.info('User logged in', { userId: '123' });
 */
export const createChildLogger = (meta) => {
  return logger.child(meta);
};

/**
 * Log HTTP request information
 * Used as Express middleware
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const logRequest = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };
    
    if (res.statusCode >= 500) {
      logger.error('HTTP Request', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });
  
  next();
};

export default logger;
