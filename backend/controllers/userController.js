import { User } from "../models/User.js";
import { Post } from "../models/Posts.js";
import { Session } from "../models/Session.js";
import { Connection } from "../models/Connection.js";

export const getProfile = async (req, res) => {
  try {
    const sessionId = req.cookies.sessionId;
    if (!sessionId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const session = await Session.findById(sessionId);
    if (!session) return res.status(401).json({ success: false, message: "Unauthorized" });

    const foundUser = await User.findById(session.userId).select("-password");
    if (!foundUser) return res.status(404).json({ success: false, message: "User not found" });

    const userPosts = await Post.find({ user: session.userId }).sort({ createdAt: -1 });

    const connectionData = await Connection.findOne({ userId: session.userId });
    const followersCount = connectionData ? connectionData.followers.length : 0;
    const followingCount = connectionData ? connectionData.following.length : 0;

    return res.status(200).json({
      success: true,
      user: foundUser,
      posts: userPosts,
      followersCount,
      followingCount
    });
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
// 🔍 Search Users
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(200).json({ success: true, users: [] });

    const users = await User.find({
      $or: [
        { userName: { $regex: query, $options: "i" } },
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } }
      ]
    }).select("firstName lastName userName image").limit(10);

    return res.status(200).json({ success: true, users });
  } catch (error) {
    console.error("Search Users Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// 👤 Get Public Profile by Username
export const getPublicProfile = async (req, res) => {
  try {
    const { userName } = req.params;
    const foundUser = await User.findOne({ userName }).select("-password");
    if (!foundUser) return res.status(404).json({ success: false, message: "User not found" });

    const userPosts = await Post.find({ user: foundUser._id })
      .populate("user", "firstName lastName userName image")
      .populate("comments.user", "firstName lastName userName image")
      .sort({ createdAt: -1 });

    // Count followers and following
    const connectionData = await Connection.findOne({ userId: foundUser._id });
    const followersCount = connectionData ? connectionData.followers.length : 0;
    const followingCount = connectionData ? connectionData.following.length : 0;

    // Check if current user follows this user
    let isFollowing = false;
    const sessionId = req.cookies.sessionId;
    if (sessionId) {
      const session = await Session.findById(sessionId);
      if (session) {
        const currentUserConnection = await Connection.findOne({ userId: session.userId });
        if (currentUserConnection && currentUserConnection.following.includes(foundUser._id)) {
          isFollowing = true;
        }
      }
    }

    return res.status(200).json({
      success: true,
      user: foundUser,
      posts: userPosts,
      isFollowing,
      followersCount,
      followingCount
    });
  } catch (error) {
    console.error("Public Profile Fetch Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// 🤝 Follow User
export const followUser = async (req, res) => {
  try {
    const { userId } = req.body; // jise follow karna hai
    const sessionId = req.cookies.sessionId;

    if (!sessionId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const currentUserId = session.userId;

    // ❌ self follow block
    if (currentUserId.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself"
      });
    }

    // ✅ 1. Current user → following me add
    await Connection.findOneAndUpdate(
      { userId: currentUserId },
      {
        $addToSet: { following: userId }
      },
      { upsert: true, new: true }
    );

    // ✅ 2. Target user → followers me add
    await Connection.findOneAndUpdate(
      { userId: userId },
      {
        $addToSet: { followers: currentUserId }
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: "User followed successfully"
    });

  } catch (error) {
    console.error("Follow User Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

// 🙅 Unfollow User
export const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const sessionId = req.cookies.sessionId;

    if (!sessionId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const currentUserId = session.userId;

    // ❌ self unfollow edge case
    if (currentUserId.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Invalid operation"
      });
    }

    // ✅ 1. Current user → following se remove
    await Connection.findOneAndUpdate(
      { userId: currentUserId },
      {
        $pull: { following: userId }
      }
    );

    // ✅ 2. Target user → followers se remove
    await Connection.findOneAndUpdate(
      { userId: userId },
      {
        $pull: { followers: currentUserId }
      }
    );

    return res.status(200).json({
      success: true,
      message: "User unfollowed successfully"
    });

  } catch (error) {
    console.error("Unfollow User Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

// 👥 Get Connections (Followers/Following)
export const getConnections = async (req, res) => {
  try {
    const { userId } = req.params;
    const { type } = req.query; // 'followers' or 'following'
    const sessionId = req.cookies.sessionId;

    if (!sessionId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const session = await Session.findById(sessionId);
    if (!session) return res.status(401).json({ success: false, message: "Unauthorized" });

    const currentUserId = session.userId;

    const connectionData = await Connection.findOne({ userId })
      .populate(type, "firstName lastName userName image");

    if (!connectionData) {
      return res.status(200).json({ success: true, users: [] });
    }

    const users = connectionData[type];

    // Check if current user follows each user in the list
    const currentUserConnection = await Connection.findOne({ userId: currentUserId });
    const usersWithFollowStatus = users.map(user => {
      const isFollowing = currentUserConnection ? currentUserConnection.following.includes(user._id) : false;
      return {
        ...user.toObject(),
        isFollowing
      };
    });

    return res.status(200).json({
      success: true,
      users: usersWithFollowStatus
    });

  } catch (error) {
    console.error("Get Connections Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
// 📝 Update Profile
export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, image } = req.body;
    const sessionId = req.cookies.sessionId;

    if (!sessionId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const session = await Session.findById(sessionId);
    if (!session) return res.status(401).json({ success: false, message: "Unauthorized" });

    const updatedUser = await User.findByIdAndUpdate(
      session.userId,
      { 
        $set: { 
          firstName: firstName || undefined, 
          lastName: lastName || undefined,
          image: image || undefined 
        } 
      },
      { new: true }
    ).select("-password");

    if (!updatedUser) return res.status(404).json({ success: false, message: "User not found" });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
