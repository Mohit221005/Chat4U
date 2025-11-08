import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Validate required environment variables
 * @param {Array<string>} requiredVars - List of required env var names
 * @throws {Error} If any required variables are missing
 */
const validateEnvVars = (requiredVars) => {
  const missingVars = requiredVars.filter((varName) => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingVars.join(", ")}`);
    console.error("Please check your .env file and ensure all required variables are set.");
    process.exit(1);
  }
};

// Required environment variables
const requiredEnvVars = [
  "MONGO_URI",
  "JWT_SECRET",
  "PORT",
  "CLIENT_URL",
];

// Validate on startup
validateEnvVars(requiredEnvVars);

/**
 * Centralized configuration object
 * All environment variables and app constants should be accessed through this
 */
export const config = {
  // Server Configuration
  server: {
    port: parseInt(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || "development",
    clientUrl: process.env.CLIENT_URL,
  },

  // Database Configuration
  database: {
    mongoUri: process.env.MONGO_URI,
  },

  // Authentication Configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    cookieName: "jwt",
    cookieMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  },

  // Cloudinary Configuration (optional)
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
    enabled: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY),
  },

  // Email Configuration (optional)
  email: {
    resendApiKey: process.env.RESEND_API_KEY || "",
    emailFrom: process.env.EMAIL_FROM || "onboarding@resend.dev",
    emailFromName: process.env.EMAIL_FROM_NAME || "Talksy",
    enabled: !!process.env.RESEND_API_KEY,
  },

  // Arcjet Configuration (optional)
  arcjet: {
    key: process.env.ARCJET_KEY || "",
    env: process.env.ARCJET_ENV || "development",
    enabled: !!process.env.ARCJET_KEY,
  },

  // Redis Configuration (optional, for future scaling)
  redis: {
    url: process.env.REDIS_URL || "",
    enabled: !!process.env.REDIS_URL,
  },

  // Rate Limiting Configuration
  rateLimit: {
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
      message: "Too many authentication attempts. Please try again in 15 minutes.",
    },
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
      message: "Too many requests. Please try again later.",
      skipSuccessfulRequests: true,
    },
  },

  // Pagination Configuration
  pagination: {
    defaultLimit: 50,
    maxLimit: 100,
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
    maxSize: 5242880, // 5MB
    maxFiles: 5,
  },

  // Request Timeout Configuration
  timeout: {
    default: 30000, // 30 seconds
    upload: 60000, // 60 seconds for file uploads
  },

  // CORS Configuration
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },

  // File Upload Limits
  upload: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedImageTypes: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
  },
};

// Log configuration on startup (development only)
if (config.server.nodeEnv === "development") {
  console.log("✅ Configuration loaded successfully");
  console.log(`📦 Environment: ${config.server.nodeEnv}`);
  console.log(`🚀 Port: ${config.server.port}`);
  console.log(`🔐 JWT Expiry: ${config.jwt.expiresIn}`);
  console.log(`☁️  Cloudinary: ${config.cloudinary.enabled ? "Enabled" : "Disabled"}`);
  console.log(`📧 Email: ${config.email.enabled ? "Enabled" : "Disabled"}`);
  console.log(`🛡️  Arcjet: ${config.arcjet.enabled ? "Enabled" : "Disabled"}`);
  console.log(`🔴 Redis: ${config.redis.enabled ? "Enabled" : "Disabled"}`);
}

export default config;
