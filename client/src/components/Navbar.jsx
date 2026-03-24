import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/authContext";
import socket from "../socket";
import { getMyKitchens } from "../api/kitchen";
import { getMyRooms } from "../api/rooms";
import api from "../api/axios";
import "./Navbar.css";
import NotificationBell from "../Notification/Notificationbell";
import EditProfileModal from "./EditProfile/EditProfile";

export default function Navbar() {
  const { user, setUser, loading } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [unread,      setUnread]      = useState(0);
  const [myKitchenId, setMyKitchenId] = useState(null);
  const [myRoomId,    setMyRoomId]    = useState(null);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [scrolled,    setScrolled]    = useState(false);
  const [dropOpen,    setDropOpen]    = useState(false);
  const [showEdit,    setShowEdit]    = useState(false);

  const dropRef = useRef(null);

  // scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // close dropdown on outside click
  useEffect(() => {
    const handler = e => {
      if (dropRef.current && !dropRef.current.contains(e.target))
        setDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // on login — fetch missed message notifications from DB
  // this covers messages received while logged out
  useEffect(() => {
    if (!user?._id) return;
    api.get("/notifications/my")
      .then(res => {
        const all = res.data.data.notifications || [];
        const missedMessages = all.filter(n => n.type === "message" && !n.isRead);
        setUnread(missedMessages.length);
      })
      .catch(() => {});
  }, [user?._id]);

  // socket — increment badge for new messages while logged in
  useEffect(() => {
    if (!user?._id) return;
    socket.emit("join", String(user._id));
    function handleNewMessage(msg) {
      const senderId = msg.sender?._id ? String(msg.sender._id) : String(msg.sender);
      if (senderId === String(user._id)) return;
      setUnread(p => p + 1);
    }
    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, [user?._id]);

  // clear badge + mark message notifications read when visiting /chat
  useEffect(() => {
    if (location.pathname.startsWith("/chat")) {
      setUnread(0);
      // mark all message notifications as read in DB
      if (user?._id) {
        api.patch("/notifications/mark-read").catch(() => {});
      }
    }
    setMenuOpen(false);
    setDropOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (user?.role !== "kitchenOwner") return;
    getMyKitchens()
      .then(res => { const k = res.data.data; if (k?.length) setMyKitchenId(k[0]._id); })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (user?.role !== "roomProvider") return;
    getMyRooms()
      .then(res => { const r = res.data.data; if (r?.length) setMyRoomId(r[0]._id); })
      .catch(() => {});
  }, [user]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  }

  const initial = (user?.name || "U")[0].toUpperCase();

  const roleLinks = user?.role === "user" ? [
    { to: "/my-subscription", label: "My Subscription" },
  ] : user?.role === "kitchenOwner" ? [
    { to: myKitchenId ? `/kitchens/dashboard/${myKitchenId}` : "/kitchens/my", label: "Dashboard" },
    { to: "/kitchens/my",  label: "My Kitchens" },
    { to: "/kitchens/add", label: "Add Kitchen" },
  ] : user?.role === "roomProvider" ? [
    { to: myRoomId ? `/rooms/dashboard/${myRoomId}` : "/rooms/my", label: "Dashboard" },
    { to: "/rooms/my",     label: "My Rooms" },
    { to: "/rooms/create", label: "Add Room" },
  ] : [];

  return (
    <>
      <nav className={`nb ${scrolled ? "nb--scrolled" : ""}`}>
        <div className="nb-inner">

          <Link to="/" className="nb-logo">
            <img src="/logo.svg" alt="MeZzDiNe Logo" className="nb-logo-img" />
          </Link>

          <div className="nb-centre">
            <Link to="/rooms"    className={`nb-link ${location.pathname === "/rooms"    ? "nb-link--active" : ""}`}>Rooms</Link>
            <Link to="/kitchens" className={`nb-link ${location.pathname === "/kitchens" ? "nb-link--active" : ""}`}>Kitchens</Link>

            {user && (
              <Link to="/chat" className={`nb-link nb-link--inbox ${location.pathname.startsWith("/chat") ? "nb-link--active" : ""}`}>
                Inbox
                {unread > 0 && <span className="nb-badge">{unread > 9 ? "9+" : unread}</span>}
              </Link>
            )}
          </div>

          <div className="nb-right">
            {!loading && (
              !user ? (
                <>
                  <Link to="/login"    className="nb-link">Sign in</Link>
                  <Link to="/register" className="nb-pill">Get started</Link>
                </>
              ) : (
                <>
                  <NotificationBell />

                  <div className="nb-drop-wrap" ref={dropRef}>
                    <button
                      className={`nb-avatar ${dropOpen ? "nb-avatar--open" : ""}`}
                      onClick={() => setDropOpen(p => !p)}
                      aria-label="User menu"
                    >
                      {initial}
                    </button>

                    {dropOpen && (
                      <div className="nb-dropdown">
                        <div className="nb-drop-header">
                          <div className="nb-drop-avatar">{initial}</div>
                          <div>
                            <div className="nb-drop-name">{user.name}</div>
                            <div className="nb-drop-role">{
                              user.role === "kitchenOwner" ? "Kitchen Owner" :
                              user.role === "roomProvider" ? "Room Provider" :
                              "Member"
                            }</div>
                          </div>
                        </div>

                        <div className="nb-drop-divider" />

                        <button
                          className="nb-drop-item"
                          onClick={() => { setDropOpen(false); setShowEdit(true); }}
                        >
                          Edit Profile
                        </button>

                        <div className="nb-drop-divider" />

                        {roleLinks.map(l => (
                          <Link
                            key={l.to}
                            to={l.to}
                            className="nb-drop-item"
                            onClick={() => setDropOpen(false)}
                          >
                            {l.label}
                          </Link>
                        ))}

                        {roleLinks.length > 0 && <div className="nb-drop-divider" />}

                        <button className="nb-drop-item nb-drop-item--logout" onClick={handleLogout}>
                          Sign out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )
            )}

            <button
              className={`nb-hamburger ${menuOpen ? "nb-hamburger--open" : ""}`}
              onClick={() => setMenuOpen(p => !p)}
              aria-label="Menu"
            >
              <span /><span /><span />
            </button>
          </div>

        </div>
      </nav>

      {menuOpen && (
        <div className="nb-drawer-overlay" onClick={() => setMenuOpen(false)}>
          <div className="nb-drawer" onClick={e => e.stopPropagation()}>

            {user && (
              <div className="nb-drawer-user">
                <div className="nb-drawer-avatar">{initial}</div>
                <div>
                  <div className="nb-drawer-name">{user.name}</div>
                  <div className="nb-drawer-role">{
                    user.role === "kitchenOwner" ? "Kitchen Owner" :
                    user.role === "roomProvider" ? "Room Provider" : "Member"
                  }</div>
                </div>
              </div>
            )}

            <div className="nb-drawer-links">
              <Link to="/rooms"    className="nb-drawer-link">🏠 Rooms</Link>
              <Link to="/kitchens" className="nb-drawer-link">🍽 Kitchens</Link>

              {user && (
                <Link to="/chat" className="nb-drawer-link">
                  💬 Inbox
                  {unread > 0 && <span className="nb-badge nb-badge--dark">{unread}</span>}
                </Link>
              )}

              {roleLinks.map(l => (
                <Link key={l.to} to={l.to} className="nb-drawer-link">{l.label}</Link>
              ))}

              {user && (
                <button
                  className="nb-drawer-link"
                  style={{ background: "none", border: "none", textAlign: "left", width: "100%", cursor: "pointer" }}
                  onClick={() => { setMenuOpen(false); setShowEdit(true); }}
                >
                  ✏️ Edit Profile
                </button>
              )}
            </div>

            <div className="nb-drawer-footer">
              {!loading && (
                !user ? (
                  <>
                    <Link to="/login"    className="nb-drawer-btn nb-drawer-btn--outline">Sign in</Link>
                    <Link to="/register" className="nb-drawer-btn nb-drawer-btn--dark">Get started</Link>
                  </>
                ) : (
                  <button className="nb-drawer-btn nb-drawer-btn--outline" onClick={handleLogout}>
                    Sign out
                  </button>
                )
              )}
            </div>

          </div>
        </div>
      )}

      {showEdit && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEdit(false)}
          onUpdated={(updated) => {
            setUser(updated);
            localStorage.setItem("user", JSON.stringify(updated));
            setShowEdit(false);
          }}
        />
      )}
    </>
  );
}