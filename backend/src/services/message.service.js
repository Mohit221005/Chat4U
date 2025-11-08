import Message from "../models/Message.js";
import User from "../models/User.js";
import logger from "../lib/logger.js";
import { BadRequestError, NotFoundError } from "../utils/ApiError.js";
import config from "../config/index.js";
import mongoose from "mongoose";

/**
 * Message Service
 * Handles all message and chat-related business logic
 */
class MessageService {
  /**
   * Send a message to another user
   * 
   * @param {string} senderId - ID of the user sending the message
   * @param {string} receiverId - ID of the user receiving the message
   * @param {Object} content - Message content
   * @param {string} [content.text] - Message text
   * @param {string} [content.image] - Message image URL
   * @returns {Promise<Object>} Created message object
   * @throws {NotFoundError} If receiver doesn't exist
   * @throws {BadRequestError} If neither text nor image provided
   */
  async sendMessage(senderId, receiverId, content) {
    const { text, image } = content;

    // Validate that at least one content type is provided
    if (!text && !image) {
      throw new BadRequestError("Message must contain text or image");
    }

    // Verify receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      throw new NotFoundError("Receiver not found");
    }

    // Prevent sending messages to self
    if (senderId.toString() === receiverId.toString()) {
      throw new BadRequestError("Cannot send messages to yourself");
    }

    // Create message
    const message = await Message.create({
      senderId,
      receiverId,
      text: text || "",
      image: image || "",
    });

    logger.info("Message sent", {
      messageId: message._id,
      senderId,
      receiverId,
      hasText: !!text,
      hasImage: !!image,
    });

    // Convert to plain object with string IDs for frontend comparison
    const messageObj = message.toObject();
    return {
      ...messageObj,
      _id: messageObj._id.toString(),
      senderId: messageObj.senderId.toString(),
      receiverId: messageObj.receiverId.toString(),
    };
  }

  /**
   * Get messages between two users with cursor-based pagination
   * 
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @param {Object} options - Pagination options
   * @param {number} [options.limit] - Number of messages to fetch (default: 50)
   * @param {string} [options.before] - Cursor for pagination (ISO timestamp)
   * @returns {Promise<Object>} Messages with pagination metadata
   * @returns {Array} return.messages - Array of message objects
   * @returns {boolean} return.hasMore - Whether more messages exist
   * @returns {string} return.nextCursor - Cursor for next page (null if no more)
   */
  async getMessagesBetweenUsers(userId1, userId2, options = {}) {
    // Parse and validate limit
    let limit = parseInt(options.limit) || config.pagination.defaultLimit;
    if (limit > config.pagination.maxLimit) {
      limit = config.pagination.maxLimit;
    }

    const { before } = options;

    // Build query
    const query = {
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
    };

    // Add cursor condition if provided
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    // Fetch limit + 1 to check if there are more messages
    const messages = await Message.find(query)
      .sort({ createdAt: -1 }) // Most recent first
      .limit(limit + 1)
      .lean(); // Use lean() for better performance

    // Check if there are more messages
    const hasMore = messages.length > limit;
    if (hasMore) {
      messages.pop(); // Remove the extra message
    }

    // Get next cursor (timestamp of last message)
    const nextCursor =
      hasMore && messages.length > 0
        ? messages[messages.length - 1].createdAt.toISOString()
        : null;

    logger.debug("Fetched messages between users", {
      count: messages.length,
      hasMore,
      userId1,
      userId2,
    });

    // Convert ObjectIds to strings for frontend comparison
    const messagesWithStringIds = messages.map(msg => ({
      ...msg,
      _id: msg._id.toString(),
      senderId: msg.senderId.toString(),
      receiverId: msg.receiverId.toString(),
    }));

    return {
      messages: messagesWithStringIds.reverse(), // Reverse to show oldest first
      hasMore,
      nextCursor,
    };
  }

  /**
   * Get all users the current user has chatted with
   * Uses optimized aggregation pipeline for performance
   * 
   * @param {string} userId - Current user ID
   * @returns {Promise<Array>} Array of chat partner objects with last message info
   */
  async getChatPartners(userId) {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const chatPartners = await Message.aggregate([
      // Match messages where user is sender or receiver
      {
        $match: {
          $or: [{ senderId: userObjectId }, { receiverId: userObjectId }],
        },
      },
      // Sort by most recent first
      {
        $sort: { createdAt: -1 },
      },
      // Project the partner ID (the other person in the conversation)
      {
        $project: {
          partnerId: {
            $cond: {
              if: { $eq: ["$senderId", userObjectId] },
              then: "$receiverId",
              else: "$senderId",
            },
          },
          lastMessage: "$$ROOT",
        },
      },
      // Group by partner ID to get unique partners
      {
        $group: {
          _id: "$partnerId",
          lastMessage: { $first: "$lastMessage" },
        },
      },
      // Lookup user information
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      // Unwind user info
      {
        $unwind: "$userInfo",
      },
      // Project final structure
      {
        $project: {
          _id: 1,
          email: "$userInfo.email",
          fullName: "$userInfo.fullName",
          // Add fallback for missing profilePic
          profilePic: {
            $ifNull: [
              "$userInfo.profilePic",
              "https://avatar.iran.liara.run/public"
            ]
          },
          lastMessage: {
            _id: "$lastMessage._id",
            text: "$lastMessage.text",
            image: "$lastMessage.image",
            senderId: "$lastMessage.senderId",
            receiverId: "$lastMessage.receiverId",
            createdAt: "$lastMessage.createdAt",
          },
        },
      },
      // Sort by last message time (most recent first)
      {
        $sort: { "lastMessage.createdAt": -1 },
      },
    ]);

    logger.debug("Fetched chat partners", {
      userId,
      count: chatPartners.length,
    });

    // Convert ObjectIds to strings for frontend comparison
    const partnersWithStringIds = chatPartners.map(partner => ({
      ...partner,
      _id: partner._id.toString(),
      lastMessage: partner.lastMessage ? {
        ...partner.lastMessage,
        _id: partner.lastMessage._id.toString(),
        senderId: partner.lastMessage.senderId.toString(),
        receiverId: partner.lastMessage.receiverId.toString(),
      } : null,
    }));

    return partnersWithStringIds;
  }

  /**
   * Delete a message (soft delete by marking as deleted)
   * 
   * @param {string} messageId - Message ID to delete
   * @param {string} userId - User ID requesting deletion
   * @returns {Promise<Object>} Deleted message
   * @throws {NotFoundError} If message not found
   * @throws {BadRequestError} If user is not the sender
   */
  async deleteMessage(messageId, userId) {
    const message = await Message.findById(messageId);

    if (!message) {
      throw new NotFoundError("Message not found");
    }

    // Only sender can delete their message
    if (message.senderId.toString() !== userId.toString()) {
      throw new BadRequestError("You can only delete your own messages");
    }

    // Soft delete by marking as deleted
    message.text = "This message was deleted";
    message.image = "";
    message.isDeleted = true; // You'd need to add this field to schema
    await message.save();

    logger.info("Message deleted", {
      messageId,
      userId,
    });

    return message;
  }

  /**
   * Get message count between two users
   * 
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @returns {Promise<number>} Total message count
   */
  async getMessageCount(userId1, userId2) {
    const count = await Message.countDocuments({
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
    });

    return count;
  }
}

// Export singleton instance
export default new MessageService();
