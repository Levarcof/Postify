import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// ── Reusable floating-label input ────────────────────────────────────────
function FloatingInput({ label, type = "text", value, onChange, icon, autoComplete }) {
  const [focused, setFocused] = useState(false);
  const active = focused || value !== "";

  return (
    <div className="relative w-full">
      {icon && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none z-10 text-lg">
          {icon}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete={autoComplete}
        placeholder=""
        className={`peer w-full ${icon ? "pl-11" : "pl-5"} pr-5 pt-6 pb-2 bg-white/[0.04] border rounded-2xl text-white text-base outline-none transition-all duration-300
          ${focused ? "border-indigo-500/70 bg-white/[0.08] shadow-[0_0_0_3px_rgba(99,102,241,0.15)]" : "border-white/10"}`}
      />
      <label
        className={`absolute ${icon ? "left-11" : "left-5"} text-white/50 pointer-events-none transition-all duration-300 leading-none
          ${active ? "top-2.5 text-[10px] text-indigo-400 font-medium tracking-wide" : "top-1/2 -translate-y-1/2 text-sm"}`}
      >
        {label}
      </label>
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ── Step indicator pill ───────────────────────────────────────────────────
function StepPill({ steps, current }) {
  return (
    <div className="flex items-center gap-1.5 justify-center mb-7">
      {steps.map((s, i) => (
        <div
          key={i}
          className={`h-1 rounded-full transition-all duration-500 ${i === current ? "w-6 bg-indigo-400" : "w-2 bg-white/15"}`}
        />
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function Login() {
  const navigate = useNavigate();

  // steps: 0=login  1=forgot(email)  2=forgot(otp)  3=reset
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [userKey, setUserKey] = useState("");
  // const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpFocused, setOtpFocused] = useState(false);

  // ── handlers ─────────────────────────────────────────────────────────
  const handleLogin = async () => {
    try {
      setLoading(true);
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/login`,
        { userKey, password },
        { withCredentials: true }
      );
      if (res.data.success) navigate("/");
      else alert(res.data.message);
    } catch { alert("Login failed — check your credentials."); }
    finally { setLoading(false); }
  };

  const handleSendOtp = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/forgetPassword`, { userKey }, { withCredentials: true });
      if (res.data.success) setStep(2);
    } catch { alert("Email not found."); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/verifyPassword`, { userKey, otp }, { withCredentials: true });
      if (res.data.success) setStep(3);
    } catch { alert("Invalid or expired OTP."); }
    finally { setLoading(false); }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) return alert("Passwords do not match.");
    try {
      setLoading(true);
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/updatePassword`, { userKey, password: newPassword }, { withCredentials: true });
      if (res.data.success) { alert("Password updated! Please log in."); setStep(0); setOtp(""); setNewPassword(""); setConfirmPassword(""); }
    } catch { alert("Error updating password."); }
    finally { setLoading(false); }
  };

  // ── step meta ──────────────────────────────────────────────────────────
  const stepMeta = [
    { title: "Welcome back", sub: "Sign in to your account" },
    { title: "Forgot password?", sub: "Enter your registered email" },
    { title: "Verify identity", sub: "Enter the 6-digit code we sent" },
    { title: "New password", sub: "Choose a strong password" },
  ];

  const forgotSteps = [1, 2, 3]; // indices used in pill

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080810] px-4 py-10 font-sans relative overflow-hidden">
      {/* ambient glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-700/15 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 right-0 w-[300px] h-[300px] bg-violet-600/10 rounded-full blur-[80px]" />
      </div>

      {/* card */}
      <div className="relative z-10 w-full max-w-[420px]">
        <div className="absolute -inset-px rounded-[2.5rem] bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

        <div className="rounded-[2.5rem] bg-white/[0.04] backdrop-blur-3xl border border-white/[0.08] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* header */}
          <div className="px-8 pt-9 pb-7 border-b border-white/[0.06]">
            <h1 className="text-3xl font-semibold text-white tracking-tight">{stepMeta[step].title}</h1>
            <p className="text-white/40 text-sm mt-1.5 font-light">{stepMeta[step].sub}</p>
          </div>

          {/* body */}
          <div className="px-8 py-7">
            {/* forgot-password step pills */}
            {step >= 1 && (
              <StepPill steps={forgotSteps} current={step - 1} />
            )}

            {/* ── STEP 0: Login ── */}
            {step === 0 && (
              <div className="space-y-4">
                <FloatingInput label="Email / User name " type="text" value={userKey} onChange={(e) => setUserKey(e.target.value)}  />
                <FloatingInput label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />

                {/* forgot link */}
                {/* <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div> */}

                <button
                  onClick={handleLogin}
                  disabled={!userKey || !password || loading}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-base
                    hover:from-indigo-400 hover:to-purple-500 hover:-translate-y-0.5
                    hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] shadow-[0_0_20px_rgba(99,102,241,0.2)]
                    active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none
                    flex items-center justify-center gap-2"
                >
                  {loading ? <Spinner /> : "Sign In →"}
                </button>

                <p className="text-center text-sm text-white/35 pt-1">
                  Don't have an account?{" "}
                  <button onClick={() => navigate("/register")} className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                    Register
                  </button>
                </p>
              </div>
            )}

            {/* ── STEP 1: Enter email for forgot ── */}
            {step === 1 && (
              <div className="space-y-4">
                <FloatingInput label="email / user name " type="text" value={userKey} onChange={(e) => setUserKey(e.target.value)}  />

                <button
                  onClick={handleSendOtp}
                  disabled={!userKey || loading}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-base
                    hover:from-indigo-400 hover:to-purple-500 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]
                    shadow-[0_0_20px_rgba(99,102,241,0.2)] active:translate-y-0 transition-all duration-300
                    disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  {loading ? <Spinner /> : "Send OTP →"}
                </button>

                <button onClick={() => setStep(0)} className="w-full text-center text-sm text-white/35 hover:text-white/60 transition-colors">
                  ← Back to login
                </button>
              </div>
            )}

            {/* ── STEP 2: Enter OTP ── */}
            {step === 2 && (
              <div className="space-y-5">
                <p className="text-center text-xs text-white/40">Code sent to <span className="text-white/70">{userKey}</span></p>

                <div className="relative">
                  <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    onFocus={() => setOtpFocused(true)}
                    onBlur={() => setOtpFocused(false)}
                    placeholder="000000"
                    maxLength={6}
                    className={`w-full px-5 py-4 bg-white/[0.04] border rounded-2xl text-white text-center text-3xl tracking-[0.6em] font-mono outline-none transition-all duration-300 placeholder:text-white/15
                      ${otpFocused ? "border-indigo-500/70 bg-white/[0.08] shadow-[0_0_0_3px_rgba(99,102,241,0.15)]" : "border-white/10"}`}
                  />
                </div>

                <button
                  onClick={handleVerifyOtp}
                  disabled={otp.length < 6 || loading}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-base
                    hover:from-indigo-400 hover:to-purple-500 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]
                    shadow-[0_0_20px_rgba(99,102,241,0.2)] active:translate-y-0 transition-all duration-300
                    disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  {loading ? <Spinner /> : "Verify Code →"}
                </button>

                <div className="flex justify-between">
                  <button onClick={() => setStep(1)} className="text-sm text-white/35 hover:text-white/60 transition-colors">← Back</button>
                  <button onClick={handleSendOtp} disabled={loading} className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50">Resend OTP</button>
                </div>
              </div>
            )}

            {/* ── STEP 3: New password ── */}
            {step === 3 && (
              <div className="space-y-4">
                <FloatingInput label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <FloatingInput label="Confirm Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />

                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-400 text-center -mt-1">Passwords do not match</p>
                )}

                <button
                  onClick={handleUpdatePassword}
                  disabled={!newPassword || !confirmPassword || newPassword !== confirmPassword || loading}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-base
                    hover:from-emerald-400 hover:to-teal-400 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(16,185,129,0.35)]
                    shadow-[0_0_15px_rgba(16,185,129,0.2)] active:translate-y-0 transition-all duration-300
                    disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  {loading ? <Spinner /> : "Update Password ✓"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
