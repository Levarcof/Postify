import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  // 🔹 jis user ko notification milega
  recipient: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    userName: String
  },

  // 🔹 jisne action kiya (like/comment)
  sender: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    userName: String
  },

  // 🔹 kis post par action hua
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post"
  },

  // 🔹 type of notification
  type: {
    type: String,
    enum: ["like", "comment"],
    required: true
  },

  // 🔹 comment text (only if type = comment)
  commentText: String,

  // 🔹 read/unread status
  isRead: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

export const Notification = mongoose.model("Notification", notificationSchema);