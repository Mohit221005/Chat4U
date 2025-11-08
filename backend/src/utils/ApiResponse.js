/**
 * Standardized API Response Utility
 * Ensures consistent response format across all endpoints
 */
export class ApiResponse {
  /**
   * Create an API response
   * 
   * @param {boolean} success - Whether the request was successful
   * @param {*} data - Response data
   * @param {string} message - Response message
   * @param {Object} [pagination] - Pagination metadata (optional)
   */
  constructor(success, data = null, message = "", pagination = null) {
    this.success = success;
    if (message) this.message = message;
    if (data !== null) this.data = data;
    if (pagination) this.pagination = pagination;
  }

  /**
   * Create a success response
   * 
   * @param {*} data - Response data
   * @param {string} [message="Success"] - Success message
   * @param {Object} [pagination] - Pagination metadata
   * @returns {ApiResponse} Success response object
   * 
   * @example
   * return res.json(ApiResponse.success(users, "Users fetched successfully"));
   */
  static success(data, message = "Success", pagination = null) {
    return new ApiResponse(true, data, message, pagination);
  }

  /**
   * Create an error response
   * 
   * @param {string} message - Error message
   * @param {*} [data] - Optional error data or details
   * @returns {ApiResponse} Error response object
   * 
   * @example
   * return res.status(400).json(ApiResponse.error("Invalid request"));
   */
  static error(message, data = null) {
    return new ApiResponse(false, data, message);
  }

  /**
   * Create a paginated success response
   * 
   * @param {Array} data - Array of items
   * @param {Object} pagination - Pagination metadata
   * @param {boolean} pagination.hasMore - Whether more items exist
   * @param {string} [pagination.nextCursor] - Cursor for next page
   * @param {number} [pagination.total] - Total count (optional)
   * @param {string} [message="Success"] - Success message
   * @returns {ApiResponse} Paginated response object
   * 
   * @example
   * return res.json(ApiResponse.paginated(messages, { hasMore: true, nextCursor: "2024-..." }));
   */
  static paginated(data, pagination, message = "Success") {
    return new ApiResponse(true, data, message, pagination);
  }
}

export default ApiResponse;
