import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import axios from 'axios';

const navItems = [
  { name: 'Home', path: '/', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
  )},
  { name: 'Search', path: '/search', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
  )},
  { name: 'Messages', path: '/messages', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
  )},
  { name: 'Notifications', path: '/notifications', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
  )},
  { name: 'Profile', path: '/profile', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
  )},
];

export default function MobileNav() {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [profile, setProfile] = React.useState(null);

  React.useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/profile", { withCredentials: true });
      if (res.data.success) {
        setProfile(res.data.user);
        fetchUnreadCount(res.data.user.userName);
      }
    } catch (err) {
      console.error("Fetch profile error:", err);
    }
  };

  const fetchUnreadCount = async (userName) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/getNotification/${userName}`, { withCredentials: true });
      if (res.data.success) {
        const unread = res.data.notifications.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error("Fetch unread count error:", err);
    }
  };

  const isConversation = location.pathname.includes('/conversation/');

  if (isConversation) return null;

  return (
    <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-sm z-[100] animate-in slide-in-from-bottom duration-500">
      <nav className="bg-[#0c0c14]/80 backdrop-blur-2xl border border-white/10 h-16 rounded-[2rem] flex items-center justify-around px-2 shadow-2xl shadow-black/50 overflow-hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => `
              relative flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-500
              ${isActive ? "text-indigo-400" : "text-white/30 hover:text-white/50"}
            `}
          >
            {({ isActive }) => (
              <>
                <div className={`transition-all duration-300 transform ${isActive ? 'scale-110 -translate-y-0.5' : 'scale-100'} relative`}>
                  {item.icon}
                  {item.name === 'Notifications' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#0c0c14] animate-pulse" />
                  )}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                  {item.name}
                </span>
                {isActive && (
                  <div className="absolute -bottom-1 w-8 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
