import { Post } from "../models/Posts.js";
import { User } from "../models/User.js";

// 📝 Create Post
export const postText = async (req, res) => {
  try {
    const { content, image } = req.body;
    const userId = req.cookies.sessionId; // Assuming sessionId maps to userId via session record

    // In a real app, we'd look up the session to get the actual userId.
    // For now, let's assume we have a middleware or we fetch it here.
    // Let's check useController.js logic for sessions.
    
    // We need the actual userId from the session.
    const { Session } = await import("../models/Session.js");
    const session = await Session.findById(req.cookies.sessionId);
    
    if (!session) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const newPost = await Post.create({
      user: session.userId,
      content,
      image: image || "",
      likes: [],
      comments: []
    });

    const populatedPost = await Post.findById(newPost._id).populate("user", "firstName lastName userName image");

    return res.status(201).json({
      success: true,
      message: "Post created successfully",
      post: populatedPost
    });
  } catch (error) {
    console.error("Create Post Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// 📰 Fetch Feed
export const feedPost = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "firstName lastName userName image")
      .populate("comments.user", "firstName lastName userName image")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      posts
    });
  } catch (error) {
    console.error("Fetch Feed Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ❤️ Like Post
export const likePost = async (req, res) => {
  try {
    const { postId } = req.body;
    const { Session } = await import("../models/Session.js");
    const session = await Session.findById(req.cookies.sessionId);

    if (!session) return res.status(401).json({ success: false, message: "Unauthorized" });

    await Post.findByIdAndUpdate(postId, {
      $addToSet: { likes: session.userId }
    });

    return res.status(200).json({ success: true, message: "Post liked" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// 💔 Unlike Post
export const unlikePost = async (req, res) => {
  try {
    const { postId } = req.body;
    const { Session } = await import("../models/Session.js");
    const session = await Session.findById(req.cookies.sessionId);

    if (!session) return res.status(401).json({ success: false, message: "Unauthorized" });

    await Post.findByIdAndUpdate(postId, {
      $pull: { likes: session.userId }
    });

    return res.status(200).json({ success: true, message: "Post unliked" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// 💬 Comment Post
export const commentPost = async (req, res) => {
  try {
    const { postId, text } = req.body;
    const { Session } = await import("../models/Session.js");
    const session = await Session.findById(req.cookies.sessionId);

    if (!session) return res.status(401).json({ success: false, message: "Unauthorized" });

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      {
        $push: { comments: { user: session.userId, text } }
      },
      { new: true }
    ).populate("comments.user", "firstName lastName userName image");

    return res.status(200).json({
      success: true,
      message: "Comment added",
      comments: updatedPost.comments
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
// 🗑️ Delete Comment
export const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.body;
    const { Session } = await import("../models/Session.js");
    const session = await Session.findById(req.cookies.sessionId);

    if (!session) return res.status(401).json({ success: false, message: "Unauthorized" });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    // Find the comment
    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });

    // Check ownership: current user must be comment author OR post owner
    if (comment.user.toString() !== session.userId.toString() && 
        post.user.toString() !== session.userId.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    // Remove the comment
    post.comments.pull(commentId);
    await post.save();

    const updatedPost = await Post.findById(postId).populate("comments.user", "firstName lastName userName image");

    return res.status(200).json({
      success: true,
      message: "Comment deleted",
      comments: updatedPost.comments
    });
  } catch (error) {
    console.error("Delete Comment Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
// 🗑️ Delete Post
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.body;
    const { Session } = await import("../models/Session.js");
    const session = await Session.findById(req.cookies.sessionId);

    if (!session) return res.status(401).json({ success: false, message: "Unauthorized" });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    // Check ownership
    if (post.user.toString() !== session.userId.toString()) {
      return res.status(403).json({ success: false, message: "You can only delete your own posts" });
    }

    await Post.findByIdAndDelete(postId);

    return res.status(200).json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    console.error("Delete Post Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
