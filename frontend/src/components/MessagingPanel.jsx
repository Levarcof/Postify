import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
export default function MessagingPanel() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const socket = useSocket();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/conversationUsers`, { withCredentials: true });
        if (res.data.success) setUsers(res.data.users);
      } catch (err) {
        console.error("Fetch message users error:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchCurrentUser = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/profile`, { withCredentials: true });
        if (res.data.success) setCurrentUser(res.data.user);
      } catch (err) {
        console.error("Fetch current user error:", err);
      }
    };

    fetchUsers();
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (!socket || !currentUser) return;

    const handleNewMessage = (message) => {
      const msgConvId = String(message.conversationId?._id || message.conversationId);
      
      setUsers(prev => {
        let updated = [...prev];
        const idx = updated.findIndex(c => String(c.conversationId) === msgConvId);
        
        if (idx !== -1) {
          const conv = updated[idx];
          updated.splice(idx, 1);
          updated.unshift({
            ...conv,
            lastMessage: message,
            unreadCount: (conv.unreadCount || 0) + 1
          });
        } else {
          // New conversation not in list
          axios.get(`${import.meta.env.VITE_API_URL}/api/conversationUsers`, { withCredentials: true })
            .then(res => {
              if (res.data.success) setUsers(res.data.users);
            }).catch(console.error);
        }
        return updated;
      });
    };

    socket.on("new-message", handleNewMessage);

    return () => {
      socket.off("new-message", handleNewMessage);
    }
  }, [socket, currentUser]);

  return (
    <aside className="fixed right-0 top-0 h-screen w-80 lg:w-96 bg-white/[0.01] backdrop-blur-3xl border-l border-white/[0.08] hidden xl:flex flex-col z-50 overflow-hidden shadow-2xl animate-in slide-in-from-right duration-700">
      <div className="p-8 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-black text-2xl tracking-tight bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">Direct Messages</h2>
          <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
          </div>
        </div>
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Search people..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-11 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-indigo-500/50 transition-all duration-300 shadow-inner"
          />
          <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col gap-4 p-2 animate-pulse">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="h-20 bg-white/5 rounded-[2.2rem]" />
            ))}
          </div>
        ) : users.length > 0 ? (
          users.map((user) => (
            <div 
              key={user._id} 
              onClick={() => navigate(`/conversation/${user.conversationId}`)}
              className="flex items-center gap-4 p-4 rounded-[2.2rem] hover:bg-white/[0.04] transition-all duration-300 cursor-pointer group border border-transparent hover:border-white/5 active:scale-[0.98] shadow-sm"
            >
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-[1.3rem] overflow-hidden bg-white/5 ring-1 ring-white/10 group-hover:ring-indigo-500/30 transition-all duration-500">
                  {user.image ? <img src={user.image} alt={user.userName} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl text-white/20">👤</div>}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-[3px] border-[#0c0c14]" />
              </div>
              <div className="flex flex-col min-w-0 flex-1 py-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white text-[15px] font-extrabold truncate group-hover:text-indigo-100 transition-colors">
                    {user.firstName} {user.lastName}
                  </span>
                  {user.lastMessage && (
                    <span className="text-[10px] text-white/20 group-hover:text-white/40 transition-colors uppercase font-black tracking-tighter shrink-0 bg-white/5 px-1.5 py-0.5 rounded-lg border border-white/5">
                      {new Date(user.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className={`text-[13px] break-words font-medium flex-1 ${user.unreadCount > 0 ? 'text-indigo-200 font-bold' : 'text-white/30'}`}>
                    {user.lastMessage ? (
                      <div className="line-clamp-2">
                        {user.lastMessage.sender === currentUser?._id && <span className="text-indigo-400 font-bold">You </span>}
                        {user.lastMessage.text}
                      </div>
                    ) : <span className="italic opacity-50">Say hello!</span>}
                  </div>
                  {user.unreadCount > 0 && (
                    <div className="min-w-[1.25rem] h-5 px-1.5 bg-indigo-500 rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/40">
                      <span className="text-[10px] font-black text-white">{user.unreadCount}</span>
                    </div>
                  )}
                  {user.lastMessage && user.lastMessage.sender === currentUser?._id && user.lastMessage.seen && user.unreadCount === 0 && (
                    <div className="shrink-0" title="Seen">
                      <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center opacity-40">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-3xl mb-4">📫</div>
            <p className="text-white/50 text-xs font-bold uppercase tracking-widest">Inbox Empty</p>
          </div>
        )}
      </div>
    </aside>
  );
}
