import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./Notification.css";
import NotificationsPage from "../pages/NotificationPage";

const TYPE_ICON = {
  message:      "💬",
  subscription: "🎉",
  announcement: "📢",
  pause:        "⏸",
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]               = useState(0);
  const [open, setOpen]                   = useState(false);
  const dropRef  = useRef(null);
  const navigate = useNavigate();

  async function fetchNotifications() {
    try {
      const res = await api.get("/notifications/my");
      setNotifications(res.data.data.notifications);
      setUnread(res.data.data.unreadCount);
    } catch {
      // silently fail
    }
  }

  useEffect(() => {
    fetchNotifications();
    const t = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(t);
  }, []);

  // close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleOpen() {
    navigate("/notifications");
  }

  function handleNotificationClick(n) {
    if (n.type === "message" && n.conversationId) {
      navigate(`/chat/${n.conversationId}`);
      setOpen(false);
    }
    if ((n.type === "subscription" || n.type === "announcement") && n.kitchenId) {
      navigate(`/kitchens/${n.kitchenId}`);
      setOpen(false);
    }
  }

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div className="nb-wrap" ref={dropRef}>
      <button className="nb-btn" onClick={handleOpen} aria-label="Notifications">
        🔔
        {unread > 0 && (
          <span className="nb-badge">{unread > 9 ? "9+" : unread}</span>
        )}
      </button>

      {open && (
        <div className="nb-dropdown">
          <div className="nb-header">
            <span className="nb-header-title">Notifications</span>
            {unread === 0 && notifications.length > 0 && (
              <span className="nb-all-read">All caught up ✓</span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="nb-empty">No notifications yet</div>
          ) : (
            <ul className="nb-list">
              {notifications.map(n => (
                <li
                  key={n._id}
                  className={`nb-item ${!n.isRead ? "nb-item--unread" : ""} ${
                    n.type === "message" || n.kitchenId ? "nb-item--clickable" : ""
                  } ${n.type === "pause" ? "nb-item--pause" : ""}`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="nb-item-left">
                    <span className="nb-item-icon">{TYPE_ICON[n.type] || "🔔"}</span>
                  </div>
                  <div className="nb-item-content">
                    <div className="nb-item-title">{n.title}</div>
                    <div className="nb-item-msg">{n.message}</div>
                    <div className="nb-item-time">{timeAgo(n.createdAt)}</div>
                  </div>
                  {!n.isRead && <span className="nb-unread-dot" />}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}