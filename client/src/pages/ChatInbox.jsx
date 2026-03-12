import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getConversations, getMessages } from "../api/chat";
import { useAuth } from "../context/authContext";
import socket from "../socket";
import "./ChatInbox.css";
import PageLoader from "../components/PageLoader";

// ── Pure helpers ──────────────────────────────────────────────────────────────

function getInitials(name = "") {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  const date    = new Date(dateStr);
  const now     = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)  return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

const hues = [340, 20, 45, 160, 200, 260, 290];
function avatarHue(name = "") {
  return hues[(name.charCodeAt(0) || 65) % hues.length];
}

function getPreview(c, userId) {
  const lm = c.lastMessage;
  if (!lm || typeof lm !== "object" || !lm.text) return null;
  const senderId = lm.sender?._id ? String(lm.sender._id) : String(lm.sender);
  return senderId === String(userId) ? `You: ${lm.text}` : lm.text;
}

function getTimestamp(c) {
  return c.lastMessage?.createdAt || c.updatedAt || c.createdAt || null;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ChatInbox() {
  const [convos,         setConvos]         = useState([]);
  const [unread,         setUnread]         = useState({});
  const [loading,        setLoading]        = useState(true);
  const [activeId,       setActiveId]       = useState(null);
  const [previewMsgs,    setPreviewMsgs]    = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [toasts,         setToasts]         = useState([]);

  const toastTimers = useRef({});
  const navigate    = useNavigate();
  const { user }    = useAuth();

  // ── Load conversations ────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getConversations();
      setConvos(res.data);
    } catch (err) {
      console.error("[ChatInbox] load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Socket ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const myId = String(user._id);
    socket.emit("join", myId);

    function handleNewMessage(msg) {
      const senderId = msg.sender?._id
        ? String(msg.sender._id)
        : String(msg.sender ?? "");

      if (senderId === myId) return;

      const convoId = String(
        msg.conversation || msg.conversationId || msg.chat || msg.chatId || ""
      );
      if (!convoId) return;

      setUnread(prev => ({
        ...prev,
        [convoId]: {
          count:      (prev[convoId]?.count || 0) + 1,
          text:       msg.text ?? "",
          senderName: msg.sender?.name ?? "",
        },
      }));

      setConvos(prev =>
        prev.map(c =>
          String(c._id) === convoId
            ? { ...c, _socketPreview: msg.text, _socketTime: msg.createdAt }
            : c
        )
      );

      const senderName = msg.sender?.name || "Someone";
      const toastId    = `${convoId}-${Date.now()}`;

      setToasts(prev => [
        { id: toastId, senderName, text: msg.text ?? "", convoId, hue: avatarHue(senderName) },
        ...prev.slice(0, 2),
      ]);

      toastTimers.current[toastId] = setTimeout(() => dismissToast(toastId), 5000);
    }

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
      Object.values(toastTimers.current).forEach(clearTimeout);
    };
  }, [user._id]);

  // ── Toast helpers ─────────────────────────────────────────────────────────

  function dismissToast(toastId) {
    clearTimeout(toastTimers.current[toastId]);
    delete toastTimers.current[toastId];
    setToasts(prev => prev.filter(t => t.id !== toastId));
  }

  function handleToastClick(toast) {
    dismissToast(toast.id);
    setUnread(prev => ({ ...prev, [toast.convoId]: { count: 0 } }));
    navigate(`/chat/${toast.convoId}`);
  }

  // ── Open conversation ─────────────────────────────────────────────────────
  // On mobile: navigate directly. On desktop: show preview panel.

  async function openChat(id) {
    setUnread(prev => ({ ...prev, [id]: { count: 0 } }));

    // ── FIX: navigate directly on mobile ──
    if (window.innerWidth <= 768) {
      navigate(`/chat/${id}`);
      return;
    }

    setActiveId(id);
    setPreviewMsgs([]);
    setPreviewLoading(true);
    try {
      const res = await getMessages(id);
      setPreviewMsgs((res.data || []).slice(-6));
    } catch (err) {
      console.error("[ChatInbox] loadPreview error:", err);
    } finally {
      setPreviewLoading(false);
    }
  }

  // ── Derived values ────────────────────────────────────────────────────────

  const totalUnread  = Object.values(unread).reduce((sum, v) => sum + (v?.count || 0), 0);
  const activeConvo  = convos.find(c => c._id === activeId);
  const activeOther  = activeConvo?.participants?.find(p => String(p._id) !== String(user._id));

  if (loading) return <PageLoader />;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="inbox-root">

      {/* ── TOAST NOTIFICATIONS ── */}
      {toasts.length > 0 && (
        <div className="inbox-toast-stack">
          {toasts.map(toast => (
            <div key={toast.id} className="inbox-toast" onClick={() => handleToastClick(toast)}>
              <div
                className="inbox-toast-avatar"
                style={{ background: `linear-gradient(135deg, hsl(${toast.hue},70%,55%), hsl(${toast.hue + 30},65%,45%))` }}
              >
                {getInitials(toast.senderName)}
              </div>
              <div className="inbox-toast-body">
                <div className="inbox-toast-name">{toast.senderName}</div>
                <div className="inbox-toast-text">
                  {toast.text.length > 60 ? toast.text.slice(0, 60) + "…" : toast.text}
                </div>
              </div>
              <button
                className="inbox-toast-close"
                onClick={e => { e.stopPropagation(); dismissToast(toast.id); }}
              >×</button>
            </div>
          ))}
        </div>
      )}

      {/* ── LEFT SIDEBAR ── */}
      <div className="inbox-sidebar">
        <div className="inbox-header">
          <div className="inbox-header-left">
            <h1 className="inbox-title">Messages</h1>
            {totalUnread > 0 && (
              <span className="inbox-total-badge">{totalUnread}</span>
            )}
          </div>
          <div className="inbox-header-sub">
            {convos.length} conversation{convos.length !== 1 ? "s" : ""}
          </div>
        </div>

        <div className="inbox-list">
          {loading && [1, 2, 3, 4].map(i => (
            <div key={i} className="inbox-skeleton">
              <div className="skeleton-avatar" />
              <div className="skeleton-lines">
                <div className="skeleton-line wide" />
                <div className="skeleton-line narrow" />
              </div>
            </div>
          ))}

          {!loading && convos.length === 0 && (
            <div className="inbox-empty">
              <div className="inbox-empty-icon">✉️</div>
              <p>No conversations yet</p>
              <span>Start a chat to see it here</span>
            </div>
          )}

          {!loading && convos.map((c, i) => {
            const other      = c.participants?.find(p => String(p._id) !== String(user._id));
            const unreadInfo = unread[String(c._id)];
            const hasUnread  = (unreadInfo?.count || 0) > 0;
            const isActive   = c._id === activeId;
            const hue        = avatarHue(other?.name);
            const preview    = c._socketPreview || getPreview(c, user._id);
            const timestamp  = c._socketTime    || getTimestamp(c);

            return (
              <div
                key={c._id}
                className={`inbox-item ${hasUnread ? "unread" : ""} ${isActive ? "active" : ""}`}
                style={{ animationDelay: `${i * 35}ms` }}
                onClick={() => openChat(c._id)}
              >
                <div className="inbox-avatar" style={{
                  background: `linear-gradient(135deg, hsl(${hue},70%,55%), hsl(${hue + 30},65%,45%))`,
                }}>
                  {getInitials(other?.name)}
                  <span className="inbox-online-dot" />
                </div>

                <div className="inbox-item-body">
                  <div className="inbox-item-top">
                    <span className="inbox-name">{other?.name ?? "Unknown"}</span>
                    <span className="inbox-time">{formatTime(timestamp)}</span>
                  </div>
                  <div className="inbox-item-bottom">
                    {hasUnread ? (
                      <>
                        <span className="inbox-new-msg">
                          <span className="inbox-new-dot" />
                          {unreadInfo.count > 1 ? `${unreadInfo.count} new messages` : "New message"}
                        </span>
                        <span className="unread-badge-count">{unreadInfo.count}</span>
                      </>
                    ) : (
                      <span className={`inbox-preview ${!preview ? "inbox-preview--empty" : ""}`}>
                        {preview ?? "Start the conversation"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── RIGHT PANEL (desktop only) ── */}
      <div className="inbox-detail">
        {!activeOther ? (
          <div className="inbox-detail-inner">
            <div className="inbox-detail-icon">💬</div>
            <div className="inbox-detail-title">Select a conversation</div>
            <div className="inbox-detail-sub">
              Choose someone from the list to start or continue a conversation.
            </div>
            {!loading && convos.length > 0 && (
              <div className="inbox-stats">
                <div className="inbox-stat">
                  <span className="inbox-stat-num">{convos.length}</span>
                  <span className="inbox-stat-label">Chats</span>
                </div>
                <div className="inbox-stat">
                  <span className="inbox-stat-num">{totalUnread}</span>
                  <span className="inbox-stat-label">Unread</span>
                </div>
                <div className="inbox-stat">
                  <span className="inbox-stat-num">
                    {convos.filter(c => getPreview(c, user._id)).length}
                  </span>
                  <span className="inbox-stat-label">Active</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="inbox-preview-panel">
            <div className="preview-header">
              <div className="preview-avatar" style={{
                background: `linear-gradient(135deg, hsl(${avatarHue(activeOther.name)},70%,55%), hsl(${avatarHue(activeOther.name) + 30},65%,45%))`,
              }}>
                {getInitials(activeOther.name)}
              </div>
              <div>
                <div className="preview-name">{activeOther.name}</div>
                <div className="preview-sub">Recent messages</div>
              </div>
              <button
                className="preview-open-btn"
                onClick={() => navigate(`/chat/${activeId}`)}
              >
                Open chat →
              </button>
            </div>

            <div className="preview-messages">
              {previewLoading && (
                <div className="preview-loading">
                  <span className="preview-loading-dot" />
                  <span className="preview-loading-dot" />
                  <span className="preview-loading-dot" />
                </div>
              )}
              {!previewLoading && previewMsgs.length === 0 && (
                <div className="preview-empty">
                  No messages yet — open the chat to say hello!
                </div>
              )}
              {!previewLoading && previewMsgs.map(msg => {
                const isOwn = String(msg.sender?._id ?? msg.sender) === String(user._id);
                return (
                  <div key={msg._id} className={`preview-bubble-row ${isOwn ? "own" : "other"}`}>
                    <div className="preview-bubble">{msg.text}</div>
                    <div className="preview-bubble-time">{formatTime(msg.createdAt)}</div>
                  </div>
                );
              })}
            </div>

            <div className="preview-footer">
              <button
                className="preview-cta"
                onClick={() => navigate(`/chat/${activeId}`)}
              >
                Continue conversation
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}