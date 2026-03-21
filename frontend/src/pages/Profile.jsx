import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PostCard from '../components/PostCard';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'followers' or 'following'
  const [connections, setConnections] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:5000/api/profile", { withCredentials: true });
        if (res.data.success) {
          setProfile(res.data.user);
          setPosts(res.data.posts);
          setFollowersCount(res.data.followersCount);
          setFollowingCount(res.data.followingCount);
        }
      } catch (err) {
        console.error("Fetch profile error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const fetchConnections = async (type) => {
    try {
      setModalType(type);
      setIsModalOpen(true);
      setModalLoading(true);
      const res = await axios.get(`http://localhost:5000/api/getConnections/${profile._id}?type=${type}`, { withCredentials: true });
      if (res.data.success) {
        setConnections(res.data.users);
      }
    } catch (err) {
      console.error("Fetch connections error:", err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleModalFollow = async (userId) => {
    try {
      const res = await axios.post("http://localhost:5000/api/followUser", { userId }, { withCredentials: true });
      if (res.data.success) {
        setConnections(prev => prev.map(u => u._id === userId ? { ...u, isFollowing: true } : u));
        setFollowingCount(prev => prev + 1);
      }
    } catch (err) {
      console.error("Follow error in modal:", err);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center pt-20 w-full max-w-2xl px-4">
      <div className="w-32 h-32 rounded-full skeleton mb-6" />
      <div className="h-8 w-48 skeleton rounded-xl mb-4" />
      <div className="h-4 w-32 skeleton rounded-xl mb-12" />
      <div className="w-full space-y-6">
        {[1,2].map(i => <div key={i} className="h-64 w-full skeleton rounded-[2.5rem]" />)}
      </div>
    </div>
  );

  if (!profile) return <div className="text-center pt-20 text-white/40">Failed to load profile.</div>;

  return (
    <div className="w-full pb-10 relative">
      {/* Mobile Hamburger Menu */}
      <div className="lg:hidden absolute top-0 right-0 p-4 z-50">
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsDrawerOpen(false)}
        >
          <div 
            className="absolute top-0 right-0 w-72 h-full bg-[#0c0c14] border-l border-white/10 p-8 flex flex-col gap-8 animate-in slide-in-from-right duration-500"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-white">Menu</span>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 hover:bg-white/5 rounded-full"
              >
                <span className="text-2xl text-white/40">&times;</span>
              </button>
            </div>

            <nav className="flex flex-col gap-4">
              {[
                { name: 'Home', path: '/', icon: "🏠" },
                { name: 'Notifications', path: '/notifications', icon: "🔔" },
                { name: 'Search', path: '/search', icon: "🔍" },
                { name: 'Messages', path: '/messages', icon: "💬" },
                { name: 'Settings', path: '/settings', icon: "⚙️" },
              ].map(item => (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.path);
                    setIsDrawerOpen(false);
                  }}
                  className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 text-white/60 hover:text-white transition-all border border-transparent hover:border-white/5"
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-semibold">{item.name}</span>
                </button>
              ))}
            </nav>

            <div className="mt-auto">
              <button 
                onClick={async () => {
                   await axios.post("http://localhost:5000/api/logout", {}, { withCredentials: true });
                   navigate('/login');
                }}
                className="w-full p-4 rounded-2xl bg-red-500/10 text-red-500 font-bold border border-red-500/10 active:scale-95 transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="flex flex-col items-center mb-12">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative w-32 h-32 rounded-full overflow-hidden bg-[#080810] border-4 border-[#080810] ring-1 ring-white/10 shrink-0">
            {profile.image ? (
              <img src={profile.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl">👤</div>
            )}
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-white mt-6 tracking-tight">
          {profile.firstName} {profile.lastName}
        </h1>
        <p className="text-indigo-400 font-medium tracking-wide mt-1">@{profile.userName}</p>
        <p className="text-white/30 text-sm mt-1">{profile.email}</p>

        <div className="flex gap-8 mt-8 py-4 px-8 bg-white/[0.03] rounded-2xl border border-white/5">
          <div className="flex flex-col items-center">
            <span className="text-white font-bold text-lg">{posts.length}</span>
            <span className="text-white/20 text-[10px] uppercase tracking-widest font-bold">Posts</span>
          </div>
          <div 
            className="flex flex-col items-center cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => fetchConnections('followers')}
          >
            <span className="text-white font-bold text-lg">{followersCount}</span>
            <span className="text-white/20 text-[10px] uppercase tracking-widest font-bold">Followers</span>
          </div>
          <div 
            className="flex flex-col items-center cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => fetchConnections('following')}
          >
            <span className="text-white font-bold text-lg">{followingCount}</span>
            <span className="text-white/20 text-[10px] uppercase tracking-widest font-bold">Following</span>
          </div>
        </div>
      </div>

      {/* User Posts */}
      <div className="space-y-6">
        <h3 className="text-white/40 text-xs font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <span className="w-8 h-px bg-white/10" />
          My Posts
          <span className="w-full h-px bg-white/10" />
        </h3>
        {posts.length > 0 ? (
          posts.map(post => <PostCard key={post._id} post={{ ...post, user: profile }} currentUser={profile} />)
        ) : (
          <div className="text-center py-20 bg-white/[0.02] rounded-[2rem] border border-dashed border-white/10 text-white/20">
            No posts shared yet.
          </div>
        )}
      </div>
      {/* Connections Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#0c0c14] border border-white/10 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <h2 className="text-xl font-bold text-white capitalize">{modalType}</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors"
              >
                <span className="text-2xl text-white/40">&times;</span>
              </button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
              {modalLoading ? (
                <div className="space-y-4 animate-pulse">
                  {[1,2,3].map(i => <div key={i} className="h-20 bg-white/5 rounded-3xl" />)}
                </div>
              ) : connections.length > 0 ? (
                <div className="space-y-2">
                  {connections.map((user) => (
                    <div 
                      key={user._id}
                      className="flex items-center justify-between p-4 rounded-3xl hover:bg-white/[0.03] border border-transparent hover:border-white/5 transition-all group"
                    >
                      <div 
                        className="flex items-center gap-4 cursor-pointer min-w-0"
                        onClick={() => {
                          setIsModalOpen(false);
                          navigate(`/user/${user.userName}`);
                        }}
                      >
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-white/5 ring-1 ring-white/10">
                          {user.image ? <img src={user.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">👤</div>}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-white font-bold text-sm truncate">{user.firstName} {user.lastName}</span>
                          <span className="text-white/30 text-xs truncate">@{user.userName}</span>
                        </div>
                      </div>

                      {user.isFollowing ? (
                        <button 
                          disabled 
                          className="px-6 py-2 rounded-xl bg-white/[0.05] text-white/40 text-xs font-bold border border-white/5 cursor-not-allowed"
                        >
                          Friend
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleModalFollow(user._id)}
                          className="px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
                        >
                          Follow
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 text-white/20 text-sm">No {modalType} yet.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
