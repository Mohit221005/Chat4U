import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import logger from "../lib/logger.js";
import { BadRequestError, UnauthorizedError, NotFoundError } from "../utils/ApiError.js";
import config from "../config/index.js";

/**
 * Authentication Service
 * Handles all authentication and user management business logic
 */
class AuthService {
  /**
   * Register a new user
   * 
   * @param {Object} userData - User registration data
   * @param {string} userData.email - User email
   * @param {string} userData.fullName - User full name
   * @param {string} userData.password - User password
   * @returns {Promise<Object>} Created user and JWT token
   * @throws {BadRequestError} If email already exists
   */
  async register(userData) {
    const { email, fullName, password } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new BadRequestError("Email already registered");
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      email,
      fullName,
      password: hashedPassword,
    });

    // Generate JWT token
    const token = this.generateToken(user._id);

    logger.info("New user registered", { 
      userId: user._id, 
      email: user.email 
    });

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * Login user with credentials
   * 
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   * @returns {Promise<Object>} User object and JWT token
   * @throws {UnauthorizedError} If credentials are invalid
   */
  async login(credentials) {
    const { email, password } = credentials;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Generate JWT token
    const token = this.generateToken(user._id);

    logger.info("User logged in", { 
      userId: user._id, 
      email: user.email 
    });

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * Update user profile
   * 
   * @param {string} userId - User ID to update
   * @param {Object} updates - Profile updates
   * @param {string} [updates.fullName] - New full name
   * @param {string} [updates.profilePic] - New profile picture URL
   * @returns {Promise<Object>} Updated user object
   * @throws {NotFoundError} If user not found
   */
  async updateProfile(userId, updates) {
    // Only allow specific fields to be updated
    const allowedUpdates = {};
    if (updates.fullName) allowedUpdates.fullName = updates.fullName;
    if (updates.profilePic) allowedUpdates.profilePic = updates.profilePic;

    const user = await User.findByIdAndUpdate(
      userId,
      allowedUpdates,
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new NotFoundError("User not found");
    }

    logger.info("Profile updated", { 
      userId: user._id,
      updatedFields: Object.keys(allowedUpdates)
    });

    return this.sanitizeUser(user);
  }

  /**
   * Get current user by ID
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User object without password
   * @throws {NotFoundError} If user not found
   */
  async getCurrentUser(userId) {
    const user = await User.findById(userId).select("-password").lean();

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Ensure profilePic has fallback and convert ID to string
    return {
      ...user,
      _id: user._id.toString(),
      profilePic: user.profilePic || "https://avatar.iran.liara.run/public",
    };
  }

  /**
   * Generate JWT token for user
   * 
   * @param {string} userId - User ID to encode in token
   * @returns {string} JWT token
   */
  generateToken(userId) {
    return jwt.sign(
      { userId },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  /**
   * Verify JWT token
   * 
   * @param {string} token - JWT token to verify
   * @returns {Object} Decoded token payload
   * @throws {UnauthorizedError} If token is invalid
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      throw new UnauthorizedError("Invalid or expired token");
    }
  }

  /**
   * Remove sensitive data from user object
   * 
   * @param {Object} user - Mongoose user document
   * @returns {Object} Sanitized user object without password
   */
  sanitizeUser(user) {
    const userObj = user.toObject();
    delete userObj.password;
    return userObj;
  }
}

// Export singleton instance
export default new AuthService();
