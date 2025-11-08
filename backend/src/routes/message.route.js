import express from "express";
import {
  getAllContacts,
  getChatPartners,
  getMessagesByUserId,
  sendMessage,
} from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";
import { 
  validateSendMessage, 
  validateGetMessages 
} from "../middleware/validation.middleware.js";

const router = express.Router();

// Apply Arcjet protection and authentication to all message routes
router.use(arcjetProtection, protectRoute);

// Get all contacts (users)
router.get("/contacts", getAllContacts);

// Get chat partners (users with conversation history)
// Supporting both /users and /chats for backward compatibility
router.get("/users", getChatPartners);
router.get("/chats", getChatPartners);

// Get messages by user ID (conversation with specific user)
router.get("/:id", validateGetMessages, getMessagesByUserId);

// Send message to user
router.post("/send/:id", validateSendMessage, sendMessage);

export default router;
