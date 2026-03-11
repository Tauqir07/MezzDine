import { useEffect, useRef, useState } from "react";
import api from "../../api/axios";
import "./EditProfile.css";

export default function EditProfileModal({ user, onClose, onUpdated }) {
  const [tab, setTab]               = useState("info"); // "info" | "password"
  const [name, setName]             = useState(user?.name || "");
  const [email, setEmail]           = useState(user?.email || "");
  const [phone, setPhone]           = useState(user?.phone || "");
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd]         = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");
  const overlayRef = useRef(null);

  // close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (e.target === overlayRef.current) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  // close on Escape
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function handleInfoSave() {
    setError(""); setSuccess("");
    if (!name.trim()) return setError("Name cannot be empty");
    if (phone && !/^\d{10}$/.test(phone.trim()))
      return setError("Enter a valid 10-digit phone number");

    setLoading(true);
    try {
      const res = await api.patch("/auth/profile", { name, email });
      if (phone && phone !== user?.phone) {
        await api.patch("/auth/phone", { phone: phone.trim() });
      }
      onUpdated({ ...res.data.data, phone: phone.trim() });
      setSuccess("Profile updated!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordSave() {
    setError(""); setSuccess("");
    if (!currentPwd) return setError("Enter your current password");
    if (!newPwd)     return setError("Enter a new password");
    if (newPwd.length < 6) return setError("New password must be at least 6 characters");
    if (newPwd !== confirmPwd) return setError("Passwords do not match");

    setLoading(true);
    try {
      await api.patch("/auth/profile", { currentPassword: currentPwd, newPassword: newPwd });
      setSuccess("Password updated!");
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="epm-overlay" ref={overlayRef}>
      <div className="epm-modal">

        {/* ── Header ── */}
        <div className="epm-header">
          <div className="epm-avatar">
            {(user?.name || "U")[0].toUpperCase()}
          </div>
          <div className="epm-header-text">
            <h2 className="epm-title">Edit Profile</h2>
            <p className="epm-subtitle">{user?.email}</p>
          </div>
          <button className="epm-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* ── Tabs ── */}
        <div className="epm-tabs">
          <button
            className={`epm-tab ${tab === "info" ? "epm-tab--active" : ""}`}
            onClick={() => { setTab("info"); setError(""); setSuccess(""); }}
          >
            Personal Info
          </button>
          <button
            className={`epm-tab ${tab === "password" ? "epm-tab--active" : ""}`}
            onClick={() => { setTab("password"); setError(""); setSuccess(""); }}
          >
            Password
          </button>
        </div>

        {/* ── Body ── */}
        <div className="epm-body">

          {tab === "info" && (
            <div className="epm-fields">
              <label className="epm-label">
                Full Name
                <input
                  className="epm-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                />
              </label>
              <label className="epm-label">
                Email
                <input
                  className="epm-input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </label>
              <label className="epm-label">
                Phone
                <input
                  className="epm-input"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="10-digit phone number"
                  maxLength={10}
                />
              </label>
              <button
                className="epm-save-btn"
                onClick={handleInfoSave}
                disabled={loading}
              >
                {loading ? "Saving…" : "Save Changes"}
              </button>
            </div>
          )}

          {tab === "password" && (
            <div className="epm-fields">
              <label className="epm-label">
                Current Password
                <input
                  className="epm-input"
                  type="password"
                  value={currentPwd}
                  onChange={e => setCurrentPwd(e.target.value)}
                  placeholder="Enter current password"
                />
              </label>
              <label className="epm-label">
                New Password
                <input
                  className="epm-input"
                  type="password"
                  value={newPwd}
                  onChange={e => setNewPwd(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </label>
              <label className="epm-label">
                Confirm New Password
                <input
                  className="epm-input"
                  type="password"
                  value={confirmPwd}
                  onChange={e => setConfirmPwd(e.target.value)}
                  placeholder="Repeat new password"
                />
              </label>
              <button
                className="epm-save-btn"
                onClick={handlePasswordSave}
                disabled={loading}
              >
                {loading ? "Saving…" : "Update Password"}
              </button>
            </div>
          )}

          {error   && <p className="epm-error">{error}</p>}
          {success && <p className="epm-success">{success}</p>}
        </div>

      </div>
    </div>
  );
}