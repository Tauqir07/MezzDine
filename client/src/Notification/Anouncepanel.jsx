import { useState } from "react";
import api from "../api/axios";
import "./Anouncepanel.css";

export default function AnnouncePanel({ kitchenId, subscriberCount }) {
  const [message, setMessage] = useState("");
  const [status,  setStatus]  = useState(null); // "sending" | "sent" | "error"

  async function send() {
    if (!message.trim()) return;
    setStatus("sending");
    try {
      const res = await api.post(`/notifications/announce/${kitchenId}`, { message });
      setStatus("sent");
      setMessage("");
      setTimeout(() => setStatus(null), 3000);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="ap-wrap">
      <h3 className="ap-title">📢 Announce to Subscribers</h3>
      <p className="ap-sub">
        This message will appear as a notification for all{" "}
        <strong>{subscriberCount}</strong> subscriber{subscriberCount !== 1 ? "s" : ""}.
      </p>

      {/* Quick templates */}
      <div className="ap-templates">
        {[
          "Kitchen will be closed today 🚫",
          "Menu updated for this week 📋",
          "Holiday break — back on Monday 🎉",
        ].map(t => (
          <button key={t} className="ap-tpl" onClick={() => setMessage(t)}>
            {t}
          </button>
        ))}
      </div>

      <textarea
        className="ap-input"
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Write your message to all subscribers..."
        rows={3}
      />

      <button
        className="ap-send-btn"
        onClick={send}
        disabled={!message.trim() || status === "sending"}
      >
        {status === "sending" ? "Sending…" : "Send Announcement"}
      </button>

      {status === "sent" && (
        <p className="ap-feedback ap-feedback--ok">
          ✓ Sent to {subscriberCount} subscriber{subscriberCount !== 1 ? "s" : ""}
        </p>
      )}
      {status === "error" && (
        <p className="ap-feedback ap-feedback--err">Failed to send. Try again.</p>
      )}
    </div>
  );
}