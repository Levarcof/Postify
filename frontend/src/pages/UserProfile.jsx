import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PostCard from '../components/PostCard';
import ImageModal from '../components/ImageModal';

export default function UserProfile() {
  const { userName } = useParams();
  const [profile, setProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'followers' or 'following'
  const [connections, setConnections] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch public profile
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/publicProfile/${userName}`, { withCredentials: true });
      if (res.data.success) {
        setProfile(res.data.user);
        setPosts(res.data.posts);
        setIsFollowing(res.data.isFollowing);
        setFollowersCount(res.data.followersCount);
        setFollowingCount(res.data.followingCount);
      }
      
      // Fetch current user for context
      const currRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/profile`, { withCredentials: true });
      if (currRes.data.success) {
        setCurrentUser(currRes.data.user);
      }
    } catch (err) {
      console.error("Fetch User Profile Error:", err);
    } finally {
      window.scrollTo(0, 0); 
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userName]);

  const handleFollow = async () => {
    try {
      const endpoint = isFollowing ? "/api/unfollowUser" : "/api/followUser";
      const res = await axios.post(`${import.meta.env.VITE_API_URL}${endpoint}`, { userId: profile._id }, { withCredentials: true });
      if (res.data.success) {
        setIsFollowing(!isFollowing);
        setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
      }
    } catch (err) {
      console.error("Follow/Unfollow Error:", err);
    }
  };

  const handleMessage = async () => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/createConversation`, { userId: profile._id }, { withCredentials: true });
      if (res.data.success) {
        navigate(`/conversation/${res.data.conversationId}`);
      }
    } catch (err) {
      console.error("Message initiation error:", err);
    }
  };

  const fetchConnections = async (type) => {
    try {
      setModalType(type);
      setIsModalOpen(true);
      setModalLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/getConnections/${profile._id}?type=${type}`, { withCredentials: true });
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
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/followUser`, { userId }, { withCredentials: true });
      if (res.data.success) {
        setConnections(prev => prev.map(u => u._id === userId ? { ...u, isFollowing: true } : u));
        // If the user being followed is the profile user, we might want to update the count
        if (userId === profile._id) {
          setFollowersCount(prev => prev + 1);
          setIsFollowing(true);
        }
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

  if (!profile) return <div className="text-center pt-20 text-white/40 font-medium">User not found</div>;

  return (
    <div className="w-full pb-20 relative">

      {/* Mobile Hamburger Menu */}
      {/* <div className="lg:hidden absolute top-0 right-0 p-4 z-50">
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div> */}

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
                   await axios.post(`${import.meta.env.VITE_API_URL}/api/logout`, {}, { withCredentials: true });
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

      {/* Navigation Header */}
      <div className="px-6 lg:px-0 max-w-2xl mx-auto w-full pt-6 mb-4">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center bg-white/[0.03] backdrop-blur-3xl hover:bg-white/[0.08] rounded-full border border-white/10 transition-all active:scale-95 group shadow-xl"
          title="Back"
        >
          <svg className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Header Info */}
      <div className="px-6 lg:px-0 max-w-2xl mx-auto w-full mb-8">
        <div className="flex items-center gap-6 mb-6">
          <div className="relative group shrink-0">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur opacity-25" />
            <div 
              className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden bg-[#080810] border-4 border-[#080810] ring-1 ring-white/10 cursor-pointer hover:opacity-90 transition-all active:scale-95 shadow-2xl"
              onClick={() => setIsImageModalOpen(true)}
            >
              {profile.image ? <img src={profile.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl md:text-4xl">👤</div>}
            </div>
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-tight truncate">
              {profile.firstName} {profile.lastName}
            </h1>
            <p className="text-indigo-400 font-medium tracking-wide text-xs md:text-sm">@{profile.userName}</p>
          </div>
        </div>

        {/* Action Buttons */}
        {currentUser?._id !== profile._id && (
          <div className="flex gap-3 w-full">
            <button 
              onClick={handleFollow}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all duration-300 shadow-lg ${
                isFollowing 
                ? "bg-white/[0.08] text-white border border-white/10 hover:bg-white/[0.12]" 
                : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-indigo-500/20 hover:scale-105 active:scale-95"
              }`}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
            <button 
              onClick={handleMessage}
              className="flex-1 py-2.5 rounded-xl font-bold text-xs md:text-sm bg-white/[0.08] text-white border border-white/10 hover:bg-white/[0.12] transition-all duration-300 shadow-lg"
            >
              Message
            </button>
          </div>
        )}
      </div>

      {/* Stats Section */}
      <div className="w-full flex justify-center mb-10 px-6 lg:px-0">
        <div className="flex gap-10 py-4 px-10 bg-white/[0.02] rounded-3xl border border-white/5 backdrop-blur-md">
          <div className="flex flex-col items-center">
            <span className="text-white font-bold text-lg leading-tight">{posts.length}</span>
            <span className="text-white/30 text-[10px] uppercase font-black tracking-widest">Posts</span>
          </div>
          <div 
            className="flex flex-col items-center cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => fetchConnections('followers')}
          >
            <span className="text-white font-bold text-lg leading-tight">{followersCount}</span>
            <span className="text-white/30 text-[10px] uppercase font-black tracking-widest">Followers</span>
          </div>
          <div 
            className="flex flex-col items-center cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => fetchConnections('following')}
          >
            <span className="text-white font-bold text-lg leading-tight">{followingCount}</span>
            <span className="text-white/30 text-[10px] uppercase font-black tracking-widest">Following</span>
          </div>
        </div>
      </div>
      
      {/* Posts */}
      <div className="space-y-6">
        <h3 className="text-white/20 text-[10px] uppercase font-bold tracking-[0.3em] flex items-center gap-4 mb-8">
          <div className="h-px bg-white/10 flex-1" />
          Recent Activity
          <div className="h-px bg-white/10 flex-1" />
        </h3>
        {posts.length > 0 ? (
          posts.map(post => <PostCard key={post._id} post={post} currentUser={currentUser} />)
        ) : (
          <div className="text-center py-20 bg-white/[0.02] rounded-[2rem] border border-dashed border-white/10 text-white/20">
            This user hasn't posted anything yet.
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
      {/* Image Modal */}
      <ImageModal 
        isOpen={isImageModalOpen} 
        onClose={() => setIsImageModalOpen(false)} 
        imageUrl={profile.image} 
      />
    </div>
  );
}
