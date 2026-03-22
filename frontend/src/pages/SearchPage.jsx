import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();

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

  return (
    <div className="w-full max-w-[600px] mx-auto pt-6 px-4">
      <h2 className="text-2xl font-bold text-white mb-6">Search</h2>
      
      <div className="relative mb-8">
        <input 
          autoFocus
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for people..."
          className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/20 outline-none focus:border-indigo-500/50 shadow-inner transition-all"
        />
        {searching && (
          <div className="absolute right-6 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <div className="space-y-3">
        {results.length > 0 ? (
          results.map((user) => (
            <div 
              key={user._id} 
              onClick={() => navigate(`/user/${user.userName}`)}
              className="flex items-center gap-4 p-4 rounded-[1.5rem] bg-white/[0.03] hover:bg-white/[0.06] transition-all cursor-pointer border border-white/5 active:scale-95"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden bg-white/5 ring-1 ring-white/10">
                {user.image ? <img src={user.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">👤</div>}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-white font-semibold truncate">
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-white/30 text-xs font-medium truncate mt-0.5">
                  @{user.userName}
                </span>
              </div>
              <div className="ml-auto text-indigo-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </div>
            </div>
          ))
        ) : query.trim() ? (
          <div className="text-center py-20 opacity-40">
            <p className="text-sm">No results found for "{query}"</p>
          </div>
        ) : (
          <div className="text-center py-20 opacity-20">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <p className="text-sm">Search by username or name</p>
          </div>
        )}
      </div>
    </div>
  );
}
