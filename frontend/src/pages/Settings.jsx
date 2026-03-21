import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PostCard from '../components/PostCard';

const CLOUDINARY_UPLOAD_PRESET = "interview"; 
const CLOUDINARY_CLOUD_NAME = "dxcceg1gx"; 

export default function Settings() {
  const [user, setUser] = useState(null);
  const [likedPosts, setLikedPosts] = useState([]);
  const [commentedPosts, setCommentedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); 
  
  const [formData, setFormData] = useState({ firstName: '', lastName: '', image: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const userRes = await axios.get("http://localhost:5000/api/profile", { withCredentials: true });
      if (!userRes.data.success) throw new Error("Failed to fetch profile");
      const currentUser = userRes.data.user;
      setUser(currentUser);
      setFormData({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        image: currentUser.image || ''
      });
      setImagePreview(currentUser.image || null);

      const postsRes = await axios.get("http://localhost:5000/api/feedPost", { withCredentials: true });
      if (postsRes.data.success) {
        const allPosts = postsRes.data.posts;
        setLikedPosts(allPosts.filter(post => post.likes?.includes(currentUser._id)));
        setCommentedPosts(allPosts.filter(post => post.comments?.some(c => c.user._id === currentUser._id || c.user === currentUser._id)));
      }
    } catch (err) {
      console.error("Settings data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadToCloudinary = async (file) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    try {
      const res = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, data);
      return res.data.secure_url;
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      throw new Error("Cloudinary error: Make sure your preset is 'Unsigned'");
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setMessage({ type: 'error', text: 'Name fields cannot be empty' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      let imageUrl = formData.image;

      if (imageFile) {
        imageUrl = await uploadToCloudinary(imageFile);
      }

      const res = await axios.post("http://localhost:5000/api/updateProfile", 
        { ...formData, image: imageUrl }, 
        { withCredentials: true }
      );

      if (res.data.success) {
        setUser(res.data.user);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setImageFile(null);
      }
    } catch (err) {
      console.error("Save profile error:", err);
      setMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/logout", {}, { withCredentials: true });
      if (res.data.success) navigate('/login');
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center pt-20 animate-pulse w-full max-w-2xl px-4">
      <div className="h-40 w-full bg-white/5 rounded-[3rem] mb-12" />
      <div className="w-full space-y-6">
        {[1,2].map(i => <div key={i} className="h-64 w-full bg-white/5 rounded-[2.5rem]" />)}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-2xl pb-32 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header */}
      <div className="flex items-center justify-between mb-12 px-2">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter italic">Settings</h1>
          <p className="text-white/20 text-xs font-bold uppercase tracking-[0.3em] mt-2">Manage your universe</p>
        </div>
        <button 
          onClick={handleLogout}
          className="group flex items-center gap-3 px-6 py-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white text-sm font-black rounded-2xl border border-rose-500/20 transition-all duration-500 active:scale-95 shadow-lg shadow-rose-500/5 hover:shadow-rose-500/20"
        >
          <span>Logout</span>
          <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-10 px-2 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
        <div className="flex gap-2 p-1.5 bg-white/[0.03] backdrop-blur-3xl rounded-[1.8rem] border border-white/5 w-fit">
          {[
            { id: 'profile', label: 'Edit Profile', icon: "👤" },
            { id: 'liked', label: `Liked (${likedPosts.length})`, icon: "❤️" },
            { id: 'commented', label: `Activity (${commentedPosts.length})`, icon: "💬" }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black transition-all duration-500 whitespace-nowrap ${
                activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/30' : 'text-white/40 hover:text-white/60 hover:bg-white/5'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-8">
        {activeTab === 'profile' ? (
          <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -mr-32 -mt-32"></div>
            
            <form onSubmit={handleSaveProfile} className="relative z-10 space-y-10">
              {/* Profile Image Picker */}
              <div className="flex flex-col items-center">
                <div className="relative group/avatar cursor-pointer" onClick={() => fileInputRef.current.click()}>
                  <div className="absolute -inset-1.5 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-full blur opacity-25 group-hover/avatar:opacity-75 transition duration-700 animate-pulse"></div>
                  <div className="relative w-32 h-32 rounded-full overflow-hidden bg-[#080810] border-4 border-[#080810] ring-1 ring-white/10 shadow-2xl">
                    {imagePreview ? (
                      <img src={imagePreview} alt="" className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">👤</div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center duration-300">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                  </div>
                  <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleImageChange} />
                </div>
                <p className="text-white/20 text-[10px] uppercase font-black tracking-widest mt-4">Tap to change portal avatar</p>
              </div>

              {/* Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">First Name</label>
                  <input 
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    placeholder="Wanderer's First Name"
                    className="w-full bg-white/[0.04] border border-white/5 rounded-2xl px-6 py-4 text-white text-sm font-bold placeholder:text-white/10 outline-none focus:border-indigo-500/50 transition-all focus:bg-white/[0.06]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Last Name</label>
                  <input 
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    placeholder="Wanderer's Last Name"
                    className="w-full bg-white/[0.04] border border-white/5 rounded-2xl px-6 py-4 text-white text-sm font-bold placeholder:text-white/10 outline-none focus:border-indigo-500/50 transition-all focus:bg-white/[0.06]"
                  />
                </div>
              </div>

              {/* Status Message */}
              {message.text && (
                <div className={`p-4 rounded-2xl text-xs font-black text-center animate-in zoom-in-95 duration-300 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                  {message.text}
                </div>
              )}

              {/* Submit */}
              <button 
                type="submit"
                disabled={saving}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-[1.8rem] transition-all duration-500 shadow-2xl shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Seal Changes</span>
                    <svg className="w-4 h-4 group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6 animate-in slide-in-from-top-4 duration-700">
            {(activeTab === 'liked' ? likedPosts : commentedPosts).length > 0 ? (
              (activeTab === 'liked' ? likedPosts : commentedPosts).map(post => <PostCard key={post._id} post={post} currentUser={user} />)
            ) : (
              <div className="text-center py-24 bg-white/[0.02] backdrop-blur-3xl rounded-[3rem] border border-dashed border-white/10 flex flex-col items-center justify-center grayscale opacity-40">
                <span className="text-4xl mb-4">🌌</span>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-white">The archive is currently empty</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
