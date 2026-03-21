import express from "express"
import { registerUser, verifyOtp,forgetPassword,verifyPassword,updatePassword,login ,logout ,checkSession} from "../controllers/useController.js"
import { postText, feedPost, likePost, unlikePost, commentPost, deleteComment, deletePost } from "../controllers/postController.js"
import { getProfile, searchUsers, getPublicProfile, followUser, unfollowUser, getConnections } from "../controllers/userController.js"
import { conversationUsers, createConversation, getMessages, sendMessage, deleteConversation } from "../controllers/chatController.js"
import { createNotification, getNotifications, removeNotification, markAsRead } from "../controllers/notificationController.js"


const router = express.Router()
router.post("/registerUser",registerUser)
router.post("/verifyOtp",verifyOtp)
router.post("/forgetPassword",forgetPassword)
router.post("/verifyPassword",verifyPassword)
router.post("/updatePassword",updatePassword)
router.post("/login",login)
router.post("/logout",logout)
router.get("/checkSession",checkSession)

// 📱 Social Routes
router.post("/postText", postText)
router.get("/feedPost", feedPost)
router.post("/likePost", likePost)
router.post("/unlikePost", unlikePost)
router.post("/commentPost", commentPost)
router.post("/deleteComment", deleteComment)
router.post("/deletePost", deletePost)
router.get("/conversationUsers", conversationUsers)
router.get("/profile", getProfile)

// 🔍 Search & Social
router.get("/searchUsers", searchUsers)
router.get("/publicProfile/:userName", getPublicProfile)
router.post("/followUser", followUser)
router.post("/unfollowUser", unfollowUser)
router.post("/createConversation", createConversation)
router.get("/messages/:conversationId", getMessages)
router.post("/sendMessage", sendMessage)
router.post("/deleteConversation", deleteConversation)
router.get("/getConnections/:userId", getConnections)

// 🔔 Notification Routes
router.post("/notification", createNotification)
router.post("/removeNotification", removeNotification)
router.get("/getNotification/:userName", getNotifications)
router.post("/markAsRead", markAsRead)

export default router
