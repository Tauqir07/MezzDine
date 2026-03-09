import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import RoomGallery from "./RoomGallery";
import "./RoomDetails.css";
import { startConversation } from "../../api/chat";
import PageLoader from "../../components/PageLoader";
import { useAuth } from "../../context/authContext";
import Kitchenmap from "../../map/Kitchenmap";

const AMENITY_ICONS = {
  wifi:      { icon: "📶", label: "WiFi"      },
  kitchen:   { icon: "🍳", label: "Kitchen"   },
  bathroom:  { icon: "🚿", label: "Bathroom"  },
  ac:        { icon: "❄️", label: "AC"         },
  parking:   { icon: "🅿️", label: "Parking"   },
  laundry:   { icon: "🧺", label: "Laundry"   },
  furnished: { icon: "🛋️", label: "Furnished" },
  geyser:    { icon: "🔥", label: "Geyser"    },
};

const GENDER_CONFIG = {
  male:   { label: "Only Males",       icon: "👨", color: "#3b82f6", bg: "#eff6ff" },
  female: { label: "Only Females",     icon: "👩", color: "#ec4899", bg: "#fdf2f8" },
  family: { label: "Only Family",      icon: "👨‍👩‍👧‍👦", color: "#f59e0b", bg: "#fffbeb" },
  any:    { label: "Open to Everyone", icon: "🤝", color: "#16a34a", bg: "#f0fdf4" },
};

