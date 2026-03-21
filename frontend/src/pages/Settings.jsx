import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PostCard from '../components/PostCard';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [likedPosts, setLikedPosts] = useState([]);
  const [commentedPosts, setCommentedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('liked'); // 'liked' or 'commented'
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. Fetch user profile
      const userRes = await axios.get("http://localhost:5000/api/profile", { withCredentials: true });
      if (!userRes.data.success) throw new Error("Failed to fetch profile");
      const currentUser = userRes.data.user;
      setUser(currentUser);

      // 2. Fetch all feed posts to filter
      const postsRes = await axios.get("http://localhost:5000/api/feedPost", { withCredentials: true });
      if (postsRes.data.success) {
        const allPosts = postsRes.data.posts;
        
        // Filter liked posts
        const liked = allPosts.filter(post => 
          post.likes && post.likes.includes(currentUser._id)
        );
        setLikedPosts(liked);

        // Filter commented posts
        const commented = allPosts.filter(post => 
          post.comments && post.comments.some(c => c.user._id === currentUser._id || c.user === currentUser._id)
        );
        setCommentedPosts(commented);
      }
    } catch (err) {
      console.error("Settings data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/logout", {}, { withCredentials: true });
      if (res.data.success) {
        navigate('/login');
      }
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center pt-20 animate-pulse w-full max-w-2xl">
      <div className="h-8 w-48 bg-white/5 rounded-xl mb-12" />
      <div className="w-full space-y-6">
        {[1,2,3].map(i => <div key={i} className="h-40 bg-white/5 rounded-[2rem]" />)}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-2xl pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Settings</h1>
        <button 
          onClick={handleLogout}
          className="px-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm font-bold rounded-2xl border border-red-500/20 transition-all active:scale-95"
        >
          Logout
        </button>
      </div>

      <div className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-8 mb-10 shadow-xl">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-white/5 ring-4 ring-[#080810] shadow-lg shadow-indigo-500/10">
            {user?.image ? <img src={user.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white leading-none">{user?.firstName} {user?.lastName}</h2>
            <p className="text-indigo-400 font-medium text-sm mt-2">@{user?.userName}</p>
            <p className="text-white/30 text-xs mt-1">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex gap-2 p-1.5 bg-white/[0.03] rounded-2xl border border-white/5 w-fit">
          <button 
            onClick={() => setActiveTab('liked')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'liked' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-white/40 hover:text-white/60'
            }`}
          >
            Liked Posts ({likedPosts.length})
          </button>
          <button 
            onClick={() => setActiveTab('commented')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'commented' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-white/40 hover:text-white/60'
            }`}
          >
            Commented ({commentedPosts.length})
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {activeTab === 'liked' ? (
          likedPosts.length > 0 ? (
            likedPosts.map(post => <PostCard key={post._id} post={post} currentUser={user} />)
          ) : (
            <div className="text-center py-20 bg-white/[0.02] rounded-[2rem] border border-dashed border-white/10 text-white/20">
              No liked posts yet.
            </div>
          )
        ) : (
          commentedPosts.length > 0 ? (
            commentedPosts.map(post => <PostCard key={post._id} post={post} currentUser={user} />)
          ) : (
            <div className="text-center py-20 bg-white/[0.02] rounded-[2rem] border border-dashed border-white/10 text-white/20">
              No comments made yet.
            </div>
          )
        )}
      </div>
    </div>
  );
}
