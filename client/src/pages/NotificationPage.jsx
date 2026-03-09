import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./NotificationPage.css";

const TYPE_ICON = {
  message:      "💬",
  subscription: "🎉",
  announcement: "📢",
  pause:        "⏸",
};

const TYPE_LABEL = {
  message:      "Messages",
  subscription: "Subscriptions",
  announcement: "Announcements",
  pause:        "Pauses",
};

const FILTERS = ["all", "message", "announcement", "subscription", "pause"];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]               = useState(0);
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState("all");
  const navigate = useNavigate();

  async function fetchNotifications() {
    try {
      const res = await api.get("/notifications/my");
      setNotifications(res.data.data.notifications);
      setUnread(res.data.data.unreadCount);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
  }, []);

  // mark all read when page is opened
  useEffect(() => {
    api.patch("/notifications/mark-read").catch(() => {});
  }, []);

  function handleClick(n) {
    if (n.type === "message" && n.conversationId) {
      navigate(`/chat/${n.conversationId}`);
    }
    if ((n.type === "subscription" || n.type === "announcement") && n.kitchenId) {
      navigate(`/kitchens/${n.kitchenId}`);
    }
  }

  async function clearAll() {
    try {
      await api.delete("/notifications/clear").catch(() => {});
      setNotifications([]);
      setUnread(0);
    } catch {
      // silently fail if endpoint not implemented
      setNotifications([]);
    }
  }

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7)  return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric", month: "short"
    });
  }

  function groupByDate(list) {
    const groups = {};
    list.forEach(n => {
      const d = new Date(n.createdAt);
      const now = new Date();
      const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
      const key =
        diffDays === 0 ? "Today" :
        diffDays === 1 ? "Yesterday" :
        d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });
      if (!groups[key]) groups[key] = [];
      groups[key].push(n);
    });
    return groups;
  }

  const filtered = filter === "all"
    ? notifications
    : notifications.filter(n => n.type === filter);

  const grouped = groupByDate(filtered);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="np-page">

      {/* ── Header ── */}
      <div className="np-header">
        <div className="np-header-left">
          <h1 className="np-title">Notifications</h1>
          {unreadCount > 0 && (
            <span className="np-unread-chip">{unreadCount} new</span>
          )}
        </div>
        {notifications.length > 0 && (
          <button className="np-clear-btn" onClick={clearAll}>
            Clear all
          </button>
        )}
      </div>

      {/* ── Filter tabs ── */}
      <div className="np-filters">
        {FILTERS.map(f => {
          const count = f === "all"
            ? notifications.length
            : notifications.filter(n => n.type === f).length;
          if (f !== "all" && count === 0) return null;
          return (
            <button
              key={f}
              className={`np-filter-btn ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All" : TYPE_LABEL[f]}
              <span className="np-filter-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="np-skeleton-list">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="np-skeleton" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="np-skeleton-icon" />
              <div className="np-skeleton-body">
                <div className="np-skeleton-line np-skeleton-line--wide" />
                <div className="np-skeleton-line np-skeleton-line--narrow" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="np-empty">
          <div className="np-empty-icon">🔔</div>
          <p className="np-empty-title">No notifications yet</p>
          <p className="np-empty-sub">
            {filter === "all"
              ? "You're all caught up! We'll let you know when something happens."
              : `No ${TYPE_LABEL[filter]?.toLowerCase()} notifications yet.`}
          </p>
        </div>
      ) : (
        <div className="np-list">
          {Object.entries(grouped).map(([dateLabel, items]) => (
            <div key={dateLabel} className="np-group">
              <div className="np-group-label">{dateLabel}</div>
              {items.map((n, i) => {
                const isClickable = (n.type === "message" && n.conversationId) ||
                  ((n.type === "subscription" || n.type === "announcement") && n.kitchenId);
                return (
                  <div
                    key={n._id}
                    className={`np-item ${!n.isRead ? "np-item--unread" : ""} ${isClickable ? "np-item--clickable" : ""} ${n.type === "pause" ? "np-item--pause" : ""}`}
                    style={{ animationDelay: `${i * 40}ms` }}
                    onClick={() => isClickable && handleClick(n)}
                  >
                    {/* icon bubble */}
                    <div className={`np-item-icon np-item-icon--${n.type}`}>
                      {TYPE_ICON[n.type] || "🔔"}
                    </div>

                    {/* content */}
                    <div className="np-item-content">
                      <div className="np-item-title">{n.title}</div>
                      <div className="np-item-msg">{n.message}</div>
                      <div className="np-item-meta">
                        <span className="np-item-time">{timeAgo(n.createdAt)}</span>
                        {isClickable && (
                          <span className="np-item-cta">
                            {n.type === "message" ? "Open chat →" : "View →"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* unread dot */}
                    {!n.isRead && <span className="np-item-dot" />}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}