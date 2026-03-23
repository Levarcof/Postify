import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

export default function Notifications({ currentUser, isSidebar = false, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const socket = useSocket();
  const [currentUserProfile, setCurrentUserProfile] = useState(currentUser);

  useEffect(() => {
    if (currentUser?.userName) {
      setCurrentUserProfile(currentUser);
      fetchNotifications(currentUser.userName);
      markAsRead(currentUser.userName);
    } else {
      fetchProfile();
    }
  }, [currentUser]);

  useEffect(() => {
    if (socket && currentUserProfile) {
      const handleNewNotification = (notification) => {
        setNotifications(prev => [notification, ...prev]);
        markAsRead(currentUserProfile.userName);
      };

      const handleRemoveNotification = ({ notificationId }) => {
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
      };

      socket.on("new-notification", handleNewNotification);
      socket.on("remove-notification", handleRemoveNotification);

      return () => {
        socket.off("new-notification", handleNewNotification);
        socket.off("remove-notification", handleRemoveNotification);
      };
    }
  }, [socket, currentUserProfile]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/profile`, { withCredentials: true });
      if (res.data.success) {
        setCurrentUserProfile(res.data.user);
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
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/getNotification/${userName}`);
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
      await axios.post(`${import.meta.env.VITE_API_URL}/api/markAsRead`, { userName });
      window.dispatchEvent(new Event('notifications-read'));
    } catch (err) {
      console.warn("Mark as read error:", err);
    }
  };

  const groupNotifications = (notifs) => {
    const now = new Date();
    const groups = {
      New: [],
      Today: [],
      Yesterday: [],
      Earlier: []
    };

    notifs.forEach(notif => {
      const createdDate = new Date(notif.createdAt);
      const diffInHours = (now - createdDate) / (1000 * 60 * 60);

      if (!notif.isRead) {
        groups.New.push(notif);
      } else if (diffInHours < 24) {
        groups.Today.push(notif);
      } else if (diffInHours < 48) {
        groups.Yesterday.push(notif);
      } else {
        groups.Earlier.push(notif);
      }
    });

    return groups;
  };

  const handleNotificationClick = (notif) => {
    if (onClose) onClose();
    navigate('/');
  };

  const grouped = groupNotifications(notifications);

  return (
    <div className={`flex flex-col h-full bg-[#0c0c14] text-white ${isSidebar ? 'w-full' : 'min-h-screen pb-32'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-3xl sticky top-0 z-10 ${isSidebar ? 'p-6' : 'px-8 py-6'}`}>
        <h2 className="text-xl font-black italic tracking-tight text-white/90">Activity</h2>
        {isSidebar && (
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      <div className={`flex-1 overflow-y-auto custom-scrollbar ${isSidebar ? 'px-2' : 'max-w-2xl mx-auto w-full pt-4'}`}>
        {loading ? (
          <div className="space-y-4 px-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="flex gap-4 p-2 items-center">
                <div className="w-11 h-11 bg-white/[0.03] rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/[0.03] rounded w-1/3 animate-pulse" />
                  <div className="h-2 bg-white/[0.03] rounded w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <div className="pb-8">
            {Object.entries(grouped).map(([title, items]) => {
              if (items.length === 0) return null;
              return (
                <div key={title} className="mb-6">
                  <h3 className="px-6 py-3 text-[12px] font-black uppercase tracking-[0.2em] text-white/20">{title}</h3>
                  <div className="space-y-0.5">
                    {items.map((notif) => (
                      <div 
                        key={notif._id} 
                        className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/[0.03] transition-all group cursor-pointer relative"
                        onClick={() => handleNotificationClick(notif)}
                      >
                        <div 
                          className="w-11 h-11 rounded-full overflow-hidden bg-white/5 border border-white/5 shrink-0"
                          onClick={(e) => { e.stopPropagation(); navigate(`/user/${notif.sender.userName}`); }}
                        >
                          {notif.sender.userId?.image ? <img src={notif.sender.userId.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg">👤</div>}
                        </div>
                        
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="text-[13px] leading-tight text-white/80">
                            <span className="text-white font-bold hover:text-indigo-400 mr-1.5 cursor-pointer"
                              onClick={(e) => { e.stopPropagation(); navigate(`/user/${notif.sender.userName}`); }}
                            >
                              {notif.sender.userName}
                            </span>
                            <span className="text-white/50">
                              {notif.type === 'like' ? 'liked your story.' : 
                               notif.type === 'follow' ? 'started following you.' : 
                               'commented on your story.'}
                            </span>
                          </p>
                          <p className="text-white/20 text-[10.5px] font-bold tracking-wide mt-1 uppercase">
                            {(() => {
                              const d = new Date(notif.createdAt);
                              const now = new Date();
                              const diff = (now - d) / 1000;
                              if (diff < 60) return 'Just now';
                              if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
                              if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
                              return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
                            })()}
                          </p>
                          
                          {notif.type === 'comment' && (
                            <p className="text-white/30 text-[12px] mt-1.5 line-clamp-1 border-l-2 border-white/5 pl-3">
                              "{notif.commentText}"
                            </p>
                          )}
                        </div>

                        {notif.postId && (
                          <div className="w-11 h-11 rounded-md overflow-hidden shrink-0 border border-white/5 bg-white/[0.01]">
                            {notif.postId.image ? (
                              <img src={notif.postId.image} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-white/[0.02] p-1.5">
                                <span className="text-[7px] text-white/10 line-clamp-3 text-center leading-none tracking-tight">{notif.postId.content}</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {!notif.isRead && (
                          <div className="absolute right-4 w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center opacity-10">
            <svg className="w-16 h-16 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            <span className="text-sm font-black italic uppercase tracking-[0.3em] text-center px-8">Your universe is currently silent</span>
          </div>
        )}
      </div>
    </div>
  );
}