import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";
import { getIO } from "../utils/socket.js";

// 🔔 Create Notification
export const createNotification = async (req, res) => {
  try {
    const { recipientUserName, type, postId, commentText } = req.body;
    const senderSessionId = req.cookies.sessionId;

    const { Session } = await import("../models/Session.js");
    const session = await Session.findById(senderSessionId);
    if (!session) return res.status(401).json({ success: false, message: "Unauthorized" });

    const sender = await User.findById(session.userId);
    const recipient = await User.findOne({ userName: recipientUserName });

    if (!recipient) return res.status(404).json({ success: false, message: "Recipient not found" });

    // Don't notify if sender is recipient
    if (sender._id.toString() === recipient._id.toString()) {
      return res.status(200).json({ success: true, message: "Self-notification skipped" });
    }

    const notification = await Notification.create({
      recipient: {
        userId: recipient._id,
        userName: recipient.userName
      },
      sender: {
        userId: sender._id,
        userName: sender.userName
      },
      postId,
      type,
      commentText,
      isRead: false
    });

    // Populate sender info for real-time update
    const populatedNotification = await Notification.findById(notification._id)
      .populate("sender.userId", "image firstName lastName")
      .populate("postId", "content image");

    // 🔔 Emit Socket Event
    const io = getIO();
    io.to(`user_${recipient._id}`).emit("new-notification", populatedNotification);

    return res.status(201).json({ success: true, notification: populatedNotification });
  } catch (error) {
    console.error("Create Notification Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// 📥 Get Notifications
export const getNotifications = async (req, res) => {
  try {
    const { userName } = req.params;
    const notifications = await Notification.find({ "recipient.userName": userName })
      .populate("sender.userId", "image firstName lastName")
      .populate("postId", "content image")
      .sort({ createdAt: -1 });

    // Filter out notifications where the post has been deleted (only for likes/comments)
    const filteredNotifications = notifications.filter(notif => 
      notif.type === "follow" || (notif.postId && notif.postId._id)
    );

    return res.status(200).json({ success: true, notifications: filteredNotifications });
  } catch (error) {
    console.error("Get Notifications Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// 💔 Remove Notification (on Unlike/Delete Comment)
export const removeNotification = async (req, res) => {
  try {
    const { recipientUserName, type, postId } = req.body;
    const senderSessionId = req.cookies.sessionId;

    const { Session } = await import("../models/Session.js");
    const session = await Session.findById(senderSessionId);
    if (!session) return res.status(401).json({ success: false, message: "Unauthorized" });

    const deletedNotification = await Notification.findOneAndDelete({
      "recipient.userName": recipientUserName,
      "sender.userId": session.userId,
      type,
      postId
    });

    if (deletedNotification) {
      // 💔 Emit Socket Event
      const io = getIO();
      const recipient = await User.findOne({ userName: recipientUserName });
      if (recipient) {
        io.to(`user_${recipient._id}`).emit("remove-notification", {
          notificationId: deletedNotification._id,
          type,
          postId
        });
      }
    }

    return res.status(200).json({ success: true, message: "Notification removed" });
  } catch (error) {
    console.error("Remove Notification Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// 👁️ Mark as Read
export const markAsRead = async (req, res) => {
  try {
    const { userName } = req.body;
    await Notification.updateMany(
      { "recipient.userName": userName, isRead: false },
      { $set: { isRead: true } }
    );
    return res.status(200).json({ success: true, message: "Notifications marked as read" });
  } catch (error) {
    console.error("Mark as Read Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
