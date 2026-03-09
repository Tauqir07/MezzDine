import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMessages, sendMessage } from "../api/chat";
import api from "../api/axios";
import socket from "../socket";
import { useAuth } from "../context/authContext";
import "./Chat.css";

// ── Pure helpers ──────────────────────────────────────────────────────────────

function getSenderId(sender) {
  if (!sender) return null;
  if (typeof sender === "string") return sender;
  return sender._id ? String(sender._id) : null;
}

function getSenderName(sender, fallback = "Unknown") {
  if (sender && typeof sender === "object") return sender.name ?? fallback;
  return fallback;
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString([], {
    hour:   "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name = "") {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [messages,    setMessages]    = useState([]);
  const [text,        setText]        = useState("");
  const [receiver,    setReceiver]    = useState(null);
  const [newMsgAlert, setNewMsgAlert] = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [replyTo,     setReplyTo]     = useState(null); // ── reply state

  const userIdRef   = useRef(String(user._id));
  const receiverRef = useRef(null);
  const alertTimer  = useRef(null);
  const bottomRef   = useRef();
  const inputRef    = useRef();

  useEffect(() => { userIdRef.current   = String(user._id); }, [user._id]);
  useEffect(() => { receiverRef.current = receiver;         }, [receiver]);

  // ── Load messages ─────────────────────────────────────────────────────────

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMessages(id);
      setMessages(res.data);
    } catch (err) {
      console.error("loadMessages error:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadReceiver = useCallback(async () => {
    try {
      const res = await api.get(`/chat/${id}/receiver`);
      setReceiver(res.data);
    } catch {
      try {
        const res = await api.get("/chat");
        const convo = res.data.find(c => c._id === id);
        if (!convo) return;
        const other = convo.participants.find(
          p => String(p._id) !== String(user._id)
        );
        setReceiver(other ?? null);
      } catch (err) {
        console.error("loadReceiver error:", err);
      }
    }
  }, [id, user._id]);

  // ── Reset + reload on conversation change ─────────────────────────────────

  useEffect(() => {
    setMessages([]);
    setNewMsgAlert(false);
    setText("");
    setReplyTo(null);
    loadMessages();
    loadReceiver();
    return () => { document.title = "MeZzDiNe"; };
  }, [id, loadMessages, loadReceiver]);

  // ── Socket ────────────────────────────────────────────────────────────────

  useEffect(() => {
    socket.emit("join", String(user._id));

    function handleNewMessage(msg) {
      let normalizedMsg = msg;
      if (typeof msg.sender === "string" || !msg.sender?._id) {
        const senderId = getSenderId(msg.sender);
        const isOwn    = senderId === userIdRef.current;
        normalizedMsg  = {
          ...msg,
          sender: {
            _id:  senderId,
            name: isOwn ? "You" : (receiverRef.current?.name ?? "Unknown"),
          },
        };
      } else {
        normalizedMsg = {
          ...msg,
          sender: { ...msg.sender, _id: String(msg.sender._id) },
        };
      }

      setMessages(prev => {
        if (prev.some(m => m._id === normalizedMsg._id)) return prev;
        return [...prev, normalizedMsg];
      });

      if (getSenderId(normalizedMsg.sender) !== userIdRef.current) {
        setNewMsgAlert(true);
        document.title = "💬 New Message!";
        clearTimeout(alertTimer.current);
        alertTimer.current = setTimeout(() => {
          setNewMsgAlert(false);
          document.title = "MeZzDiNe";
        }, 4000);
      }
    }

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
      clearTimeout(alertTimer.current);
    };
  }, [user._id]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Focus input when replying ─────────────────────────────────────────────

  useEffect(() => {
    if (replyTo) inputRef.current?.focus();
  }, [replyTo]);

  // ── Send message ──────────────────────────────────────────────────────────

  async function handleSend() {
    if (!text.trim()) return;
    const optimisticText  = text;
    const optimisticReply = replyTo;
    setText("");
    setReplyTo(null);
    try {
      await sendMessage(id, optimisticText, optimisticReply?._id ?? null);
    } catch (err) {
      console.error("sendMessage error:", err);
      setText(optimisticText);
      setReplyTo(optimisticReply);
    }
  }

  // ── Reply helpers ─────────────────────────────────────────────────────────

  function handleReply(msg) {
    setReplyTo(msg);
  }

  function cancelReply() {
    setReplyTo(null);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="chat-root">

      {/* HEADER */}
      <div className="chat-header">
        <button className="chat-back" onClick={() => navigate(-1)} aria-label="Back">←</button>
        <div className="chat-avatar">
          {receiver ? getInitials(receiver.name) : "?"}
        </div>
        <div className="chat-header-info">
          <div className="chat-header-name-row">
            <span className="chat-header-name">{receiver?.name ?? "Chat"}</span>
            {newMsgAlert && (
              <span className="chat-new-msg-badge">
                <span className="chat-new-msg-dot" />
                New message
              </span>
            )}
          </div>
          <div className="chat-header-status">Online</div>
        </div>
      </div>

      {/* MESSAGES */}
      <div className="chat-messages">
        {loading ? (
          <div className="chat-empty">
            <div className="chat-empty-icon">⏳</div>
            <span>Loading messages…</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            <div className="chat-empty-icon">💬</div>
            <span>No messages yet — say hello!</span>
          </div>
        ) : (
          messages.map(msg => {
            const isOwn      = String(getSenderId(msg.sender)) === String(user._id);
            const senderName = isOwn
              ? "You"
              : getSenderName(msg.sender, receiver?.name ?? "Them");

            // resolve reply-to sender name
            const replyToSenderName = msg.replyTo
              ? (String(getSenderId(msg.replyTo.sender)) === String(user._id)
                  ? "You"
                  : getSenderName(msg.replyTo.sender, receiver?.name ?? "Them"))
              : null;

            return (
              <div
                key={msg._id}
                className={`chat-row ${isOwn ? "own" : "other"}`}
                onDoubleClick={() => handleReply(msg)}  /* double-click to reply */
              >
                {!isOwn && (
                  <div className="chat-row-avatar">
                    {getInitials(getSenderName(msg.sender, receiver?.name ?? "?"))}
                  </div>
                )}
                <div className="chat-bubble-wrap">
                  <div className="chat-sender-label">{senderName}</div>

                  <div className="chat-bubble">

                    {/* ── Quoted reply preview ── */}
                    {msg.replyTo && (
                      <div className="chat-reply-quote">
                        <div className="chat-reply-quote-name">{replyToSenderName}</div>
                        <div className="chat-reply-quote-text">
                          {msg.replyTo.text?.length > 80
                            ? msg.replyTo.text.slice(0, 80) + "…"
                            : msg.replyTo.text}
                        </div>
                      </div>
                    )}

                    {msg.text}
                  </div>

                  <div className="chat-time-row">
                    <span className="chat-time">{formatTime(msg.createdAt)}</span>
                    {/* reply button on hover */}
                    <button
                      className="chat-reply-btn"
                      onClick={() => handleReply(msg)}
                      aria-label="Reply"
                      title="Reply"
                    >↩</button>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* REPLY BAR */}
      {replyTo && (
        <div className="chat-reply-bar">
          <div className="chat-reply-bar-content">
            <div className="chat-reply-bar-label">
              Replying to{" "}
              <strong>
                {String(getSenderId(replyTo.sender)) === String(user._id)
                  ? "yourself"
                  : getSenderName(replyTo.sender, receiver?.name ?? "Them")}
              </strong>
            </div>
            <div className="chat-reply-bar-text">
              {replyTo.text?.length > 80
                ? replyTo.text.slice(0, 80) + "…"
                : replyTo.text}
            </div>
          </div>
          <button
            className="chat-reply-bar-cancel"
            onClick={cancelReply}
            aria-label="Cancel reply"
          >✕</button>
        </div>
      )}

      {/* INPUT */}
      <div className="chat-input-area">
        <input
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={replyTo ? "Type your reply…" : "Type a message…"}
          onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
        />
        <button
          className="chat-send-btn"
          onClick={handleSend}
          disabled={!text.trim()}
          aria-label="Send"
        >
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>

    </div>
  );
}