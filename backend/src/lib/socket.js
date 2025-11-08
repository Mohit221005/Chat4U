import { Server } from "socket.io";
import http from "http";
import express from "express";
import config from "../config/index.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";
import logger from "./logger.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: config.cors,
});

// Apply authentication middleware to all socket connections
io.use(socketAuthMiddleware);

/**
 * Get the socket ID for a given user ID
 * Used to check if a user is online and send real-time messages
 * 
 * @param {string} userId - MongoDB ObjectId of the user
 * @returns {string|undefined} Socket ID if user is online, undefined otherwise
 */
export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// Store online users: {userId: socketId}
const userSocketMap = {};

io.on("connection", (socket) => {
  logger.info("User connected via Socket.IO", {
    userId: socket.userId,
    userName: socket.user?.fullName,
    socketId: socket.id,
  });

  const userId = socket.userId;
  userSocketMap[userId] = socket.id;

  // Broadcast updated online users list to all clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Handle user disconnect
  socket.on("disconnect", () => {
    logger.info("User disconnected from Socket.IO", {
      userId: socket.userId,
      userName: socket.user?.fullName,
      socketId: socket.id,
    });
    
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
