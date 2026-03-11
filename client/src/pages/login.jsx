import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/authContext";
import "./login.css";

function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate    = useNavigate();
  const { setUser } = useAuth();

  // ── Forgot password state (added) ──────────────────────────────────────────
  const [step, setStep]                   = useState("login"); // "login" | "forgot" | "otp" | "reset"
  const [fpEmail, setFpEmail]             = useState("");
  const [otpToken, setOtpToken]           = useState("");
  const [otp, setOtp]                     = useState(["", "", "", "", "", ""]); 
  const [newPassword, setNewPassword]     = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resending, setResending]         = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      const { token, user } = res.data.data;

      localStorage.setItem("token", token);
      setUser(user);

      

      if (user.role === "roomProvider") {
        navigate("/rooms/my");
      } else if (user.role === "kitchenOwner") {
        navigate("/kitchens/my");
      } else {
        navigate("/dashboard");
      }

    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot password handlers (added) ───────────────────────────────────────

  const handleForgotSend = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password/send-otp", { email: fpEmail });
      setOtpToken(res.data.otpToken);
      setStep("otp");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length < 6) { setError("Please enter the full 6-digit code"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password/verify-otp", {
        email: fpEmail, otp: otpValue, otpToken,
      });
      setOtpToken(res.data.otpToken);
      setStep("reset");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password/reset", {
        email: fpEmail, otpToken, password: newPassword,
      });
      setStep("login");
      setFpEmail(""); setOtp(["","","","","",""]); setNewPassword(""); setOtpToken("");
      alert("Password reset successful! Please sign in.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true); setError("");
    try {
      const res = await api.post("/auth/forgot-password/send-otp", { email: fpEmail });
      setOtpToken(res.data.otpToken);
    } catch (err) {
      setError(err.response?.data?.message || "Could not resend OTP.");
    } finally {
      setResending(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp]; next[index] = value.slice(-1); setOtp(next);
    if (value && index < 5) document.getElementById(`fp-otp-${index + 1}`)?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      document.getElementById(`fp-otp-${index - 1}`)?.focus();
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) { setOtp(pasted.split("")); document.getElementById("fp-otp-5")?.focus(); }
    e.preventDefault();
  };

  const goBack = (toStep) => { setStep(toStep); setError(""); };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="login-wrapper">

      {/* Left panel — decorative (unchanged) */}
      <div className="login-panel">
        <div className="login-panel__inner">
          <div className="login-panel__logo">🏠</div>
          <h1 className="login-panel__heading">Find your perfect space</h1>
          <p className="login-panel__sub">Rooms, kitchens & more — all in one place.</p>
          <ul className="login-panel__perks">
            <li><span>✓</span> Browse verified listings</li>
            <li><span>✓</span> Connect directly with owners</li>
            <li><span>✓</span> Manage everything in one dashboard</li>
          </ul>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="login-form-side">
        <div className="login-card">

          {/* ── STEP: login (original, unchanged) ── */}
          {step === "login" && (
            <>
              <div className="login-card__header">
                <h2 className="login-card__title">Welcome back</h2>
                <p className="login-card__sub">Sign in to your account to continue.</p>
              </div>

              {error && (
                <div className="login-error">
                  <span>⚠</span> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="login-form">

                <div className="login-field">
                  <label htmlFor="login-email">Email address</label>
                  <input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="login-field">
                  {/* label row with forgot password link */}
                  <div className="login-field__row">
                    <label htmlFor="login-password">Password</label>
                    <button
                      type="button"
                      className="login-forgot-link"
                      onClick={() => { goBack("forgot"); setFpEmail(email); }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="login-password-wrap">
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="login-eye-btn"
                      onClick={() => setShowPassword(v => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? "🙈" : "👁"}
                    </button>
                  </div>
                </div>

                <button type="submit" className={`login-btn${loading ? " login-btn--loading" : ""}`} disabled={loading}>
                  {loading ? <span className="login-btn__spinner" /> : "Sign in"}
                </button>

              </form>

              <p className="login-register-link">
                Don't have an account? <a href="/register">Create one</a>
              </p>
            </>
          )}

          {/* ── STEP: forgot — enter email ── */}
          {step === "forgot" && (
            <>
              <button className="login-back-btn" onClick={() => goBack("login")}>← Back</button>
              <div className="login-card__header">
                <h2 className="login-card__title">Reset password</h2>
                <p className="login-card__sub">Enter your email and we'll send you a verification code.</p>
              </div>
              {error && <div className="login-error"><span>⚠</span> {error}</div>}
              <form onSubmit={handleForgotSend} className="login-form">
                <div className="login-field">
                  <label htmlFor="fp-email">Email address</label>
                  <input
                    id="fp-email"
                    type="email"
                    placeholder="you@example.com"
                    value={fpEmail}
                    onChange={e => setFpEmail(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className={`login-btn${loading ? " login-btn--loading" : ""}`} disabled={loading}>
                  {loading ? <span className="login-btn__spinner" /> : "Send Verification Code"}
                </button>
              </form>
            </>
          )}

          {/* ── STEP: otp — verify code ── */}
          {step === "otp" && (
            <>
              <button className="login-back-btn" onClick={() => goBack("forgot")}>← Back</button>
              <div className="login-card__header">
                <h2 className="login-card__title">Check your email</h2>
                <p className="login-card__sub">
                  We sent a 6-digit code to <strong>{fpEmail}</strong>.
                </p>
              </div>
              {error && <div className="login-error"><span>⚠</span> {error}</div>}
              <form onSubmit={handleVerifyOtp} className="login-form">
                <div className="login-otp-row" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`fp-otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className={`login-otp-box${digit ? " login-otp-box--filled" : ""}`}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>
                <button type="submit" className={`login-btn${loading ? " login-btn--loading" : ""}`} disabled={loading}>
                  {loading ? <span className="login-btn__spinner" /> : "Verify Code"}
                </button>
              </form>
              <p className="login-resend">
                Didn't receive it?{" "}
                <button type="button" className="login-resend-btn" onClick={handleResend} disabled={resending}>
                  {resending ? "Sending…" : "Resend code"}
                </button>
              </p>
            </>
          )}

          {/* ── STEP: reset — new password ── */}
          {step === "reset" && (
            <>
              <div className="login-card__header">
                <h2 className="login-card__title">New password</h2>
                <p className="login-card__sub">Choose a strong password for your account.</p>
              </div>
              {error && <div className="login-error"><span>⚠</span> {error}</div>}
              <form onSubmit={handleResetPassword} className="login-form">
                <div className="login-field">
                  <label htmlFor="new-password">New password</label>
                  <div className="login-password-wrap">
                    <input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="login-eye-btn"
                      onClick={() => setShowNewPassword(v => !v)}
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? "🙈" : "👁"}
                    </button>
                  </div>
                </div>
                <button type="submit" className={`login-btn${loading ? " login-btn--loading" : ""}`} disabled={loading}>
                  {loading ? <span className="login-btn__spinner" /> : "Reset Password"}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default Login;