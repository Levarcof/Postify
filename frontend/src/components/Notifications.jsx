import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Notifications({ currentUser, isSidebar = false, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser?.userName) {
      fetchNotifications(currentUser.userName);
      markAsRead(currentUser.userName);
    } else {
      fetchProfile();
    }
  }, [currentUser]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/profile", { withCredentials: true });
      if (res.data.success) {
        fetchNotifications(res.data.user.userName);
        markAsRead(res.data.user.userName);
      }
    } catch (err) {
      console.error("Fetch profile error:", err);
    }
  };

  const fetchNotifications = async (userName) => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/getNotification/${userName}`);
      if (res.data.success) {
        setNotifications(res.data.notifications);
      }
    } catch (err) {
      console.error("Fetch notifications error:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (userName) => {
    try {
      await axios.post("http://localhost:5000/api/markAsRead", { userName });
    } catch (err) {
      console.warn("Mark as read error:", err);
    }
  };

  const handleNotificationClick = (notif) => {
    if (onClose) onClose();
    navigate('/');
  };

  return (
    <div className={`flex flex-col h-full bg-[#0c0c14]/40 backdrop-blur-3xl text-white ${isSidebar ? 'w-full' : 'min-h-screen pt-8 pb-32 px-4 sm:px-8'}`}>
      <div className={`flex items-center justify-between mb-10 ${isSidebar ? 'p-8 pb-0' : 'max-w-2xl mx-auto w-full pt-16 sm:pt-0'}`}>
        <h2 className="text-3xl font-black italic tracking-tighter text-white">Activity</h2>
        {isSidebar && (
          <button onClick={onClose} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl text-white/40 hover:text-white transition-all transform hover:scale-110">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      <div className={`flex-1 overflow-y-auto custom-scrollbar ${isSidebar ? 'px-6 pb-8' : 'max-w-2xl mx-auto w-full'}`}>
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-4 p-2 items-center">
                <div className="w-14 h-14 bg-white/5 rounded-2xl animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/5 rounded w-1/3 animate-pulse" />
                  <div className="h-3 bg-white/5 rounded w-2/3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <div 
                key={notif._id} 
                className={`
                  relative flex gap-4 p-4 rounded-[1.8rem] transition-all duration-500 hover:bg-white/[0.06] group cursor-pointer border border-transparent hover:border-white/5
                  ${!notif.isRead ? 'after:content-[""] after:absolute after:right-6 after:top-1/2 after:-translate-y-1/2 after:w-2.5 after:h-2.5 after:bg-indigo-500 after:rounded-full after:shadow-[0_0_10px_rgba(99,102,241,0.5)]' : ''}
                `}
                onClick={() => handleNotificationClick(notif)}
              >
                <div 
                  className="w-12 h-12 rounded-[1.2rem] bg-white/5 border border-white/10 overflow-hidden shrink-0 transform group-hover:scale-105 transition-all duration-500 shadow-xl"
                  onClick={(e) => { e.stopPropagation(); navigate(`/user/${notif.sender.userName}`); }}
                >
                  {notif.sender.userId?.image ? <img src={notif.sender.userId.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">👤</div>}
                </div>
                
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex flex-wrap items-baseline gap-1.5 pt-0.5">
                    <span className="text-white font-bold text-[13px] tracking-tight hover:text-indigo-400" onClick={(e) => { e.stopPropagation(); navigate(`/user/${notif.sender.userName}`); }}>
                      {notif.sender.userId?.firstName} {notif.sender.userId?.lastName}
                    </span>
                    <span className="text-white/40 text-[12px] tracking-tight">
                      {notif.type === 'like' ? 'liked your post' : 'commented on your post'}
                    </span>
                  </div>
                  
                  {notif.type === 'comment' && (
                    <p className="text-white/30 text-[11px] mt-1.5 italic tracking-tight line-clamp-1 border-l border-indigo-500/30 pl-3 py-0.5 bg-indigo-500/[0.02] rounded-r-lg">
                      "{notif.commentText}"
                    </p>
                  )}
                  
                  <span className="text-white/20 text-[9px] uppercase font-black tracking-widest mt-2 block opacity-60">
                    {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {notif.postId && (
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-white/5 grayscale group-hover:grayscale-0 transition-all duration-700 bg-white/[0.02] flex items-center justify-center">
                    {notif.postId.image ? (
                      <img src={notif.postId.image} alt="" className="w-full h-full object-cover opacity-30 group-hover:opacity-100" />
                    ) : (
                      <span className="text-[8px] text-white/10 px-1 line-clamp-2 text-center leading-tight">{notif.postId.content}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center opacity-10">
            <svg className="w-24 h-24 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            <span className="text-lg font-black italic uppercase tracking-widest">Quiet in the universe</span>
          </div>
        )}
      </div>
    </div>
  );
}