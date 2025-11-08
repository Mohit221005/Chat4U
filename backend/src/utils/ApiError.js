/**
 * Custom error class for API errors
 * Extends built-in Error with HTTP status code and additional metadata
 * 
 * @class ApiError
 * @extends Error
 */
class ApiError extends Error {
  /**
   * Create an API error
   * 
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {boolean} isOperational - Whether error is operational (vs programming error)
   * @param {string} stack - Error stack trace (optional)
   */
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.success = false;
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * 400 Bad Request Error
 * Used for invalid client requests
 */
export class BadRequestError extends ApiError {
  constructor(message = 'Bad Request') {
    super(400, message);
  }
}

/**
 * 401 Unauthorized Error
 * Used for authentication failures
 */
export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

/**
 * 403 Forbidden Error
 * Used when user doesn't have permission
 */
export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}

/**
 * 404 Not Found Error
 * Used when resource doesn't exist
 */
export class NotFoundError extends ApiError {
  constructor(message = 'Not Found') {
    super(404, message);
  }
}

/**
 * 409 Conflict Error
 * Used for conflicts like duplicate resources
 */
export class ConflictError extends ApiError {
  constructor(message = 'Conflict') {
    super(409, message);
  }
}

/**
 * 422 Validation Error
 * Used for data validation failures
 */
export class ValidationError extends ApiError {
  constructor(message = 'Validation Failed', errors = []) {
    super(422, message);
    this.errors = errors;
  }
}

/**
 * 500 Internal Server Error
 * Used for unexpected server errors
 */
export class InternalServerError extends ApiError {
  constructor(message = 'Internal Server Error') {
    super(500, message);
  }
}

export default ApiError;
