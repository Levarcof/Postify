import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ConfirmationModal from './ConfirmationModal';

export default function PostCard({ post, currentUser }) {
  const [likes, setLikes] = useState(post.likes?.length || 0);
  const [isLiked, setIsLiked] = useState(post.likes?.includes(currentUser?._id));
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState(post.comments || []);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (currentUser?._id) {
      setIsLiked(post.likes?.includes(currentUser._id));
    }
  }, [currentUser, post.likes]);


  const handleLike = async () => {
    try {
      const endpoint = isLiked ? "/api/unlikePost" : "/api/likePost";
      const res = await axios.post(`http://localhost:5000${endpoint}`, { postId: post._id }, { withCredentials: true });
      if (res.data.success) {
        setIsLiked(!isLiked);
        setLikes(prev => isLiked ? prev - 1 : prev + 1);

        // 🔔 Notification Trigger
        if (!isLiked) {
          await axios.post("http://localhost:5000/api/notification", {
            recipientUserName: post.user?.userName,
            type: "like",
            postId: post._id
          }, { withCredentials: true });
        } else {
          await axios.post("http://localhost:5000/api/removeNotification", {
            recipientUserName: post.user?.userName,
            type: "like",
            postId: post._id
          }, { withCredentials: true });
        }
      }
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      const res = await axios.post("http://localhost:5000/api/commentPost", { postId: post._id, text: commentText }, { withCredentials: true });
      if (res.data.success) {
        setComments(res.data.comments);
        
        // 🔔 Notification Trigger
        await axios.post("http://localhost:5000/api/notification", {
          recipientUserName: post.user?.userName,
          type: "comment",
          postId: post._id,
          commentText: commentText
        }, { withCredentials: true });

        setCommentText('');
      }
    } catch (err) {
      console.error("Comment error:", err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const res = await axios.post("http://localhost:5000/api/deleteComment", { postId: post._id, commentId }, { withCredentials: true });
      if (res.data.success) {
        setComments(res.data.comments);

        // 🔔 Notification Removal Trigger
        await axios.post("http://localhost:5000/api/removeNotification", {
          recipientUserName: post.user?.userName,
          type: "comment",
          postId: post._id
        }, { withCredentials: true });
      }
    } catch (err) {
      console.error("Delete comment error:", err);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/deletePost", { postId: post._id }, { withCredentials: true });
      if (res.data.success) {
        window.location.reload(); 
      }
    } catch (err) {
      console.error("Delete post error:", err);
      alert("Failed to delete post. Please try again.");
    }
  };

  return (
    <>
      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Story?"
        message="This will permanently remove your story from the universe. This action cannot be undone."
        confirmText="Yes, Delete"
      />
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-[2rem] overflow-hidden mb-6 group hover:bg-white/[0.05] transition-all duration-500">
        {/* Post Header */}
        <div className="p-5 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate(`/user/${post.user?.userName}`)}
          >
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-white/10 text-lg overflow-hidden shrink-0">
              {post.user?.image ? <img src={post.user.image} alt="" className="w-full h-full object-cover" /> : "👤"}
            </div>
            <div className="flex flex-col">
              <span className="text-white text-sm font-semibold tracking-tight leading-none">
                {post.user?.firstName} {post.user?.lastName}
              </span>
              <span className="text-white/30 text-[11px] font-medium tracking-wide mt-1">
                @{post.user?.userName} • {new Date(post.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {currentUser?._id === post.user?._id && (
              <button 
                onClick={() => setIsDeleteModalOpen(true)}
                className="p-2 text-white/10 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                title="Delete Post"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            )}
          <button className="p-2 text-white/20 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
          </button>
        </div>
      </div>

      {/* Post Content */}
      <div className="px-6 pb-4">
        <p className="text-white/80 leading-relaxed text-[15px] whitespace-pre-wrap">{post.content}</p>
        {post.image && (
          <div className="mt-4 rounded-2xl overflow-hidden border border-white/[0.08]">
            <img src={post.image} alt="" className="w-full object-cover max-h-[400px]" />
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="px-6 py-4 flex items-center gap-6 border-t border-white/[0.04] bg-white/[0.01]">
        <button 
          onClick={handleLike}
          className={`flex items-center gap-2 group/btn transition-all ${isLiked ? "text-rose-500 animate-heart-pop" : "text-white/40 hover:text-rose-400"}`}
        >
          <div className={`p-2 rounded-full transition-colors ${isLiked ? "bg-rose-500/10" : "group-hover/btn:bg-rose-500/5"}`}>
            <svg className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <span className="text-xs font-bold font-mono tracking-widest">{likes}</span>
        </button>

        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-white/40 hover:text-indigo-400 group/btn transition-all"
        >
          <div className="p-2 rounded-full group-hover/btn:bg-indigo-500/5 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <span className="text-xs font-bold font-mono tracking-widest">{comments.length}</span>
        </button>

        <button className="ml-auto p-2 text-white/20 hover:text-white transition-colors rounded-full hover:bg-white/5">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-6 pb-6 bg-white/[0.01] border-t border-white/[0.03] animate-in slide-in-from-top duration-300">
          <div className="py-4 space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
            {comments.map((comment, index) => (
              <div key={index} className="flex gap-3">
                <div 
                  className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10 text-[10px] overflow-hidden cursor-pointer hover:border-indigo-500/50 transition-colors"
                  onClick={() => navigate(`/user/${comment.user?.userName}`)}
                >
                  {comment.user?.image ? <img src={comment.user.image} alt="" className="w-full h-full object-cover" /> : "👤"}
                </div>
                <div className="flex-1 bg-white/[0.04] p-3 rounded-2xl border border-white/5 relative group/comment transition-colors hover:border-white/10">
                  <div className="flex items-center justify-between mb-1">
                    <span 
                      className="text-white text-[11px] font-bold cursor-pointer hover:text-indigo-400 transition-colors"
                      onClick={() => navigate(`/user/${comment.user?.userName}`)}
                    >
                      @{comment.user?.userName || "unknown"}
                    </span>
                    <span className="text-white/20 text-[9px]">{new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-white/70 text-xs leading-relaxed pr-6">{comment.text}</p>
                  
                  {(comment.user?._id === currentUser?._id || post.user?._id === currentUser?._id) && (
                    <button 
                      onClick={() => handleDeleteComment(comment._id)}
                      className="absolute top-2 right-2 p-1 text-white/0 group-hover/comment:text-white/20 hover:!text-rose-500 transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" /></svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <div className="text-center py-4 text-white/20 text-xs italic">No comments yet. Be the first!</div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/[0.06]">
            <input 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-indigo-500/50"
              onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
            />
            <button 
              onClick={handleAddComment}
              className="p-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl transition-all"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
            </button>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
