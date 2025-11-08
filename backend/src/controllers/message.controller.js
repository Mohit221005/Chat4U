import messageService from "../services/message.service.js";
import userService from "../services/user.service.js";
import { asyncHandler } from "../middleware/error.middleware.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import logger from "../lib/logger.js";
import cloudinary from "../lib/cloudinary.js";

/**
 * Get all contacts (users) except the current user
 * @route GET /api/messages/contacts
 * @access Private
 */
export const getAllContacts = asyncHandler(async (req, res) => {
  const loggedInUserId = req.user._id;
  const users = await userService.getAllUsers(loggedInUserId);

  // Return in format frontend expects
  res.status(200).json(users);
});

/**
 * Get messages between current user and another user with pagination
 * @route GET /api/messages/:id
 * @access Private
 * @query limit - Number of messages to fetch (default: 50, max: 100)
 * @query before - Cursor for pagination (ISO timestamp)
 */
export const getMessagesByUserId = asyncHandler(async (req, res) => {
  const myId = req.user._id;
  const { id: otherUserId } = req.params;
  const { limit, before } = req.query;

  const result = await messageService.getMessagesBetweenUsers(myId, otherUserId, {
    limit,
    before,
  });

  // Return messages array directly for backward compatibility
  // Frontend expects array, not wrapped in 'data' key
  res.status(200).json(result.messages);
});

/**
 * Send a message to another user
 * @route POST /api/messages/send/:id
 * @access Private
 */
export const sendMessage = asyncHandler(async (req, res) => {
  const { text, image } = req.body;
  const { id: receiverId } = req.params;
  const senderId = req.user._id;

  // Debug logging for troubleshooting
  logger.debug("Send message request", {
    senderId: senderId.toString(),
    receiverId,
    hasText: !!text,
    hasImage: !!image,
    textLength: text ? text.length : 0,
  });

  // Handle image upload to Cloudinary (HTTP/Infrastructure concern)
  let imageUrl = "";
  if (image) {
    // Validate base64 format
    const base64Regex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
    if (!base64Regex.test(image)) {
      return res.status(400).json({
        message: "Invalid image format. Expected base64-encoded image."
      });
    }

    // Check approximate size (base64 is ~33% larger than binary)
    const sizeInBytes = (image.length * 3) / 4;
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    if (sizeInBytes > maxSizeInBytes) {
      return res.status(400).json({
        message: "Image size exceeds 5MB limit."
      });
    }

    // Upload to Cloudinary
    try {
      const uploadResponse = await cloudinary.uploader.upload(image, {
        resource_type: "auto",
        timeout: 60000, // 60 second timeout
      });
      imageUrl = uploadResponse.secure_url;
    } catch (uploadError) {
      logger.error("Cloudinary upload error", {
        error: uploadError.message,
        stack: uploadError.stack,
      });
      return res.status(500).json({
        message: "Failed to upload image."
      });
    }
  }

  // Create message via service
  const message = await messageService.sendMessage(senderId, receiverId, {
    text: text || "",
    image: imageUrl,
  });

  // Emit real-time message to receiver (Socket.IO concern)
  try {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", message);
    }
  } catch (socketError) {
    // Log socket error but don't fail the request
    logger.warn("Socket.IO emit error", { error: socketError.message });
  }

  // Return message object directly for backward compatibility
  res.status(201).json(message);
});

/**
 * Get all chat partners for the logged-in user
 * Returns users with conversation history, sorted by last message time
 * 
 * @route GET /api/messages/users (legacy route name)
 * @access Private
 */
export const getChatPartners = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const partners = await messageService.getChatPartners(userId);

  // Return array directly for backward compatibility
  // Frontend expects array at root level
  res.status(200).json(partners);
});
