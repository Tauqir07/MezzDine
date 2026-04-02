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
  wifi:            { icon: "📶", label: "WiFi"            },
  kitchen:         { icon: "🍳", label: "Kitchen"         },
  bathroom:        { icon: "🚿", label: "Bathroom"        },
  ac:              { icon: "❄️", label: "AC"               },
  parking:         { icon: "🅿️", label: "Parking"         },
  laundry:         { icon: "🧺", label: "Laundry"         },
  furnished:       { icon: "🛋️", label: "Furnished"       },
  geyser:          { icon: "🔥", label: "Geyser"          },
  tv:              { icon: "📺", label: "TV"              },
  "washing machine":{ icon: "🫧", label: "Washing Machine" },
};

const GENDER_CONFIG = {
  male:   { label: "Only Males",       icon: "👨", color: "#3b82f6", bg: "#eff6ff" },
  female: { label: "Only Females",     icon: "👩", color: "#ec4899", bg: "#fdf2f8" },
  family: { label: "Only Family",      icon: "👨‍👩‍👧‍👦", color: "#f59e0b", bg: "#fffbeb" },
  any:    { label: "Open to Everyone", icon: "🤝", color: "#16a34a", bg: "#f0fdf4" },
};

// ── Helper: parse amenities whether stored as array or JSON string ──
function parseAmenities(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // single string value
      return [raw];
    }
  }
  return [];
}

export default function RoomDetails() {

  const { roomId } = useParams();
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
  if (!roomId) return;
   setLoading(true);
  api.get(`/rooms/${roomId}`)
    .then(res => setRoom(res.data.data))
    .catch(console.error)
    .finally(() => setLoading(false));
}, [roomId]);
 

  useEffect(() => {
    if (!roomId) return;
    api.get(`/reviews/${roomId}`)
      .then(res => setReviews(res.data.data || []))
      .catch(console.error);
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    api.get(`/rooms/similar/${roomId}`)
      .then(res => setSimilar(res.data.data || []))
      .catch(console.error);
  }, [roomId]);

  async function submitReview() {
    try {
      await api.post(`/reviews/${roomId}`, { rating: Number(rating), comment });
      const res = await api.get(`/reviews/${roomId}`);
      setReviews(res.data.data || []);
      setComment("");
    } catch {
      alert("Failed to submit review");
    }
  }
  function getWhatsAppLink() {
  const phone = room?.ownerId?.phone;
  if (!phone) return null;

  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;

  const e164 = digits.length === 10 ? `91${digits}` : digits;

  const message = `Hi ${room?.title || "there"}!
I found your listing on MeZzDiNe https://mezzdineapp.vercel.app/.
I'm interested in this room. Please share more details.`;

  return `https://api.whatsapp.com/send?phone=${e164}&text=${encodeURIComponent(message)}`;
}

  async function contactOwner() {
    if (chatLoading || !room?.ownerId) return;
    setChatLoading(true);
    try {
      const receiverId = room.ownerId?._id
        ? String(room.ownerId._id)
        : String(room.ownerId);

      if (!receiverId) return;

      const res = await startConversation(receiverId);
      const convoId = res.data?._id;
      if (!convoId) { console.error("No conversation ID returned", res.data); return; }
      navigate(`/chat/${convoId}`);
    } catch {
      alert("Failed to start chat");
    } finally {
      setChatLoading(false);
    }
  }
  if (!roomId) {
  return <p>Invalid room ID</p>;
}

  if (loading) return <PageLoader />;
  if (!room)   return <p>Room not found</p>;

  const myId    = user?._id || user?.id;
  const ownerId = room.ownerId?._id || room.ownerId;
  const isOwner = myId && ownerId && String(myId) === String(ownerId);

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const gender   = GENDER_CONFIG[room.genderPreference?.toLowerCase()] || GENDER_CONFIG["any"];
  const amenities = parseAmenities(room.amenities); // ← FIX: always an array
  const whatsappLink = getWhatsAppLink();


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
            {amenities.length > 0 && (
              <>
                <div className="rd-section">
                  <h3 className="rd-section-title">What's included</h3>
                  <div className="rd-amenities">
                    {amenities.map((a, i) => {
                      const key  = a.toLowerCase().trim();
                      const info = AMENITY_ICONS[key] || { icon: "✓", label: a };
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
  <div className="rd-contact-row">

    {/* WhatsApp button */}
    {whatsappLink ? (
      <a
  href={whatsappLink}
  target="_blank"
  rel="noopener noreferrer"
  className="rd-whatsapp-btn"
>
  <svg className="rd-whatsapp-icon" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
  </svg>
  WhatsApp Owner
</a>
    ) : (
      <button disabled className="rd-whatsapp-btn rd-whatsapp-btn--disabled">
        WhatsApp not available
      </button>
    )}

    {/* Chat button */}
    <button
      className="rd-contact-btn"
      onClick={contactOwner}
      disabled={chatLoading || !room.isAvailable}
    >
      {chatLoading ? "Opening chat..." : "Chat"}
    </button>

  </div>
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