import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import config from '../config/index.js';

/**
 * Rate limiting configuration for authentication endpoints
 * Stricter limits to prevent brute force attacks
 * 
 * @constant {Object} authLimiter - Rate limiter for /api/auth routes
 */
export const authLimiter = rateLimit({
  windowMs: config.rateLimit.auth.windowMs,
  max: config.rateLimit.auth.maxRequests,
  message: {
    success: false,
    message: config.rateLimit.auth.message,
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: config.rateLimit.auth.message,
    });
  },
});

/**
 * Rate limiting configuration for general API endpoints
 * More lenient limits for regular chat/message operations
 * 
 * @constant {Object} apiLimiter - Rate limiter for general API routes
 */
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.api.windowMs,
  max: config.rateLimit.api.maxRequests,
  message: {
    success: false,
    message: config.rateLimit.api.message,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: config.rateLimit.api.skipSuccessfulRequests,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: config.rateLimit.api.message,
    });
  },
});

/**
 * Helmet configuration for security headers
 * Protects against common web vulnerabilities
 * 
 * @function helmetConfig
 * @returns {Function} Configured helmet middleware
 */
export const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://avatar.iran.liara.run"], // Allow Cloudinary and avatar service
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  // Cross-Origin-Embedder-Policy
  crossOriginEmbedderPolicy: false, // Disable for WebSocket compatibility
  // Cross-Origin-Resource-Policy
  crossOriginResourcePolicy: { policy: "cross-origin" },
  // DNS Prefetch Control
  dnsPrefetchControl: { allow: false },
  // Expect-CT
  expectCt: {
    maxAge: 86400, // 24 hours
  },
  // Frameguard (X-Frame-Options)
  frameguard: { action: "deny" },
  // Hide Powered-By
  hidePoweredBy: true,
  // HTTP Strict Transport Security (HSTS)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  // IE No Open
  ieNoOpen: true,
  // No Sniff (X-Content-Type-Options)
  noSniff: true,
  // Permitted Cross-Domain Policies
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
  // Referrer Policy
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  // X-XSS-Protection
  xssFilter: true,
});

/**
 * Apply all security middleware to the app
 * Use this in server.js before defining routes
 * 
 * @example
 * import { applySecurityMiddleware } from './middleware/security.middleware.js';
 * applySecurityMiddleware(app);
 * 
 * @param {Object} app - Express app instance
 */
export const applySecurityMiddleware = (app) => {
  // Apply Helmet for security headers
  app.use(helmetConfig);
  
  // Apply general API rate limiting to all routes
  // Specific routes can override this with stricter limits
  app.use('/api/', apiLimiter);
};
