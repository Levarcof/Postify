import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import axios from 'axios';

export default function ProtectedRoute() {
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/checkSession", { withCredentials: true });
        if (res.data.success && res.data.loggedIn) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (err) {
        setIsLoggedIn(false);
      } finally {
        setTimeout(() => setLoading(false), 800); // Small delay for smooth transition
      }
    };
    checkSession();
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#080810] flex flex-col items-center justify-center z-[9999]">
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 border-t-2 border-indigo-500 rounded-full animate-spin"></div>
          <div className="absolute inset-4 border-b-2 border-purple-500 rounded-full animate-spin-slow"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_15px_rgba(255,255,255,0.8)]"></div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-white text-sm font-black uppercase tracking-[0.4em] animate-pulse">Postify</h2>
          <p className="text-white/20 text-[10px] uppercase font-bold tracking-widest">Verifying Portal Access...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
