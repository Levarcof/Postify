import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Navbar() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/checkSession", {
          withCredentials: true,
        });

        if (!res.data.loggedIn) {
          navigate("/login", { replace: true });
        }
      } catch (err) {
        console.error("Session check failed:", err);
        navigate("/login", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/logout",
        {},
        { withCredentials: true }
      );

      if (res.data.success) {
        navigate("/login", { replace: true });
      }
    } catch (err) {
      console.log(err);
      alert("Logout failed");
    }
  };

  if (loading) return null; // wait until session check completes

  return (
    <div className="w-full h-16 px-6 flex items-center justify-between bg-black/40 backdrop-blur-xl border-b border-white/10 shadow-lg">
      {/* Logo */}
      <div
        onClick={() => navigate("/")}
        className="flex items-center gap-3 cursor-pointer group"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-105 transition">
          AI
        </div>
        <h1 className="text-white text-lg font-semibold tracking-wide group-hover:text-indigo-300 transition">
          Interview
        </h1>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 text-white hover:text-red-400 transition-all duration-300"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1m0-10V3"
          />
        </svg>
        Logout
      </button>
    </div>
  );
}