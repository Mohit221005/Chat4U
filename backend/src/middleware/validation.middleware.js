import { body, param, validationResult } from 'express-validator';

/**
 * Middleware to handle validation errors
 * Checks validation result and returns formatted error response
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
    });
  }
  
  next();
};

/**
 * Validation rules for user signup
 * 
 * @constant {Array} validateSignup - Array of validation middleware
 */
export const validateSignup = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must not exceed 255 characters'),
    
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Full name can only contain letters and spaces'),
    
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .isLength({ max: 128 })
    .withMessage('Password must not exceed 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
  handleValidationErrors,
];

/**
 * Validation rules for user login
 * 
 * @constant {Array} validateLogin - Array of validation middleware
 */
export const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
    
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
    
  handleValidationErrors,
];

/**
 * Validation rules for profile update
 * 
 * @constant {Array} validateProfileUpdate - Array of validation middleware
 */
export const validateProfileUpdate = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Full name can only contain letters and spaces'),
    
  body('profilePic')
    .optional()
    .trim()
    .matches(/^data:image\/(jpeg|jpg|png|gif|webp);base64,/)
    .withMessage('Invalid image format. Must be base64-encoded image'),
    
  handleValidationErrors,
];

/**
 * Validation rules for sending a message
 * 
 * @constant {Array} validateSendMessage - Array of validation middleware
 */
export const validateSendMessage = [
  param('id')
    .isMongoId()
    .withMessage('Invalid recipient ID'),
    
  body('text')
    .optional({ checkFalsy: true })  // Treat empty string as optional
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Message text must not exceed 2000 characters'),
    
  body('image')
    .optional({ checkFalsy: true })  // Treat empty string as optional
    .trim()
    .matches(/^data:image\/(jpeg|jpg|png|gif|webp);base64,/)
    .withMessage('Invalid image format. Must be base64-encoded image'),
    
  // Custom validation: at least one of text or image must be present and non-empty
  body()
    .custom((value, { req }) => {
      const hasText = req.body.text && req.body.text.trim().length > 0;
      const hasImage = req.body.image && req.body.image.trim().length > 0;
      
      if (!hasText && !hasImage) {
        throw new Error('Message must contain either text or image');
      }
      return true;
    }),
    
  handleValidationErrors,
];

/**
 * Validation rules for getting messages by user ID
 * 
 * @constant {Array} validateGetMessages - Array of validation middleware
 */
export const validateGetMessages = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID'),
    
  handleValidationErrors,
];

/**
 * Sanitize user input to prevent XSS attacks
 * Removes potentially dangerous HTML/script tags
 * 
 * @param {string} input - User input string
 * @returns {string} Sanitized string
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove HTML tags and script content
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
};
