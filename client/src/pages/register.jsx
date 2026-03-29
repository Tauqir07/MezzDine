import { useState } from "react";
import api from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import "./register.css";

function Register() {
  const navigate = useNavigate();

  // form fields
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [phone,    setPhone]    = useState("");   // ← ADDED
  const [password, setPassword] = useState("");
  const [role,     setRole]     = useState("");

  // password visibility
  const [showPassword, setShowPassword] = useState(false);

  // OTP flow
  const [step,     setStep]     = useState("form"); // "form" | "otp"
  const [otp,      setOtp]      = useState(["", "", "", "", "", ""]);
  const [otpToken, setOtpToken] = useState("");

  // ui
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [resending, setResending] = useState(false);

  // ── Step 1: submit form → request OTP via email ────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // client-side phone check before hitting the server
    if (!/^\d{10}$/.test(phone.trim())) {
      setError("Enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/register/send-otp", {
        name,
        email,
        phone: phone.trim(),   // ← ADDED
        password,
        role,
      });

      setOtpToken(res.data.otpToken);
      setStep("otp");

    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify OTP → complete registration ─────────────────────────────

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length < 6) { setError("Please enter the full 6-digit code"); return; }
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/register/verify-otp", {
        email,
        otp: otpValue,
        otpToken,
      });

      if (res.data.success) {
        navigate("/login");
      }

    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ─────────────────────────────────────────────────────────────

  const handleResend = async () => {
    setResending(true);
    setError("");
    try {
      const res = await api.post("/auth/register/resend-otp", { otpToken });
      setOtpToken(res.data.otpToken);
    } catch (err) {
      setError(err.response?.data?.message || "Could not resend OTP. Please try again.");
    } finally {
      setResending(false);
    }
  };

  // ── OTP input helpers ──────────────────────────────────────────────────────

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      document.getElementById("otp-5")?.focus();
    }
    e.preventDefault();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="rg-wrapper">

      {/* Left decorative panel */}
      <div className="rg-panel">
        <div className="rg-panel__inner">
          <div className="rg-panel__logo">🏠</div>
          <h1 className="rg-panel__heading">Join StayFinder</h1>
          <p className="rg-panel__sub">
            Explore rooms, list kitchens, and manage everything in one place.
          </p>
          <ul className="rg-panel__perks">
            <li><span>✓</span> Browse verified listings</li>
            <li><span>✓</span> List your space in minutes</li>
            <li><span>✓</span> Secure OTP-verified accounts</li>
          </ul>
        </div>
      </div>

      {/* Right form side */}
      <div className="rg-form-side">
        <div className="rg-card">

          {step === "form" ? (

            /* ── Registration form ── */
            <>
              <div className="rg-card__header">
                <h2 className="rg-card__title">Create account</h2>
                <p className="rg-card__sub">We'll send a verification code to your email.</p>
              </div>

              {error && <div className="rg-error"><span>⚠</span> {error}</div>}

              <form onSubmit={handleSubmit} className="rg-form">

                <div className="rg-field">
                  <label htmlFor="rg-name">Full Name</label>
                  <input
                    id="rg-name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="rg-field">
                  <label htmlFor="rg-email">Email address</label>
                  <input
                    id="rg-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="rg-field">
                  <label htmlFor="rg-phone">Phone number</label>   {/* ← ADDED */}
                  <input
                    id="rg-phone"
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    required
                  />
                </div>

                <div className="rg-field">
                  <label htmlFor="rg-password">Password</label>
                  <div className="rg-password-wrap">
                    <input
                      id="rg-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="rg-eye-btn"
                      onClick={() => setShowPassword(v => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? "🙈" : "👁"}
                    </button>
                  </div>
                </div>

                <div className="rg-field">
                  <label htmlFor="rg-role">I am a…</label>
                  <select
                    id="rg-role"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    required
                    className={role ? "rg-select--filled" : ""}
                  >
                    <option value="">Select role</option>
                    <option value="user">Normal User</option>
                    <option value="roomProvider">Room Provider</option>
                    <option value="kitchenOwner">Kitchen Owner</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className={`rg-btn${loading ? " rg-btn--loading" : ""}`}
                  disabled={loading}
                >
                  {loading ? <span className="rg-spinner" /> : "Send Verification Code"}
                </button>

              </form>

              <p className="rg-switch">
                Already have an account? <Link to="/login">Sign in</Link>
              </p>
            </>

          ) : (

            /* ── OTP verification step ── */
            <>
              <button
                className="rg-back-btn"
                onClick={() => { setStep("form"); setError(""); setOtp(["","","","","",""]); }}
              >
                ← Back
              </button>

              <div className="rg-card__header">
                <h2 className="rg-card__title">Check your email</h2>
                <p className="rg-card__sub">
                  We sent a 6-digit code to <strong>{email}</strong>.
                  Enter it below to verify your account.
                </p>
              </div>

              {error && <div className="rg-error"><span>⚠</span> {error}</div>}

              <form onSubmit={handleVerifyOtp} className="rg-form">

                <div className="rg-otp-row" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className={`rg-otp-box${digit ? " rg-otp-box--filled" : ""}`}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  className={`rg-btn${loading ? " rg-btn--loading" : ""}`}
                  disabled={loading}
                >
                  {loading ? <span className="rg-spinner" /> : "Verify & Create Account"}
                </button>

              </form>

              <p className="rg-resend">
                Didn't receive it?{" "}
                <button
                  type="button"
                  className="rg-resend-btn"
                  onClick={handleResend}
                  disabled={resending}
                >
                  {resending ? "Sending…" : "Resend code"}
                </button>
              </p>

              <p className="rg-resend" style={{ marginTop: "8px" }}>
                Wrong email?{" "}
                <button
                  type="button"
                  className="rg-resend-btn"
                  onClick={() => { setStep("form"); setOtp(["","","","","",""]); setError(""); }}
                >
                  Change it
                </button>
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default Register;