export default function RoomDetails() {

  const { id }       = useParams();
  const navigate     = useNavigate();
  const { user }     = useAuth();

  const [room, setRoom]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [reviews, setReviews]         = useState([]);
  const [comment, setComment]         = useState("");
  const [rating, setRating]           = useState(5);
  const [similar, setSimilar]         = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/rooms/${id}`)
      .then(res => setRoom(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    api.get(`/reviews/${id}`)
      .then(res => setReviews(res.data.data || []))
      .catch(console.error);
  }, [id]);

  useEffect(() => {
    api.get(`/rooms/similar/${id}`)
      .then(res => setSimilar(res.data.data || []))
      .catch(console.error);
  }, [id]);

  async function submitReview() {
    try {
      await api.post(`/reviews/${id}`, { rating: Number(rating), comment });
      const res = await api.get(`/reviews/${id}`);
      setReviews(res.data.data || []);
      setComment("");
    } catch {
      alert("Failed to submit review");
    }
  }

  async function contactOwner() {
  if (chatLoading || !room?.ownerId) return;
  setChatLoading(true);
  try {
    const receiverId = room.ownerId?._id
      ? String(room.ownerId._id)
      : String(room.ownerId);

    if (!receiverId) return;  // ← guard against empty string

    const res = await startConversation(receiverId);

    const convoId = res.data?._id;
    if (!convoId) {
      console.error("No conversation ID returned", res.data);
      return;
    }

    navigate(`/chat/${convoId}`);
  } catch {
    alert("Failed to start chat");
  } finally {
    setChatLoading(false);
  }
}

  if (loading) return <PageLoader />;
  if (!room)   return <p>Room not found</p>;

  const myId    = user?._id || user?.id;
  const ownerId = room.ownerId?._id || room.ownerId;
  const isOwner = myId && ownerId && String(myId) === String(ownerId);

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const gender = GENDER_CONFIG[room.genderPreference?.toLowerCase()] || GENDER_CONFIG["any"]

  return (
    <div className="rd-page">

      {/* ── Owner banner ── */}
      {isOwner && (
        <div className="rd-owner-banner">
          <div className="rd-owner-banner-left">
            <span className="rd-owner-banner-icon">🏠</span>
            <div>
              <div className="rd-owner-banner-title">This is your listing</div>
              <div className="rd-owner-banner-sub">Here's how it looks to renters</div>
            </div>
          </div>
          <div className="rd-owner-banner-actions">
            <button className="rd-owner-btn-secondary" onClick={() => navigate("/rooms/my")}>
              My Listings
            </button>
            <button className="rd-owner-btn-primary" onClick={() => navigate(`/rooms/edit/${room._id}`)}>
              ✏️ Edit listing
            </button>
          </div>
        </div>
      )}

      <div className="rd-container">

        {/* ── Header ── */}
        <div className="rd-header">
          <div className="rd-header-tags">
            {room.listingType === "roommate" && (
              <span className="rd-tag rd-tag--roommate">🤝 Roommate Needed</span>
            )}
            {room.propertyType && (
              <span className="rd-tag rd-tag--type">{room.propertyType}</span>
            )}
            <span
              className="rd-tag rd-tag--gender"
              style={{ background: gender.bg, color: gender.color, borderColor: gender.color + "44" }}
            >
              {gender.icon} {gender.label}
            </span>
            {!room.isAvailable && (
              <span className="rd-tag rd-tag--unavailable">Not Available</span>
            )}
          </div>

          <h1 className="rd-title">{room.title}</h1>

          <div className="rd-meta">
            {avgRating && (
              <span className="rd-meta-item">
                ⭐ <strong>{avgRating}</strong>
                <span className="rd-meta-light">· {reviews.length} review{reviews.length !== 1 ? "s" : ""}</span>
              </span>
            )}
            <span className="rd-meta-item">📍 {room.location?.address || room.address || "India"}</span>
            {room.hostLanguage && (
              <span className="rd-meta-item">🗣 {room.hostLanguage}</span>
            )}
          </div>
        </div>

        {/* ── Gallery ── */}
        <RoomGallery images={room.images} />

        {/* ── Body grid ── */}
        <div className="rd-grid">

          {/* ── Left col ── */}
          <div className="rd-left">

            {/* Host row */}
            <div className="rd-host-row">
              <div>
                <h2 className="rd-hosted-by">
                  {room.listingType === "roommate"
                    ? `Posted by ${room.ownerId?.name || "User"}`
                    : `Hosted by ${room.ownerId?.name || "Owner"}`}
                </h2>
                <p className="rd-hosted-sub">
                  {room.listingType === "roommate" ? "Looking for roommate" : "Monthly rental"}
                </p>
              </div>
              <div className="rd-host-avatar">
                {(room.ownerId?.name || "O")[0].toUpperCase()}
              </div>
            </div>

            <hr className="rd-divider" />

            {/* Quick facts */}
            <div className="rd-facts">
              {room.bedrooms > 0 && (
                <div className="rd-fact">
                  <span className="rd-fact-icon">🛏</span>
                  <span className="rd-fact-val">{room.bedrooms}</span>
                  <span className="rd-fact-label">Bedroom{room.bedrooms > 1 ? "s" : ""}</span>
                </div>
              )}
              {room.bathrooms > 0 && (
                <div className="rd-fact">
                  <span className="rd-fact-icon">🚿</span>
                  <span className="rd-fact-val">{room.bathrooms}</span>
                  <span className="rd-fact-label">Bathroom{room.bathrooms > 1 ? "s" : ""}</span>
                </div>
              )}
              {room.beds > 0 && (
                <div className="rd-fact">
                  <span className="rd-fact-icon">🛋</span>
                  <span className="rd-fact-val">{room.beds}</span>
                  <span className="rd-fact-label">Bed{room.beds > 1 ? "s" : ""}</span>
                </div>
              )}
              <div className="rd-fact">
                <span className="rd-fact-icon">📅</span>
                <span className="rd-fact-val rd-fact-val--sm">Monthly</span>
                <span className="rd-fact-label">Rental</span>
              </div>
            </div>

            <hr className="rd-divider" />

            {/* Description */}
            {room.description && (
              <>
                <div className="rd-section">
                  <h3 className="rd-section-title">About this place</h3>
                  <p className="rd-description">{room.description}</p>
                </div>
                <hr className="rd-divider" />
              </>
            )}

            {/* Amenities */}
            {room.amenities?.length > 0 && (
              <>
                <div className="rd-section">
                  <h3 className="rd-section-title">What's included</h3>
                  <div className="rd-amenities">
                    {room.amenities.map((a, i) => {
                      const info = AMENITY_ICONS[a] || { icon: "✓", label: a };
                      return (
                        <div key={i} className="rd-amenity">
                          <span className="rd-amenity-icon">{info.icon}</span>
                          <span>{info.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <hr className="rd-divider" />
              </>
            )}

            {/* ── Location Map ── */}
            <div className="rd-section">
              <h3 className="rd-section-title">📍 Location</h3>
              <Kitchenmap
                kitchenLat={room.location?.lat}
                kitchenLng={room.location?.lng}
                kitchenName={room.title}
                 label="Room location"
                height={400}
              />
            </div>

            <hr className="rd-divider" />

            {/* Reviews */}
            <div className="rd-section">
              <h3 className="rd-section-title">
                Reviews
                {avgRating && (
                  <span className="rd-section-rating">⭐ {avgRating}</span>
                )}
              </h3>

              {reviews.length === 0 && (
                <p className="rd-no-reviews">No reviews yet. Be the first!</p>
              )}

              <div className="rd-reviews">
                {reviews.map(r => (
                  <div key={r._id} className="rd-review-card">
                    <div className="rd-review-top">
                      <div className="rd-review-avatar">
                        {(r.userId?.name || "U")[0]}
                      </div>
                      <div>
                        <div className="rd-review-name">{r.userId?.name || "User"}</div>
                        <div className="rd-review-stars">
                          {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                        </div>
                      </div>
                    </div>
                    <p className="rd-review-comment">{r.comment}</p>
                  </div>
                ))}
              </div>

              {!isOwner && user && (
                <div className="rd-review-form">
                  <h4 className="rd-review-form-title">Leave a review</h4>
                  <div className="rd-star-picker">
                    {[1,2,3,4,5].map(n => (
                      <span
                        key={n}
                        className={`rd-star ${n <= rating ? "rd-star--on" : ""}`}
                        onClick={() => setRating(n)}
                      >★</span>
                    ))}
                  </div>
                  <textarea
                    className="rd-review-input"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Share your experience..."
                  />
                  <button className="rd-review-btn" onClick={submitReview}>
                    Post review
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* ── Right col — booking card ── */}
          <div className="rd-right">
            <div className="rd-booking-card">

              <div className="rd-price-row">
                <span className="rd-price">₹{room.price?.toLocaleString("en-IN")}</span>
                <span className="rd-price-unit">/month</span>
              </div>

              {avgRating && (
                <div className="rd-card-rating">
                  ⭐ {avgRating} · {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                </div>
              )}

              <hr className="rd-divider" />

              <div
                className="rd-card-gender"
                style={{ background: gender.bg, color: gender.color }}
              >
                {gender.icon} {gender.label}
              </div>

              <div className="rd-card-detail">
                <span>📅 Minimum stay</span>
                <strong>6 months-4 years</strong>
              </div>
              {room.propertyType && (
                <div className="rd-card-detail">
                  <span>🏠 Property</span>
                  <strong>{room.propertyType}</strong>
                </div>
              )}
              {room.isAvailable ? (
                <div className="rd-card-detail rd-card-detail--available">
                  <span>✅ Available now</span>
                </div>
              ) : (
                <div className="rd-card-detail rd-card-detail--unavailable">
                  <span>❌ Not available</span>
                </div>
              )}

              {!isOwner && (
                <button
                  className="rd-contact-btn"
                  onClick={contactOwner}
                  disabled={chatLoading || !room.isAvailable}
                >
                  {chatLoading ? "Opening chat..." : "Contact Owner"}
                </button>
              )}

              <p className="rd-card-note">
                Monthly rental only — no weekend stays
              </p>

            </div>
          </div>

        </div>

        {/* ── Similar rooms ── */}
        {similar.length > 0 && (
          <div className="rd-similar">
            <h3 className="rd-similar-title">More places to explore</h3>
            <div className="rd-similar-grid">
              {similar.map(s => (
                <Link key={s._id} to={`/rooms/${s._id}`} className="rd-similar-card">
                  <div className="rd-similar-img-wrap">
                    <img src={s.images?.[0]?.url} className="rd-similar-img" alt="" />
                    {s.genderPreference && s.genderPreference !== "any" && (
                      <span
                        className="rd-similar-gender"
                        style={{
                          background: GENDER_CONFIG[s.genderPreference]?.bg,
                          color:      GENDER_CONFIG[s.genderPreference]?.color,
                        }}
                      >
                        {GENDER_CONFIG[s.genderPreference]?.icon}
                      </span>
                    )}
                  </div>
                  <div className="rd-similar-body">
                    <div className="rd-similar-name">{s.title}</div>
                    <div className="rd-similar-price">₹{s.price?.toLocaleString("en-IN")}/month</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}