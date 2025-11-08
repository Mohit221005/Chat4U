import authService from "../services/auth.service.js";
import { asyncHandler } from "../middleware/error.middleware.js";
import { sendWelcomeEmail } from "../emails/emailHandlers.js";
import cloudinary from "../lib/cloudinary.js";
import config from "../config/index.js";
import logger from "../lib/logger.js";

/**
 * Set JWT cookie in response
 * @param {Object} res - Express response object
 * @param {string} token - JWT token
 */
const setTokenCookie = (res, token) => {
  res.cookie(config.jwt.cookieName, token, {
    maxAge: config.jwt.cookieMaxAge,
    httpOnly: true,
    sameSite: "strict",
    secure: config.server.nodeEnv === "production",
  });
};

/**
 * Register a new user
 * @route POST /api/auth/signup
 * @access Public
 */
export const signup = asyncHandler(async (req, res) => {
  const { user, token } = await authService.register(req.body);

  // Set JWT cookie
  setTokenCookie(res, token);

  // Send welcome email asynchronously (don't wait for it)
  sendWelcomeEmail(user.email, user.fullName, config.server.clientUrl).catch((error) => {
    logger.error("Failed to send welcome email", {
      error: error.message,
      userId: user._id,
    });
  });

  // Return in format frontend expects (user and token at root level)
  res.status(201).json({
    success: true,
    message: "Signup successful",
    token,
    user: {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    },
  });
});

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
export const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.body);

  // Set JWT cookie
  setTokenCookie(res, token);

  // Return in format frontend expects (user and token at root level)
  res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    user: {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    },
  });
});

/**
 * Logout user
 * @route POST /api/auth/logout
 * @access Public
 */
export const logout = asyncHandler(async (req, res) => {
  res.cookie(config.jwt.cookieName, "", { maxAge: 0 });
  res.status(200).json({ message: "Logged out successfully" });
});

/**
 * Update user profile
 * @route PUT /api/auth/update-profile
 * @access Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { profilePic } = req.body;
  const userId = req.user._id;

  let updates = {};

  // Handle Cloudinary upload if profile picture provided
  if (profilePic) {
    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    updates.profilePic = uploadResponse.secure_url;
  }

  // Add any other allowed updates
  if (req.body.fullName) {
    updates.fullName = req.body.fullName;
  }

  const user = await authService.updateProfile(userId, updates);

  // Return user object directly for backward compatibility
  res.status(200).json(user);
});

/**
 * Check authentication status
 * @route GET /api/auth/check
 * @access Private
 */
export const checkAuth = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user._id);
  // Return user object directly for backward compatibility
  res.status(200).json(user);
});
