import express from "express";
import { signup, login, logout, updateProfile, checkAuth } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";
import { authLimiter } from "../middleware/security.middleware.js";
import { 
  validateSignup, 
  validateLogin, 
  validateProfileUpdate 
} from "../middleware/validation.middleware.js";

const router = express.Router();

// Apply Arcjet protection to all auth routes
router.use(arcjetProtection);

// Public routes with STRICT rate limiting (5 requests per 15 minutes)
// These are sensitive endpoints vulnerable to brute force attacks
router.post("/signup", authLimiter, validateSignup, signup);
router.post("/login", authLimiter, validateLogin, login);
router.post("/logout", logout);

// Protected routes with NORMAL rate limiting (via global API limiter)
// These are authenticated and less vulnerable to abuse
router.put("/update-profile", protectRoute, validateProfileUpdate, updateProfile);

// Auth check endpoint - called on every page load, should NOT be rate-limited strictly
// Uses global API limiter (100 req/15min) with skipSuccessfulRequests=true
router.get("/check", protectRoute, checkAuth);

export default router;
