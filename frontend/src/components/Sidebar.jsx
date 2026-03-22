import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Notifications from './Notifications';

const navItems = [
  { name: 'Home', path: '/', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )},
  { name: 'Notifications', path: '/notifications', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  )},
  { name: 'Search', path: '#search', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )},
  { name: 'Messages', path: '/messages', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  )},
  // { name: 'Profile', path: '/profile', icon: (
  //   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  //   </svg>
  // )},
  { name: 'Settings', path: '/settings', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )},
];

export default function Sidebar() {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/profile`, { withCredentials: true });
      if (res.data.success) {
        setCurrentUser(res.data.user);
        fetchUnreadCount(res.data.user.userName);
      }
    } catch (err) {
      console.error("Fetch profile error:", err);
    }
  };

  const fetchUnreadCount = async (userName) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/getNotification/${userName}`, { withCredentials: true });
      if (res.data.success) {
        const unread = res.data.notifications.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error("Fetch unread count error:", err);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim()) {
        try {
          setSearching(true);
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/searchUsers?query=${query}`, { withCredentials: true });
          if (res.data.success) setResults(res.data.users);
        } catch (err) {
          console.error("Search API error:", err);
        } finally {
          setSearching(false);
        }
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleUserClick = (userName) => {
    setIsSearching(false);
    setQuery('');
    setResults([]);
    navigate(`/user/${userName}`);
  };

  const isConversation = location.pathname.includes('/conversation') || location.pathname.includes('/messages');

  return (
    <aside 
      className={`fixed left-0 top-0 h-screen transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) bg-[#0c0c14]/60 backdrop-blur-3xl border-r border-white/10 lg:flex flex-col z-[100] shadow-2xl ${
        isSearching || isNotificationsOpen ? 'w-[400px]' : 'w-72'
      } ${isConversation ? '-translate-x-full' : 'translate-x-0'} hidden`}
    >
      
      {isNotificationsOpen ? (
        <div className="flex-1 animate-in fade-in slide-in-from-left duration-500">
          <Notifications 
            currentUser={currentUser} 
            isSidebar={true} 
            onClose={() => {
              setIsNotificationsOpen(false);
              setUnreadCount(0);
            }} 
          />
        </div>
      ) : isSearching ? (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-left duration-500 overflow-hidden">
          <div className="p-8 pb-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black text-white tracking-tighter italic">Search</h2>
              <button 
                onClick={() => setIsSearching(false)}
                className="p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl text-white/40 hover:text-white transition-all transform hover:scale-110"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="relative mb-8 group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-500" />
              <div className="relative">
                <input 
                  autoFocus
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Find creators..."
                  className="w-full bg-[#0c0c14] border border-white/10 rounded-2xl px-6 py-4 text-sm text-white placeholder-white/20 outline-none focus:border-indigo-500/50 transition-all shadow-2xl"
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {searching ? (
                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-3 custom-scrollbar">
            {results.length > 0 ? (
              results.map((user) => (
                <div 
                  key={user._id} 
                  onClick={() => handleUserClick(user.userName)}
                  className="flex items-center gap-4 p-4 rounded-[1.5rem] bg-white/[0.02] hover:bg-white/[0.06] transition-all cursor-pointer group border border-white/5 hover:border-white/10 shadow-sm"
                >
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white/5 ring-1 ring-white/10 group-hover:ring-indigo-500/50 transition-all duration-500">
                      {user.image ? <img src={user.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-[#0c0c14]" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-white text-base font-bold truncate tracking-tight">
                      {user.firstName} {user.lastName}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-white/30 text-[11px] font-medium truncate uppercase tracking-widest">
                        @{user.userName}
                      </span>
                    </div>
                  </div>
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
              ))
            ) : query.trim() ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-20">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-sm italic font-bold">No results for "{query}"</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 opacity-20">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <span className="text-sm italic font-bold">Explore the community</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="px-8 py-6">
            <img 
              src="/story.png" 
              alt="Story Logo" 
              className="h-10 w-auto object-contain transform hover:scale-105 transition-transform duration-500 cursor-pointer"
              onClick={() => navigate('/')}
            />
          </div>

          <nav className="flex flex-col gap-3 p-6">
            {navItems.map((item) => {
              const isActive = item.name === 'Search' ? isSearching : (item.name === 'Notifications' ? isNotificationsOpen : location.pathname === item.path);
              
              const handleClick = (e) => {
                if (item.name === 'Search') {
                  e.preventDefault();
                  setIsSearching(true);
                  setIsNotificationsOpen(false);
                } else if (item.name === 'Notifications') {
                  e.preventDefault();
                  setIsNotificationsOpen(true);
                  setIsSearching(false);
                }
              };

              return (item.name === 'Search' || item.name === 'Notifications') ? (
                <button
                  key={item.name}
                  onClick={handleClick}
                  className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 border border-transparent group
                    ${isActive 
                      ? "bg-white/[0.08] text-indigo-400 font-bold border-indigo-500/30 shadow-lg shadow-indigo-500/10" 
                      : "text-white/40 hover:text-white hover:bg-white/[0.04] hover:border-white/10"
                    }
                  `}
                >
                  <div className="relative">
                    <span className={`${isActive ? "text-indigo-400" : "text-white/30"} transition-colors`}>{item.icon}</span>
                    {item.name === 'Notifications' && unreadCount > 0 && !isNotificationsOpen && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#0c0c14] animate-pulse" />
                    )}
                  </div>
                  <span className="text-sm font-semibold tracking-wide">{item.name}</span>
                </button>
              ) : (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 border border-transparent
                    ${isActive 
                      ? "bg-white/[0.08] text-indigo-400 font-bold border-indigo-500/30 shadow-lg shadow-indigo-500/10 scale-[1.02]" 
                      : "text-white/40 hover:text-white hover:bg-white/[0.04] hover:border-white/10"
                    }
                  `}
                >
                  <span className={`${location.pathname === item.path ? "text-indigo-400" : "text-white/30"} transition-colors`}>
                    {item.icon}
                  </span>
                  <span className="text-sm font-semibold tracking-wide">{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-auto p-6 border-t border-white/[0.06]">

            <div 
              onClick={() => navigate('/profile')}
              className="flex items-center gap-4 p-4 rounded-3xl bg-white/[0.03] hover:bg-white/[0.08] transition-all duration-500 cursor-pointer border border-white/5 hover:border-white/10 group shadow-lg overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-white/5 to-indigo-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <div className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-indigo-500/40 transition-all duration-500 overflow-hidden shrink-0 shadow-inner">
                {currentUser?.image ? (
                  <img src={currentUser.image} alt="" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <span className="text-xl">👤</span>
                )}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-white text-[14px] font-bold truncate tracking-tight leading-none mb-1">
                  {currentUser?.firstName} {currentUser?.lastName}
                </span>
                <span className="text-white/20 text-[11px] font-medium text-left truncate uppercase tracking-widest">
                  @{currentUser?.userName}
                </span>
              </div>
              <div className="flex items-center text-white/10 group-hover:text-white/40 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </div>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
