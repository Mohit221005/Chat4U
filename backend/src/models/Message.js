import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    image: {
      type: String,
    },
  },
  { timestamps: true }
);

/**
 * Indexes for optimized query performance
 */

// Compound index for fetching conversation history between two users
// Supports queries: { senderId: X, receiverId: Y, createdAt: -1 }
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

// Compound index for reverse conversation lookup
// Supports queries: { receiverId: X, senderId: Y, createdAt: -1 }
messageSchema.index({ receiverId: 1, senderId: 1, createdAt: -1 });

// Index for getChatPartners optimization - messages sent by user
messageSchema.index({ senderId: 1, createdAt: -1 });

// Index for getChatPartners optimization - messages received by user
messageSchema.index({ receiverId: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
