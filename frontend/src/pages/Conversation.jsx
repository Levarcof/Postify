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
        console.log("Emitting join-user-room for:", currentUser._id);
        socket.emit("join-user-room", currentUser._id);
      }

      // If in a specific conversation, join that room too
      if (conversationId) {
        console.log("Emitting join-room for:", conversationId);
        socket.emit("join-room", conversationId);
        fetchMessages(conversationId);
        markAsSeen(conversationId);
      }

      socket.on("new-message", (message) => {
        console.log("Received new-message event:", message);
        const msgConvId = String(message.conversationId?._id || message.conversationId);
        
        if (conversationId && msgConvId === String(conversationId)) {
          fetchMessages(conversationId);
          markAsSeen(conversationId);
        }
        fetchConversations();
      });

      socket.on("message-seen", ({ conversationId: seenChatId }) => {
        const sChatId = String(seenChatId);
        if (conversationId && sChatId === String(conversationId)) {
          setMessages(prev => prev.map(m => ({ ...m, seen: true })));
        }
        setConversations(prev => prev.map(c => 
          String(c.conversationId) === sChatId ? { ...c, lastMessage: { ...c.lastMessage, seen: true } } : c
        ));
      });

      return () => {
        socket.off("new-message");
        socket.off("message-seen");
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
        setMessages(prev => [...prev, res.data.message]);
        setNewMessage("");
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
        navigate('/messages');
        fetchConversations();
      }
    } catch (err) {
      console.error("Delete conversation error:", err);
    }
  };

  return (
    <div className="flex h-screen bg-[#080810] text-white overflow-hidden lg:h-[calc(100vh-40px)] lg:m-5 lg:rounded-[2.5rem] sm:lg:rounded-[3rem] lg:border lg:border-white/5 lg:shadow-2xl animate-in fade-in duration-700">
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
        <div className="p-5 sm:p-8 border-b border-white/5 flex items-center gap-4 bg-white/[0.02] backdrop-blur-2xl">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center  justify-center w-8 h-8 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition-all active:scale-95 shadow-2xl shrink-0"
            title="Back"
          >
            <svg className="w-3 h-3 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-2xl font-black tracking-tight bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">Messages</h2>
        </div>

        <div className="p-4 border-b border-white/5">
          <div className="relative group">
            <input
              type="text"
              placeholder="Search chats..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl sm:rounded-2xl px-11 py-2.5 sm:py-3 text-sm sm:text-base outline-none focus:border-indigo-500/50 transition-all placeholder-white/20"
            />
            <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
                className={`flex items-center gap-4 p-4 rounded-[2rem] cursor-pointer transition-all duration-300 group ${conversationId === user.conversationId
                    ? "bg-indigo-600/10 border border-indigo-500/30 shadow-lg shadow-indigo-500/5"
                    : "hover:bg-white/[0.04] border border-transparent hover:border-white/5"
                  }`}
              >
                <div className="relative">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-white/5 ring-2 ring-white/5 group-hover:ring-indigo-500/20 transition-all">
                    {user.image ? <img src={user.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl sm:text-2xl">👤</div>}
                  </div>
                  <span className="absolute bottom-0.5 right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-emerald-500 rounded-full border-2 border-[#080810]" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-sm sm:text-[15px] truncate text-white/90">{user.firstName} {user.lastName}</span>
                    {user.lastMessage && (
                      <span className="text-[10px] text-white/20 font-bold uppercase tracking-tighter">
                        {new Date(user.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs truncate font-medium flex-1 ${user.unreadCount > 0 ? 'text-white font-bold' : 'text-white/40'}`}>
                      {user.lastMessage ? (
                        <>
                          {String(user.lastMessage.sender) === String(currentUser?._id) && <span className="text-indigo-400">You: </span>}
                          {user.lastMessage.text}
                          {String(user.lastMessage.sender) === String(currentUser?._id) && user.lastMessage.seen && (
                            <span className="ml-1.5 text-[10px] text-emerald-500 font-bold italic uppercase tracking-tighter shrink-0">Seen</span>
                          )}
                        </>
                      ) : `@${user.userName}`}
                    </span>
                    {user.unreadCount > 0 && (
                      <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-black text-[#080810]">{user.unreadCount}</span>
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
            <div className="p-5 md:p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02] backdrop-blur-2xl z-10">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate(-1)}
                  className="flex md:hidden items-center justify-center w-8 h-8 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition-all active:scale-95 shadow-2xl shrink-0"
                >
                  <svg className="w-3 h-3 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="flex items-center gap-4 cursor-pointer group" onClick={() => {
                  const targetUser = conversations.find(c => String(c.conversationId) === String(conversationId));
                  if (targetUser) navigate(`/user/${targetUser.userName}`);
                }}>
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-white/5 ring-2 ring-white/5 group-hover:ring-indigo-500/30 transition-all">
                      {conversations.find(c => String(c.conversationId) === String(conversationId))?.image ? (
                        <img src={conversations.find(c => String(c.conversationId) === String(conversationId)).image} alt="" className="w-full h-full object-cover" />
                      ) : <div className="w-full h-full flex items-center justify-center text-xl">👤</div>}
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#12121e]" />
                  </div>
                  <div>
                    <div className="font-extrabold text-white text-[16px] md:text-lg tracking-tight group-hover:text-indigo-400 transition-colors leading-none">
                      {conversations.find(c => String(c.conversationId) === String(conversationId))?.firstName} {conversations.find(c => String(c.conversationId) === String(conversationId))?.lastName}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                    </div>
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
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 space-y-4 sm:space-y-6 custom-scrollbar scroll-smooth">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 pointer-events-none">
                  <div className="w-24 h-24 border-2 border-dashed border-white rounded-full flex items-center justify-center text-4xl mb-4">✨</div>
                  <p className="text-sm font-bold uppercase tracking-[0.3em]">Start a new conversation</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMine = String(msg.sender?._id || msg.sender) === String(currentUser?._id);
                  const prevMsg = messages[idx - 1];
                  const isSameSender = String(prevMsg?.sender?._id || prevMsg?.sender) === String(msg.sender?._id || msg.sender);

                  return (
                    <div key={idx} className={`flex ${isMine ? "justify-end" : "justify-start"} ${isSameSender ? "-mt-4" : "mt-2"} ${idx === messages.length - 1 ? "mb-6" : ""} relative animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                      <div className={`max-w-[80%] md:max-w-[65%] p-4 md:p-5 text-[14px] md:text-[15px] leading-relaxed relative ${isMine
                          ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-[1.8rem] rounded-tr-none shadow-xl shadow-indigo-600/10"
                          : "bg-white/[0.05] text-white/90 rounded-[1.8rem] rounded-tl-none border border-white/10 backdrop-blur-md"
                        }`}>
                        {msg.text}
                      </div>
                      {idx === messages.length - 1 && isMine && msg.seen && (
                        <div className="absolute -bottom-5 right-2 text-[10px] text-emerald-500/80 font-black uppercase tracking-[0.2em] italic animate-in fade-in slide-in-from-top-1 duration-700">Seen</div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Wrapper */}
            <div className="p-4 sm:p-5 md:p-8 bg-gradient-to-t from-[#080810] via-[#080810]/80 to-transparent">
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-2 sm:gap-3 bg-white/[0.04] border border-white/10 rounded-2xl sm:rounded-[2rem] p-1.5 sm:p-2 pl-4 sm:pl-6 pr-1.5 sm:pr-2 shadow-2xl focus-within:border-indigo-500/40 transition-all duration-300"
              >
                <button type="button" className="text-white/20 hover:text-indigo-400 transition-colors p-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                </button>
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type message..."
                  className="flex-1 bg-transparent border-none outline-none py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-white/20"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:grayscale p-3 sm:p-3.5 rounded-xl sm:rounded-[1.5rem] transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
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
