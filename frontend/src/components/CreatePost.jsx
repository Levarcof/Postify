import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function CreatePost({ onPostCreated }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:5000/api/profile", { withCredentials: true });
        if (res.data.success) {
          setProfile(res.data.user);
        }
      } catch (err) {
        console.error("Fetch profile error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handlePost = async () => {
    if (!content.trim()) return;
    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/api/postText", { content }, { withCredentials: true });
      if (res.data.success) {
        setContent('');
        if (onPostCreated) onPostCreated(res.data.post);
      }
    } catch (err) {
      console.error("Post creation error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative transition-all duration-500 mb-8 ${isFocused ? 'scale-[1.005]' : 'scale-100'}`}>
      <div className={`absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-purple-600/20 rounded-[2rem] blur-xl transition-opacity duration-700 ${isFocused ? 'opacity-100' : 'opacity-0'}`} />
      
      <div className="relative bg-[#0c0c14]/40 backdrop-blur-2xl border border-white/5 rounded-[2rem] overflow-hidden shadow-xl transition-all duration-500 hover:border-white/10">
        <div className="p-6">
          {/* User Row - Compact */}
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/5 ring-1 ring-white/10 shrink-0">
              {profile?.image ? <img src={profile.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-white font-bold text-base tracking-tight truncate">
                {profile?.firstName} {profile?.lastName}
              </span>
              <span className="text-white/20 text-[10px] font-medium truncate uppercase tracking-widest">{profile?.email}</span>
            </div>
          </div>

          {/* Input Area - Cleaner */}
          <textarea
            value={content}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your story..."
            className="w-full bg-transparent border-none outline-none text-white placeholder-white/5 resize-none py-1 text-lg min-h-[100px] custom-scrollbar selection:bg-indigo-500/30 font-medium leading-relaxed"
          />

          {/* Footer - Compact */}
          <div className="flex items-center justify-between pt-5 border-t border-white/[0.03] mt-2">
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="16" cy="16" r="14" fill="transparent" stroke="currentColor" strokeWidth="2" className="text-white/5" />
                  <circle cx="16" cy="16" r="14" fill="transparent" stroke="currentColor" strokeWidth="2" strokeDasharray={88} strokeDashoffset={88 - (Math.min(content.length, 280) / 280) * 88} className={`transition-all duration-700 ${content.length > 250 ? 'text-rose-500' : 'text-indigo-500'}`} />
                </svg>
                {content.length > 230 && <span className="absolute text-[8px] font-black text-rose-500/60">{280 - content.length}</span>}
              </div>
            </div>

            <button
              onClick={handlePost}
              disabled={loading || !content.trim()}
              className={`
                relative h-11 px-8 rounded-xl bg-indigo-600 transition-all duration-300 active:scale-95 disabled:opacity-20 flex items-center gap-2
                ${content.trim() ? 'shadow-lg shadow-indigo-600/20' : ''}
              `}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 hover:opacity-100 transition-opacity rounded-xl" />
              <span className="relative z-10 text-white font-black text-[10px] uppercase tracking-[0.2em]">
                {loading ? "Posting..." : "Post Now"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
