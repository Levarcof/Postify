import { User } from "../models/User.js";
import { Session } from "../models/Session.js";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";

export const conversationUsers = async (req, res) => {
  try {
    const sessionId = req.cookies.sessionId;

    if (!sessionId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const currentUserId = session.userId;

    // 1. Find conversations where current user is a member
    const conversations = await Conversation.find({
      members: { $in: [currentUserId] }
    });

    // 2. Fetch all members details for these conversations and calculate unread counts
    const users = await Promise.all(conversations.map(async (conv) => {
      const otherMemberId = conv.members.find(m => m.toString() !== currentUserId.toString());
      const user = await User.findById(otherMemberId).select("firstName lastName userName image");
      
      const unreadCount = await Message.countDocuments({
        conversationId: conv._id,
        sender: { $ne: currentUserId },
        seen: false
      });

      const lastMsg = await Message.findById(conv.lastMessage);

      return {
        ...user.toObject(),
        conversationId: conv._id,
        unreadCount,
        lastMessage: lastMsg,
        updatedAt: conv.updatedAt
      };
    }));

    // 3. Sort by updatedAt (latest message activity) descending
    users.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    return res.status(200).json({
      success: true,
      users
    });

  } catch (error) {
    console.error("Conversation Users Fetch Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// 💬 Create / Get Conversation
export const createConversation = async (req, res) => {
  try {
    const { userId } = req.body; // Target user
    const sessionId = req.cookies.sessionId;
    if (!sessionId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const session = await Session.findById(sessionId);
    if (!session) return res.status(401).json({ success: false, message: "Unauthorized" });

    const currentUserId = session.userId;

    if (currentUserId.toString() === userId.toString()) {
      return res.status(400).json({ success: false, message: "You cannot message yourself" });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      members: { $all: [currentUserId, userId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        members: [currentUserId, userId]
      });
    }

    return res.status(200).json({
      success: true,
      conversationId: conversation._id
    });
  } catch (error) {
    console.error("Create Conversation Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// 📩 Get Messages
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const sessionId = req.cookies.sessionId;
    if (!sessionId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const session = await Session.findById(sessionId);
    if (!session) return res.status(401).json({ success: false, message: "Unauthorized" });

    const messages = await Message.find({ conversationId })
      .populate("sender", "firstName lastName userName image")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      messages
    });
  } catch (error) {
    console.error("Get Messages Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// 📤 Send Message
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, text } = req.body;
    const sessionId = req.cookies.sessionId;
    if (!sessionId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const session = await Session.findById(sessionId);
    if (!session) return res.status(401).json({ success: false, message: "Unauthorized" });

    const newMessage = await Message.create({
      conversationId,
      sender: session.userId,
      text
    });

    const populatedMessage = await Message.findById(newMessage._id)
      .populate("sender", "firstName lastName userName image");

    // Update Conversation with last message and trigger updatedAt
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: newMessage._id,
      updatedAt: new Date()
    });

    return res.status(200).json({
      success: true,
      message: populatedMessage
    });
  } catch (error) {
    console.error("Send Message Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// 🗑️ Delete Conversation
export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.body;
    const sessionId = req.cookies.sessionId;
    if (!sessionId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const session = await Session.findById(sessionId);
    if (!session) return res.status(401).json({ success: false, message: "Unauthorized" });

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found" });

    // Verify membership
    if (!conversation.members.some(m => m.toString() === session.userId.toString())) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    // Delete all messages in the conversation
    await Message.deleteMany({ conversationId });

    // Delete the conversation document
    await Conversation.findByIdAndDelete(conversationId);

    return res.status(200).json({ success: true, message: "Conversation deleted successfully" });
  } catch (error) {
    console.error("Delete Conversation Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// 👀 Mark Messages as Seen
export const markMessagesSeen = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const sessionId = req.cookies.sessionId;
    if (!sessionId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const session = await Session.findById(sessionId);
    if (!session) return res.status(401).json({ success: false, message: "Unauthorized" });

    const currentUserId = session.userId;

    // Update all messages in this conversation where current user is the receiver
    await Message.updateMany(
      { conversationId, sender: { $ne: currentUserId }, seen: false },
      { $set: { seen: true } }
    );

    return res.status(200).json({ success: true, message: "Messages marked as seen" });
  } catch (error) {
    console.error("Mark Seen Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};