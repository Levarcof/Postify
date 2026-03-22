import { useForm } from "react-hook-form";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// ── Reusable floating-label input ──────────────────────────────────────────
function FloatingInput({ label, type = "text", registerKey, register, icon }) {
  const [focused, setFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  const { onChange, onBlur, ...rest } = register(registerKey);

  return (
    <div className="relative w-full">
      {/* icon */}
      {icon && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none z-10 text-lg">
          {icon}
        </span>
      )}
      <input
        type={type}
        {...rest}
        placeholder=""
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          onBlur(e);
          setFocused(false);
          setHasValue(e.target.value !== "");
        }}
        onChange={(e) => {
          onChange(e);
          setHasValue(e.target.value !== "");
        }}
        className={`peer w-full ${icon ? "pl-11" : "pl-5"} pr-5 pt-6 pb-2 bg-white/[0.04] border rounded-2xl text-white text-base outline-none transition-all duration-300
          ${focused ? "border-indigo-500/70 bg-white/[0.08] shadow-[0_0_0_3px_rgba(99,102,241,0.15)]" : "border-white/10"}
          placeholder-transparent`}
        autoComplete="off"
      />
      <label
        className={`absolute ${icon ? "left-11" : "left-5"} text-white/50 pointer-events-none transition-all duration-300 leading-none
          ${focused || hasValue ? "top-2.5 text-[10px] text-indigo-400 font-medium tracking-wide" : "top-1/2 -translate-y-1/2 text-sm"}`}
      >
        {label}
      </label>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function Registration() {
  const { register, handleSubmit, watch } = useForm();
  const navigate = useNavigate();

  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [otp, setOtp] = useState("");
  const [otpFocused, setOtpFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  /* countdown */
  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((p) => p - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const fmt = () => {
    const m = Math.floor(timer / 60), s = timer % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  /* cloudinary upload */
  const uploadImage = async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", import.meta.env.VITE_CLOUD_PRESET);
    const { data } = await axios.post(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUD_NAME}/image/upload`,
      fd
    );
    return data.secure_url;
  };

  const handleFileChange = (file) => {
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
  };

  /* OTP request */
  const handleGenerateOtp = async (data) => {
    try {
      setLoading(true);
      await axios.post(`${import.meta.env.VITE_API_URL}/api/registerUser`, { email: data.email }, { withCredentials: true });
      setOtpSent(true);
      setTimer(300);
    } catch { alert("Error sending OTP — check your email address."); }
    finally { setLoading(false); }
  };

  const handleResendOtp = async () => {
    try {
      setLoading(true);
      await axios.post(`${import.meta.env.VITE_API_URL}/api/registerUser`, { email: watch("email") }, { withCredentials: true });
      setTimer(300);
      setOtp("");
    } catch { alert("Error resending OTP."); }
    finally { setLoading(false); }
  };

  /* final submit */
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      let profilePic = "";
      if (data.profilePic?.[0]) profilePic = await uploadImage(data.profilePic[0]);
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/verifyOtp`, {
        ...data, profilePic, otp,
      }, { withCredentials: true });
      if (res.data.success) navigate("/");
    } catch { alert("Verification failed — please try again."); }
    finally { setLoading(false); }
  };

  const profileFile = watch("profilePic");

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080810] px-4 py-10 font-sans relative overflow-hidden">
      {/* ambient glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-700/15 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-violet-600/10 rounded-full blur-[80px]" />
      </div>

      {/* card */}
      <div className="relative z-10 w-full max-w-[460px]">
        {/* top glow ring */}
        <div className="absolute -inset-px rounded-[2.5rem] bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

        <div className="rounded-[2.5rem] bg-white/[0.04] backdrop-blur-3xl border border-white/[0.08] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* header band */}
          <div className="px-8 pt-9 pb-7 border-b border-white/[0.06]">
            {/* <div className="flex items-center gap-3 mb-5"> */}
              {/* <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30"> */}
                {/* <span className="text-white font-bold text-sm">AI</span> */}
              {/* </div> */}
              {/* <span className="text-white/50 text-sm font-light tracking-widest uppercase">Interview</span> */}
            {/* </div> */}
            <h1 className="text-3xl text-center font-semibold text-white tracking-tight">Create account</h1>
            {/* <p className="text-white/40 text-sm mt-1.5 font-light">Join thousands of candidates. It's free.</p> */}
          </div>

          {/* body */}
          <div className="px-8 py-7 space-y-4">
            {/* name row */}
            <div className="grid grid-cols-2 gap-3">
              <FloatingInput label="First Name" registerKey="firstName" register={register} icon="👤" />
              <FloatingInput label="Last Name" registerKey="lastName" register={register} />
            </div>

            <FloatingInput label="Email Address" type="email" registerKey="email" register={register} />
            <FloatingInput label="User name" type="text" registerKey="userName" register={register} />
            <FloatingInput label="Password" type="password" registerKey="password" register={register} />

            {/* profile pic */}
            <label
              className={`relative flex items-center gap-4 w-full px-5 py-3.5 rounded-2xl border border-dashed cursor-pointer transition-all duration-300
                ${dragOver ? "border-indigo-400 bg-indigo-500/10" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20"}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileChange(e.dataTransfer.files[0]); }}
            >
              {previewUrl || profileFile?.[0] ? (
                <img
                  src={previewUrl}
                  alt="preview"
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-400/40 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 text-xl">📷</div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-white/80 text-sm font-medium truncate">
                  {profileFile?.[0]?.name ?? (previewUrl ? "Photo selected" : "Upload Profile Photo")}
                </span>
                <span className="text-white/35 text-xs">Drag & drop or click to browse</span>
              </div>
              <input
                type="file"
                accept="image/*"
                {...register("profilePic")}
                onChange={(e) => { register("profilePic").onChange(e); handleFileChange(e.target.files[0]); }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </label>

            {/* action area */}
            <div className="pt-1">
              {/* step 1: generate otp button */}
              <div className={`transition-all duration-500 overflow-hidden ${otpSent ? "max-h-0 opacity-0 pointer-events-none" : "max-h-24 opacity-100"}`}>
                <button
                  type="button"
                  onClick={handleSubmit(handleGenerateOtp)}
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-base
                    hover:from-indigo-400 hover:to-purple-500 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]
                    active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none
                    shadow-[0_0_20px_rgba(99,102,241,0.2)] flex items-center justify-center gap-2"
                >
                  {loading ? <Spinner /> : "Create Account →"}
                </button>
              </div>

              {/* step 2: otp input + verify */}
              <div className={`transition-all duration-500 overflow-hidden space-y-4 ${otpSent ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"}`}>
                {/* otp field */}
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
                  <label className="block text-center text-xs text-white/40 mt-1.5">Enter the 6-digit code sent to your email</label>
                </div>

                {/* timer + resend */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${timer > 0 ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                    <span className="text-sm text-white/60">{timer > 0 ? `Expires in ${fmt()}` : "OTP Expired"}</span>
                  </div>
                  {timer === 0 && (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors disabled:opacity-50"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                {/* verify button */}
                <button
                  onClick={handleSubmit(onSubmit)}
                  disabled={otp.length < 6 || timer === 0 || loading}
                  className={`w-full py-3.5 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-all duration-300
                    ${otp.length < 6 || timer === 0
                      ? "bg-white/5 border border-white/10 text-white/30 cursor-not-allowed"
                      : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(16,185,129,0.35)] shadow-[0_0_15px_rgba(16,185,129,0.2)] active:translate-y-0"}`}
                >
                  {loading ? <Spinner /> : "Verify & Complete ✓"}
                </button>
              </div>
            </div>

            {/* footer link */}
            <p className="text-center text-sm text-white/35 pt-1">
              Already have an account?{" "}
              <button onClick={() => navigate("/login")} className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
