import React, { useEffect, useState } from 'react';
import axios from 'axios';
import CreatePost from '../components/CreatePost';
import PostCard from '../components/PostCard';

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/feedPost`, { withCredentials: true });
      if (res.data.success) {
        setPosts(res.data.posts);
      }
    } catch (err) {
      console.error("Fetch feed error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/profile`, { withCredentials: true });
      if (res.data.success) {
        setCurrentUser(res.data.user);
      }
    } catch (err) {
      console.error("Fetch current user error:", err);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchCurrentUser();
  }, []);

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  return (
    <div className="w-full">
      <CreatePost onPostCreated={handlePostCreated} />

      {loading ? (
        <div className="space-y-6">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white/5 h-64 rounded-[2rem] animate-pulse" />
          ))}
        </div>
      ) : posts.length > 0 ? (
        <div className="space-y-2">
          {posts.map(post => (
            <PostCard key={post._id} post={post} currentUser={currentUser} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 px-6 bg-white/[0.02] rounded-[2rem] border border-dashed border-white/10">
          <div className="text-4xl mb-4">🌑</div>
          <h3 className="text-white/60 font-medium">No posts yet</h3>
          <p className="text-white/20 text-sm mt-1">Be the first to share something!</p>
        </div>
      )}
    </div>
  );
}
