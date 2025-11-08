import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import cors from "cors";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { connectDB } from "./lib/db.js";
import { app, server } from "./lib/socket.js";
import logger, { logRequest } from "./lib/logger.js";
import config from "./config/index.js";
import { applySecurityMiddleware } from "./middleware/security.middleware.js";
import { requestTimeout } from "./middleware/timeout.middleware.js";
import { 
  errorHandler, 
  notFoundHandler, 
  handleUncaughtException, 
  handleUnhandledRejection 
} from "./middleware/error.middleware.js";

const __dirname = path.resolve();

// Handle uncaught exceptions and unhandled rejections
handleUncaughtException();
handleUnhandledRejection();

// Security middleware (Helmet, rate limiting)
applySecurityMiddleware(app);

// Body parser middleware
app.use(express.json({ limit: "5mb" })); 
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// CORS middleware
app.use(cors(config.cors));

// Cookie parser middleware
app.use(cookieParser());

// Request timeout middleware (30s default)
app.use(requestTimeout());

// HTTP request logging
app.use(logRequest);

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Serve frontend in production
if (config.server.nodeEnv === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
server.listen(config.server.port, () => {
  logger.info(`Server running on port ${config.server.port}`, {
    environment: config.server.nodeEnv,
    port: config.server.port,
  });
  connectDB();
});
