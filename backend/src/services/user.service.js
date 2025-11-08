import User from "../models/User.js";
import logger from "../lib/logger.js";
import { NotFoundError } from "../utils/ApiError.js";

/**
 * User Service
 * Handles all user-related business logic
 */
class UserService {
  /**
   * Get all users except the current user
   * 
   * @param {string} currentUserId - ID of current user to exclude
   * @returns {Promise<Array>} Array of user objects (without passwords)
   */
  async getAllUsers(currentUserId) {
    const users = await User.find({ _id: { $ne: currentUserId } })
      .select("-password")
      .sort({ createdAt: -1 })
      .lean(); // Use lean() for better performance

    logger.debug("Fetched all users", {
      count: users.length,
      excludedUserId: currentUserId,
    });

    // Ensure profilePic has fallback and convert IDs to strings
    return users.map(user => ({
      ...user,
      _id: user._id.toString(),
      profilePic: user.profilePic || "https://avatar.iran.liara.run/public",
    }));
  }

  /**
   * Get user by ID
   * 
   * @param {string} userId - User ID to fetch
   * @returns {Promise<Object>} User object (without password)
   * @throws {NotFoundError} If user not found
   */
  async getUserById(userId) {
    const user = await User.findById(userId).select("-password").lean();

    if (!user) {
      throw new NotFoundError("User not found");
    }

    logger.debug("Fetched user by ID", { userId });

    // Ensure profilePic has fallback and convert ID to string
    return {
      ...user,
      _id: user._id.toString(),
      profilePic: user.profilePic || "https://avatar.iran.liara.run/public",
    };
  }

  /**
   * Get multiple users by their IDs
   * 
   * @param {Array<string>} userIds - Array of user IDs
   * @returns {Promise<Array>} Array of user objects
   */
  async getUsersByIds(userIds) {
    const users = await User.find({ _id: { $in: userIds } })
      .select("-password")
      .lean();

    logger.debug("Fetched users by IDs", {
      requestedCount: userIds.length,
      foundCount: users.length,
    });

    // Ensure profilePic has fallback and convert IDs to strings
    return users.map(user => ({
      ...user,
      _id: user._id.toString(),
      profilePic: user.profilePic || "https://avatar.iran.liara.run/public",
    }));
  }

  /**
   * Search users by name or email
   * 
   * @param {string} searchTerm - Search term (name or email)
   * @param {string} currentUserId - Current user ID to exclude from results
   * @param {Object} options - Search options
   * @param {number} [options.limit=10] - Maximum results to return
   * @returns {Promise<Array>} Array of matching users
   */
  async searchUsers(searchTerm, currentUserId, options = {}) {
    const limit = parseInt(options.limit) || 10;

    // Use text search if available, otherwise regex
    const users = await User.find({
      _id: { $ne: currentUserId },
      $or: [
        { fullName: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } },
      ],
    })
      .select("-password")
      .limit(limit)
      .lean();

    logger.debug("Searched users", {
      searchTerm,
      resultsCount: users.length,
      limit,
    });

    // Ensure profilePic has fallback and convert IDs to strings
    return users.map(user => ({
      ...user,
      _id: user._id.toString(),
      profilePic: user.profilePic || "https://avatar.iran.liara.run/public",
    }));
  }

  /**
   * Check if user exists by email
   * 
   * @param {string} email - Email to check
   * @returns {Promise<boolean>} True if user exists, false otherwise
   */
  async userExistsByEmail(email) {
    const user = await User.findOne({ email }).select("_id").lean();
    return !!user;
  }

  /**
   * Check if user exists by ID
   * 
   * @param {string} userId - User ID to check
   * @returns {Promise<boolean>} True if user exists, false otherwise
   */
  async userExists(userId) {
    const user = await User.findById(userId).select("_id").lean();
    return !!user;
  }

  /**
   * Get user statistics
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User statistics
   */
  async getUserStats(userId) {
    const user = await User.findById(userId).select("createdAt").lean();

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // You can expand this with message counts, etc.
    return {
      userId,
      joinedDate: user.createdAt,
      // Add more stats as needed
    };
  }

  /**
   * Update user's last seen timestamp
   * 
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async updateLastSeen(userId) {
    await User.findByIdAndUpdate(userId, {
      lastSeen: new Date(),
    });

    logger.debug("Updated last seen", { userId });
  }
}

// Export singleton instance
export default new UserService();
