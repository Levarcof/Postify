import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ConfirmationModal from '../components/ConfirmationModal';
import { useSocket } from '../context/SocketContext';

export default function Conversation() {
  const { conversationId } = useParams();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const socket = useSocket();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchConversations();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/profile`, { withCredentials: true });
      if (res.data.success) setCurrentUser(res.data.user);
    } catch (err) {
      console.error("Fetch current user error:", err);
    }
  };

  useEffect(() => {
    if (socket) {
      // Always join user room if possible
      if (currentUser?._id) {
        socket.emit("join-user-room", currentUser._id);
      }

      // If in a specific conversation, join that room too
      if (conversationId) {
        socket.emit("join-room", conversationId);
        fetchMessages(conversationId);
        markAsSeen(conversationId);
      }

      const handleNewMessage = (message) => {
        const msgConvId = String(message.conversationId?._id || message.conversationId);
        
        // 1. If the message belongs to the CURRENT open chat, append it visually
        if (conversationId && msgConvId === String(conversationId)) {
          // Add to messages array if it's not already there (prevent duplicates)
          setMessages((prev) => {
             const exists = prev.find(m => m._id === message._id);
             return exists ? prev : [...prev, message];
          });
          // Optimistically mark as seen since we have it open
          if (String(message.sender._id || message.sender) !== String(currentUser?._id)) {
            markAsSeen(conversationId);
          }
        }

        // 2. Always update the sidebar conversation list to bubble up the latest chat
        setConversations(prev => {
           let updatedConversations = [...prev];
           const index = updatedConversations.findIndex(c => String(c.conversationId) === msgConvId);
           
           if (index !== -1) {
             const conv = updatedConversations[index];
             updatedConversations.splice(index, 1); // remove it
             // push to top and update unread count if we are NOT in that chat
             updatedConversations.unshift({
                ...conv,
                lastMessage: message,
                updatedAt: new Date(),
                unreadCount: (conversationId === msgConvId) ? 0 : conv.unreadCount + 1
             });
           } else {
             // If we receive a message for a completely new chat not in our list, refresh the list completely
             fetchConversations();
           }
           return updatedConversations;
        });
      };

      const handleMessageSeen = ({ conversationId: seenChatId }) => {
        const sChatId = String(seenChatId);
        if (conversationId && sChatId === String(conversationId)) {
          setMessages(prev => prev.map(m => ({ ...m, seen: true })));
        }
        setConversations(prev => prev.map(c => 
          String(c.conversationId) === sChatId ? { ...c, lastMessage: { ...c.lastMessage, seen: true } } : c
        ));
      };

      socket.on("new-message", handleNewMessage);
      socket.on("message-seen", handleMessageSeen);

      return () => {
        socket.off("new-message", handleNewMessage);
        socket.off("message-seen", handleMessageSeen);
      }
    }
  }, [conversationId, socket, currentUser]);

  const markAsSeen = async (id) => {
    try {
      const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/messages/markSeen/${id}`, {}, { withCredentials: true });
      if (res.data.success) {
        // Update local state for unread counts
        setConversations(prev => prev.map(conv => 
          String(conv.conversationId) === String(id) ? { ...conv, unreadCount: 0 } : conv
        ));
        window.dispatchEvent(new Event('messages-read'));
      }
    } catch (err) {
      console.error("Mark as seen error:", err);
    }
  };

  const fetchConversations = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/conversationUsers`, { withCredentials: true });
      if (res.data.success) {
        setConversations(res.data.users);
      }
    } catch (err) {
      console.error("Fetch conversations error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (id) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/messages/${id}`, { withCredentials: true });
      if (res.data.success) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.error("Fetch messages error:", err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/sendMessage`, {
        conversationId,
        text: newMessage
      }, { withCredentials: true });

      if (res.data.success) {
        // Optimistic UI update for the sender
        setMessages(prev => {
          const exists = prev.find(m => m._id === res.data.message._id);
          return exists ? prev : [...prev, res.data.message];
        });
        setNewMessage("");
        
        // Optimistically update conversation list for sender
        setConversations(prev => {
          const others = prev.filter(c => String(c.conversationId) !== String(conversationId));
          const current = prev.find(c => String(c.conversationId) === String(conversationId));
          if (current) {
            return [{ ...current, lastMessage: res.data.message, updatedAt: new Date() }, ...others];
          }
          return prev;
        });
      }
    } catch (err) {
      console.error("Send message error:", err);
    }
  };

  const handleDeleteConversation = async () => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/deleteConversation`, { conversationId }, { withCredentials: true });
      if (res.data.success) {
        setIsDeleteModalOpen(false); // Close modal first
        navigate('/messages', { replace: true });
        fetchConversations();
      }
    } catch (err) {
      console.error("Delete conversation error:", err);
    }
  };

  return (
    <div className="flex h-[100svh] bg-[#080810] text-white overflow-hidden lg:h-[calc(100vh-40px)] lg:m-5 lg:rounded-[2.5rem] sm:lg:rounded-[3rem] lg:border lg:border-white/5 lg:shadow-2xl animate-in fade-in duration-700">
      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConversation}
        title="Wipe Conversation?"
        message="This will permanently delete all messages and remove this chat from your universe. THE OTHER PERSON WILL ALSO LOSE THESE MESSAGES."
        confirmText="Wipe Everything"
      />
      {/* Sidebar - Hidden on mobile if a conversation is active */}
      <div className={`${conversationId ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 border-r border-white/5 flex flex-col bg-white/[0.01] backdrop-blur-3xl`}>
        <div className="p-6 sm:p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02] backdrop-blur-2xl">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center w-10 h-10 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all active:scale-95 shadow-xl shrink-0 group"
              title="Back to Home"
            >
              <svg className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-2xl font-black tracking-tight text-white leading-none">Messages</h2>
          </div>
          <button 
            onClick={() => navigate('/profile')}
            className="w-10 h-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-600/20 text-white transition-all active:scale-95"
            title="New Chat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>

        <div className="p-4 border-b border-white/5 bg-white/[0.01]">
          <div className="relative group">
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-12 py-3.5 text-sm sm:text-base outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all placeholder-white/20 font-medium shadow-inner"
            />
            <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-white/5 rounded-[2rem]" />)}
            </div>
          ) : conversations.length > 0 ? (
            conversations.map((user) => (
              <div
                key={user._id}
                onClick={() => navigate(`/conversation/${user.conversationId}`)}
                className={`flex items-center gap-4 p-4 rounded-[2.2rem] cursor-pointer transition-all duration-300 group ${conversationId === user.conversationId
                    ? "bg-indigo-600/15 border border-indigo-500/40 shadow-xl shadow-indigo-900/20"
                    : "hover:bg-white/[0.04] border border-transparent hover:border-white/5 shadow-sm"
                  }`}
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-[1.2rem] overflow-hidden bg-white/5 ring-1 ring-white/10 group-hover:ring-indigo-500/30 transition-all duration-500">
                    {user.image ? <img src={user.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">👤</div>}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-[3px] border-[#0c0c14]" />
                </div>
                <div className="flex flex-col min-w-0 flex-1 py-0.5">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-extrabold text-[14.5px] truncate text-white/90 group-hover:text-white transition-colors">
                      {user.firstName} {user.lastName}
                    </span>
                    {user.lastMessage && (
                      <span className="text-[10px] text-white/20 font-black uppercase tracking-tighter shrink-0 pt-0.5 bg-white/5 px-1.5 py-0.5 rounded-lg border border-white/5 group-hover:text-white/40 group-hover:bg-white/10 transition-all">
                        {new Date(user.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className={`text-[13px] break-words font-medium flex-1 ${user.unreadCount > 0 ? 'text-indigo-200 font-bold' : 'text-white/30'}`}>
                      {user.lastMessage ? (
                        <div className="line-clamp-2">
                          {String(user.lastMessage.sender) === String(currentUser?._id) && <span className="text-indigo-400 font-bold">You </span>}
                          {user.lastMessage.text}
                        </div>
                      ) : <span className="italic opacity-50">Say hello!</span>}
                    </div>
                    {user.unreadCount > 0 && (
                      <div className="min-w-[1.25rem] h-5 px-1.5 bg-indigo-500 rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/40">
                        <span className="text-[10px] font-black text-white">{user.unreadCount}</span>
                      </div>
                    )}
                    {user.lastMessage && String(user.lastMessage.sender) === String(currentUser?._id) && user.lastMessage.seen && user.unreadCount === 0 && (
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
            <div className="flex flex-col items-center justify-center py-12 sm:py-20 px-6 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 text-2xl sm:text-3xl">💬</div>
              <h3 className="text-white font-bold mb-2">No messages yet</h3>
              <p className="text-white/30 text-[11px] sm:text-xs mb-8 leading-relaxed">Connect with people and start sharing your stories together!</p>
              <button
                onClick={() => navigate('/profile')}
                className="px-8 sm:px-10 py-3 sm:py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all active:scale-95 shadow-xl shadow-indigo-600/20"
              >
                Start Message
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area - Visible only when a conversation is active on mobile */}
      <div className={`${!conversationId ? 'hidden md:flex' : 'flex'} flex-1 flex flex-col bg-[#0c0c14]/40 relative overflow-hidden`}>
        {conversationId ? (
          <>
            {/* Chat Header */}
            <div className="p-3 sm:p-4 border-b border-white/5 flex items-center justify-between bg-[#0c0c14]/60 backdrop-blur-3xl z-20">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/messages')}
                  className="flex md:hidden items-center justify-center w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all active:scale-95 shadow-xl shrink-0 group"
                >
                  <svg className="w-4 h-4 text-white/60 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => {
                  const targetUser = conversations.find(c => String(c.conversationId) === String(conversationId));
                  if (targetUser) navigate(`/user/${targetUser.userName}`);
                }}>
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl overflow-hidden bg-white/5 ring-1 ring-white/10 group-hover:ring-indigo-500/30 transition-all duration-500">
                      {conversations.find(c => String(c.conversationId) === String(conversationId))?.image ? (
                        <img src={conversations.find(c => String(c.conversationId) === String(conversationId)).image} alt="" className="w-full h-full object-cover" />
                      ) : <div className="w-full h-full flex items-center justify-center text-lg">👤</div>}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-[2px] border-[#0c0c14]" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-white text-[15px] md:text-[16px] tracking-tight group-hover:text-indigo-400 transition-colors leading-none truncate">
                      {conversations.find(c => String(c.conversationId) === String(conversationId))?.firstName} {conversations.find(c => String(c.conversationId) === String(conversationId))?.lastName}
                    </div>
                    {/* <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="flex w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest">Active Now</span>
                    </div> */}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="p-3 bg-white/5 hover:bg-rose-500/20 rounded-2xl transition-all border border-white/5 text-white/20 hover:text-rose-500"
                  title="Delete Conversation"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 md:p-6 space-y-3 custom-scrollbar scroll-smooth">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 pointer-events-none">
                  <div className="w-20 h-20 border-2 border-dashed border-white rounded-full flex items-center justify-center text-3xl mb-4">✨</div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em]">Start a new conversation</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMine = String(msg.sender?._id || msg.sender) === String(currentUser?._id);
                  const prevMsg = messages[idx - 1];
                  const isSameSender = String(prevMsg?.sender?._id || prevMsg?.sender) === String(msg.sender?._id || msg.sender);

                  return (
                    <div key={idx} className={`flex ${isMine ? "justify-end" : "justify-start"} ${isSameSender ? "-mt-2" : "mt-3"} ${idx === messages.length - 1 ? "mb-6" : ""} relative animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                      <div className={`max-w-[85%] md:max-w-[65%] p-3 sm:p-3.5 sm:px-4 text-[13.5px] md:text-[14px] leading-relaxed relative break-words overflow-wrap-anywhere ${isMine
                          ? "bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white rounded-[1.5rem] rounded-tr-[0.3rem] shadow-md shadow-indigo-900/10 font-medium"
                          : "bg-white/[0.05] text-white/90 rounded-[1.5rem] rounded-tl-[0.3rem] border border-white/10 backdrop-blur-md font-medium"
                        }`}>
                        {msg.text}
                        <div className={`absolute bottom-1 ${isMine ? "-left-14" : "-right-14"} text-[9px] font-bold text-white/20 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      {idx === messages.length - 1 && isMine && msg.seen && (
                        <div className="absolute -bottom-6 right-2 flex items-center gap-1 text-[9px] text-emerald-500 font-black uppercase tracking-widest italic animate-in fade-in slide-in-from-top-1 duration-700">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>
                          Seen
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Wrapper */}
            <div className="p-3 sm:p-4 md:p-6 bg-[#0c0c14]/90 backdrop-blur-md z-20 border-t border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-2 sm:gap-3 bg-white/[0.04] border border-white/10 rounded-[1.8rem] p-1.5 pl-4 pr-1.5 shadow-inner focus-within:border-indigo-500/40 focus-within:bg-white/[0.06] transition-all duration-300 group"
              >
                <button type="button" className="text-white/20 hover:text-indigo-400 transition-all p-1.5 hover:scale-110 active:scale-90">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                </button>
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent border-none outline-none py-2.5 sm:py-3 text-[14px] text-white placeholder-white/20 font-medium"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-20 disabled:grayscale p-3 rounded-full transition-all active:scale-95 shadow-md shadow-indigo-600/20 flex items-center justify-center"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="relative mb-10">
              <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full"></div>
              <div className="relative w-32 h-32 bg-white/[0.01] border border-white/10 rounded-[3rem] items-center justify-center flex text-5xl shadow-2xl">🪄</div>
            </div>
            <h2 className="text-3xl font-black text-white/90 mb-4 tracking-tight">Your Inbox</h2>
            <p className="text-white/30 max-w-xs mx-auto leading-relaxed text-sm">
              Select a conversation from the left or discover new people to start messaging.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
