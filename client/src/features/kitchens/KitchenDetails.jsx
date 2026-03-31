import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import api from "../../api/axios";
import "./KitchenDetails.css";
import { startConversation } from "../../api/chat";
import PageLoader from "../../components/PageLoader";
import Kitchenmap from "../../map/Kitchenmap";
import PaymentModal from "../../components/PaymentModals/PaymentModal";

const MEZZDINE_URL = "https://mezzdine.com"; // ← replace with actual URL when ready

export default function KitchenDetails() {

  const navigate = useNavigate();
  const { id }   = useParams();
  const { user } = useAuth();

  const [kitchen, setKitchen]             = useState(null);
  const [menu, setMenu]                   = useState({});
  const [similar, setSimilar]             = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [mealPlan,      setMealPlan]      = useState("one");
  const [preferredMeal, setPreferredMeal] = useState("dinner");
  const [isSubscribed, setIsSubscribed]   = useState(false);
  const [isPending,     setIsPending]     = useState(false);
  const [errorMsg, setErrorMsg]           = useState("");
  const [dayIndex, setDayIndex]           = useState(0);
  const [subCount, setSubCount]           = useState(0);

  const [reviews, setReviews]     = useState([]);
  const [average, setAverage]     = useState(0);
  const [rating, setRating]       = useState(0);
  const [comment, setComment]     = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // ── Payment state ──────────────────────────────────────────────────────────
  const [showPayment,   setShowPayment]   = useState(false);
  const [advanceInfo,   setAdvanceInfo]   = useState(null);
  const [subLoading,    setSubLoading]    = useState(false);

  // ── Unsubscribe confirm state ──────────────────────────────────────────────
  const [showUnsubConfirm, setShowUnsubConfirm] = useState(false);
  const [subEndDate,       setSubEndDate]       = useState(null);

  const days = menu?.weeks?.[0]?.days || [];

  const ownerId = kitchen?.ownerId?._id ?? kitchen?.ownerId;
  const myId    = user?._id ?? user?.id;
  const isOwner = !!(myId && ownerId && String(myId) === String(ownerId));
  const myReview = reviews.find(r => r.user?._id === (user?._id ?? user?.id));

  // ── WhatsApp link builder ─────────────────────────────────────────────────
  function getWhatsAppLink() {
    const phone = kitchen?.ownerId?.phone;
    if (!phone) return null;

    // Normalize to E.164 — strip non-digits, prepend India code if 10 digits
    const digits = phone.replace(/\D/g, "");
    const e164   = digits.length === 10 ? `91${digits}` : digits;

   // ✅ Fixed
const message = `Hi ${kitchen.kitchenName}! I found you on MeZzDiNe https://mezzdineapp.vercel.app/. I'd like to know more.`;
    return `https://wa.me/${e164}?text=${encodeURIComponent(message)}`;
  }

  /* ── FETCH KITCHEN ── */
  useEffect(() => {
    api.get(`/kitchens/${id}`)
      .then(res => {
        const k = res.data.data;
        setKitchen(k);
        setSubCount(k?.currentSubscribers || 0);
      })
      .catch(console.error);
  }, [id]);

  /* ── FETCH MENU ── */
  useEffect(() => {
    api.get(`/menu/${id}`)
      .then(res => setMenu(res.data.data || {}))
      .catch(() => setMenu({}));
  }, [id]);

  /* ── FETCH REVIEWS ── */
  async function fetchReviews() {
    try {
      const res = await api.get(`/kitchen-reviews/${id}`);
      setReviews(res.data.data.reviews || []);
      setAverage(res.data.data.averageRating || 0);
    } catch {
      setReviews([]);
    }
  }
  useEffect(() => { fetchReviews(); }, [id]);

  /* ── CHECK SUBSCRIPTION + PENDING PAYMENT ── */
  useEffect(() => {
    if (!user) return;

    api.get("/subscriptions/my")
      .then(res => {
        const data = res.data.data;
        const matched = Array.isArray(data)
          ? data.some(item => {
              const kId = item.subscription?.kitchenId?._id || item.subscription?.kitchenId;
              return String(kId) === String(id);
            })
          : false;
        setIsSubscribed(matched);
      })
      .catch(() => setIsSubscribed(false));

    api.get(`/payments/my/${id}`)
      .then(res => {
        const payments = res.data.data || [];
        const pendingAdvance = payments.find(
          p => p.type === "advance" && p.status === "submitted"
        );
        setIsPending(!!pendingAdvance);
      })
      .catch(() => setIsPending(false));

  }, [id, user]);

  /* ── FETCH SIMILAR ── */
  useEffect(() => {
    api.get(`/kitchens/similar/${id}`)
      .then(res => setSimilar(res.data.data || []))
      .catch(() => setSimilar([]));
  }, [id]);

  /* ── AUTO SLIDER ── */
  useEffect(() => {
    if (days.length === 0) return;
    const t = setInterval(() => setDayIndex(p => (p + 1) % days.length), 3000);
    return () => clearInterval(t);
  }, [days.length]);

  /* ── CONTACT OWNER (in-app chat) ── */
  async function contactOwner() {
    try {
      if (!kitchen?.ownerId) return;
      if (isOwner) { navigate("/chat"); return; }

      const receiverId = kitchen.ownerId?._id
        ? String(kitchen.ownerId._id)
        : String(kitchen.ownerId);

      if (!receiverId) return;

      const res     = await startConversation(receiverId);
      const convoId = res.data?._id;
      if (!convoId) { console.error("No conversation ID returned", res.data); return; }

      navigate(`/chat/${convoId}`);
    } catch (err) {
      console.error("contactOwner error:", err);
    }
  }

  /* ── SUBSCRIBE ── */
  function openAdvanceModal(plan) {
    const priceMap = {
      one:       kitchen.oneMealPrice,
      two:       kitchen.twoMealPrice,
      three:     kitchen.threeMealPrice,
      breakfast: kitchen.breakfastPrice,
      lunch:     kitchen.lunchPrice,
      dinner:    kitchen.dinnerPrice,
    };
    setAdvanceInfo({
      kitchenName:   kitchen.kitchenName,
      upiId:         kitchen.upiId || null,
      amount:        priceMap[plan] || 0,
      month:         new Date().toISOString().slice(0, 7),
      plan,
      preferredMeal: plan === "one" ? preferredMeal : null,
    });
    setShowPayment(true);
  }

  async function onAdvancePaid() {
    setShowPayment(false);
    setIsPending(true);
  }

  /* ── UNSUBSCRIBE ── */
  function confirmUnsubscribe() {
    setShowUnsubConfirm(true);
  }

  async function unsubscribe() {
    setErrorMsg("");
    setShowUnsubConfirm(false);
    try {
      await api.delete(`/kitchens/${id}/unsubscribe`);
      setIsSubscribed(false);
      setSubCount(p => Math.max(0, p - 1));
    } catch {
      setErrorMsg("Unable to unsubscribe. Try again.");
    }
  }

  /* ── REVIEWS ── */
  async function submitReview() {
    if (rating < 1 || rating > 5) { alert("Please select a rating"); return; }
    try {
      if (isEditing) {
        await api.put(`/kitchen-reviews/${id}`, { rating, comment });
        setIsEditing(false);
      } else {
        await api.post(`/kitchen-reviews/${id}`, { rating, comment });
      }
      setRating(0);
      setComment("");
      await fetchReviews();
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong");
    }
  }

  function startEdit() {
    setRating(myReview.rating);
    setComment(myReview.comment || "");
    setIsEditing(true);
  }

  function cancelEdit() {
    setRating(0);
    setComment("");
    setIsEditing(false);
  }

  /* ── FETCH SUBSCRIPTION END DATE ── */
  useEffect(() => {
    if (!user || !isSubscribed) return;
    api.get("/subscriptions/my")
      .then(res => {
        const data = res.data.data;
        if (!Array.isArray(data)) return;
        const matched = data.find(item => {
          const kId = item.subscription?.kitchenId?._id || item.subscription?.kitchenId;
          return String(kId) === String(id);
        });
        if (matched) setSubEndDate(matched.subscription?.endDate || null);
      })
      .catch(() => {});
  }, [id, user, isSubscribed]);

  if (!kitchen) return <PageLoader />;

  const whatsappLink = getWhatsAppLink();

  return (
    <div className="kd-page">

      {showPayment && advanceInfo && (
        <PaymentModal
          kitchenId={id}
          kitchenName={advanceInfo.kitchenName}
          upiId={advanceInfo.upiId}
          amount={advanceInfo.amount}
          type="advance"
          month={advanceInfo.month}
          mealPlan={advanceInfo.plan}
          preferredMeal={advanceInfo.preferredMeal}
          onClose={() => setShowPayment(false)}
          onPaid={onAdvancePaid}
        />
      )}

      {showUnsubConfirm && (
        <UnsubscribeModal
          kitchen={kitchen}
          mealPlan={mealPlan}
          onConfirm={unsubscribe}
          onCancel={() => setShowUnsubConfirm(false)}
        />
      )}

      {/* ── Owner banner ── */}
      {isOwner && (
        <div className="kd-owner-banner">
          <div className="kd-owner-banner-left">
            <span className="kd-owner-banner-icon">🍽</span>
            <div>
              <div className="kd-owner-banner-title">This is your kitchen</div>
              <div className="kd-owner-banner-sub">Here's how it looks to subscribers</div>
            </div>
          </div>
          <div className="kd-owner-banner-actions">
            <button className="kd-owner-btn-secondary" onClick={() => navigate("/kitchens/my")}>
              My Kitchens
            </button>
            <button className="kd-owner-btn-secondary" onClick={() => navigate(`/kitchens/menu/${id}`)}>
              📋 Manage Menu
            </button>
            <button className="kd-owner-btn-primary" onClick={() => navigate(`/kitchens/dashboard/${id}`)}>
              📊 Dashboard
            </button>
          </div>
        </div>
      )}

      <div className="kd-container">

        {/* ── Header ── */}
        <div className="kd-header">
          <h1 className="kd-title">{kitchen.kitchenName}</h1>
          <p className="kd-address">📍 {kitchen.address}</p>
          <div className="kd-meta">
            {average > 0 && (
              <span className="kd-meta-item">
                ⭐ <strong>{average.toFixed(1)}</strong>
                <span className="kd-meta-light"> · {reviews.length} review{reviews.length !== 1 ? "s" : ""}</span>
              </span>
            )}
            <span className="kd-meta-item">
              👥 <strong>{subCount}</strong>
              <span className="kd-meta-light"> subscribers</span>
            </span>
          </div>
        </div>

        {/* ── Gallery ── */}
        {kitchen.images?.length > 0 && (
          <div className="kd-gallery">
            <img src={kitchen.images[selectedImage]?.url} className="kd-main-img" alt="" />
            <div className="kd-thumbs">
              {kitchen.images.map((img, i) => (
                <img
                  key={i}
                  src={img.url}
                  alt=""
                  className={`kd-thumb ${selectedImage === i ? "active" : ""}`}
                  onClick={() => setSelectedImage(i)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Body grid ── */}
        <div className="kd-body-grid">

          {/* ── Left col ── */}
          <div className="kd-left">

            <div className="kd-section">
              <h3 className="kd-section-title">Weekly Menu</h3>
              {days.length > 0 ? (
                <>
                  <div className="kd-slider-nav">
                    {days.map((day, i) => (
                      <button
                        key={i}
                        className={`kd-day-dot ${dayIndex === i ? "active" : ""}`}
                        onClick={() => setDayIndex(i)}
                      >
                        {day.day?.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                  <div className="kd-day-slider">
                    <div
                      className="kd-day-track"
                      style={{
                        width: `${days.length * 100}%`,
                        transform: `translateX(-${dayIndex * (100 / days.length)}%)`,
                      }}
                    >
                      {days.map((day, i) => (
                        <div key={i} className="kd-day-card" style={{ width: `${100 / days.length}%` }}>
                          <h4 className="kd-day-title">{day.day}</h4>
                          <div className="kd-day-meals">
                            {["breakfast", "lunch", "dinner"].map(meal => (
                              <div key={meal} className="kd-day-meal-slot">
                                <span className="kd-day-meal-label">{meal}</span>
                                {day[meal]?.image?.url
                                  ? <img src={day[meal].image.url} alt="" />
                                  : <div className="kd-day-meal-empty">🍽</div>
                                }
                                {day[meal]?.name && (
                                  <span className="kd-day-meal-name">{day[meal].name}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <p className="kd-empty-text">No weekly menu available yet.</p>
              )}
            </div>

            <hr className="kd-divider" />

            <div className="kd-section">
              <h3 className="kd-section-title">📍 Location</h3>
              <Kitchenmap
                kitchenLat={kitchen.location?.lat}
                kitchenLng={kitchen.location?.lng}
                kitchenName={kitchen.kitchenName}
                height={400}
              />
            </div>

            <hr className="kd-divider" />

            <div className="kd-section">
              <h3 className="kd-section-title">
                Reviews
                {average > 0 && <span className="kd-section-avg">⭐ {average.toFixed(1)}</span>}
              </h3>
              {reviews.length === 0 && <p className="kd-empty-text">No reviews yet. Be the first!</p>}
              <div className="kd-review-list">
                {reviews.map(r => (
                  <div key={r._id} className="kd-review-card">
                    <div className="kd-review-top">
                      <div className="kd-review-avatar">{(r.user?.name || "U")[0]}</div>
                      <div>
                        <div className="kd-review-name">{r.user?.name || "User"}</div>
                        <div className="kd-review-stars">
                          {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                        </div>
                      </div>
                    </div>
                    <p className="kd-review-comment">{r.comment}</p>
                    {user && r.user?._id === (user._id ?? user.id) && !isEditing && (
                      <button className="kd-review-edit-btn" onClick={startEdit}>Edit</button>
                    )}
                  </div>
                ))}
              </div>
              {user && !isOwner && (!myReview || isEditing) && (
                <div className="kd-review-form">
                  {isEditing && <p className="kd-review-editing">Editing your review</p>}
                  <div className="kd-star-picker">
                    {[1,2,3,4,5].map(star => (
                      <span
                        key={star}
                        className={`kd-star ${star <= rating ? "kd-star--on" : ""}`}
                        onClick={() => setRating(star)}
                      >★</span>
                    ))}
                  </div>
                  <textarea
                    className="kd-review-input"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Write your review..."
                  />
                  <div className="kd-review-form-actions">
                    <button className="kd-review-submit" onClick={submitReview}>
                      {isEditing ? "Update Review" : "Submit Review"}
                    </button>
                    {isEditing &&
                      <button className="kd-review-cancel" onClick={cancelEdit}>Cancel</button>
                    }
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* ── Right col — booking card ── */}
          <div className="kd-right">
            <div className="kd-booking-card">

              <div className="kd-pricing-title">Meal Plans</div>
              <div className="kd-pricing-list">
                {kitchen.oneMealPrice && (
                  <div className="kd-price-row">
                    <span>🌅 1 Meal / day</span>
                    <strong>₹{kitchen.oneMealPrice}<span className="kd-price-unit">/mo</span></strong>
                  </div>
                )}
                {kitchen.twoMealPrice && (
                  <div className="kd-price-row">
                    <span>☀️ 2 Meals / day</span>
                    <strong>₹{kitchen.twoMealPrice}<span className="kd-price-unit">/mo</span></strong>
                  </div>
                )}
                {kitchen.threeMealPrice && (
                  <div className="kd-price-row">
                    <span>🍽 3 Meals / day</span>
                    <strong>₹{kitchen.threeMealPrice}<span className="kd-price-unit">/mo</span></strong>
                  </div>
                )}
              </div>

              <div className="kd-sub-count">👥 {subCount} active subscribers</div>
              <hr className="kd-divider" />

              {user && isOwner ? (

                <div className="kd-owner-actions">
                  <button className="kd-owner-action-btn" onClick={() => navigate(`/kitchens/dashboard/${id}`)}>
                    📊 View Dashboard
                  </button>
                  <button className="kd-owner-action-btn kd-owner-action-btn--secondary" onClick={() => navigate(`/kitchens/menu/${id}`)}>
                    📋 Manage Menu
                  </button>
                  <button className="kd-owner-action-btn kd-owner-action-btn--secondary" onClick={() => navigate(`/kitchens/edit/${id}`)}>
                    ✏️ Edit Kitchen
                  </button>
                </div>

              ) : user ? (

                <>
                  {/* ── Subscription status indicators ── */}
                  {isSubscribed && (
                    <div className="kd-subscribed-badge">✓ You are subscribed</div>
                  )}

                  {!isSubscribed && isPending && (
                    <div className="kd-pending-badge">
                      ⏳ Payment submitted — awaiting owner approval
                    </div>
                  )}

                  {errorMsg && <div className="kd-error-msg">{errorMsg}</div>}

                  {/* ── Contact row: WhatsApp (primary) + Chat (secondary) ── */}
                  <div className="kd-contact-row">
                    {whatsappLink && (
                      <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="kd-whatsapp-btn"
                      >
                        <svg className="kd-whatsapp-icon" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        WhatsApp Owner
                      </a>
                    )}
                    <button className="kd-chat-btn" onClick={contactOwner}>
                      💬 Chat
                    </button>
                  </div>

                  {/* Meal plan selector — only before subscribing and not pending */}
                  {!isSubscribed && !isPending && (
                    <>
                      <select
                        value={mealPlan}
                        onChange={e => setMealPlan(e.target.value)}
                        className="kd-meal-select"
                      >
                        {kitchen.oneMealPrice > 0 &&
                          <option value="one">1 Meal — ₹{kitchen.oneMealPrice}/mo</option>
                        }
                        {kitchen.twoMealPrice > 0 &&
                          <option value="two">2 Meals (lunch + dinner) — ₹{kitchen.twoMealPrice}/mo</option>
                        }
                        {kitchen.threeMealPrice > 0 &&
                          <option value="three">3 Meals (all day) — ₹{kitchen.threeMealPrice}/mo</option>
                        }
                      </select>

                      {mealPlan === "one" && (
                        <div className="kd-preferred-meal">
                          <p className="kd-preferred-label">Which meal do you want?</p>
                          <div className="kd-meal-btns">
                            {["breakfast", "lunch", "dinner"].map(m => (
                              <button
                                key={m}
                                type="button"
                                className={`kd-meal-btn ${preferredMeal === m ? "kd-meal-btn--active" : ""}`}
                                onClick={() => setPreferredMeal(m)}
                              >
                                {m === "breakfast" ? "🌅" : m === "lunch" ? "☀️" : "🌙"}
                                {" "}{m.charAt(0).toUpperCase() + m.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div id="subscribe">
                    {isSubscribed ? (
                      <>
                        <button
                          className="kd-pay-btn"
                          onClick={() => openAdvanceModal(mealPlan)}
                        >
                          💳 Pay Advance
                        </button>
                        <button
                          className="kd-unsubscribe-btn"
                          onClick={confirmUnsubscribe}
                        >
                          Unsubscribe
                        </button>
                      </>
                    ) : isPending ? (
                      <p className="kd-pending-note">
                        Your payment is under review. You'll be subscribed once the owner approves it.
                      </p>
                    ) : (
                      <button
                        className="kd-subscribe-btn"
                        onClick={() => openAdvanceModal(mealPlan)}
                        disabled={subLoading}
                      >
                        {subLoading ? "Subscribing…" : "Subscribe & Pay"}
                      </button>
                    )}
                  </div>
                </>

              ) : null}

            </div>
          </div>

        </div>

        {/* ── Similar kitchens ── */}
        {similar.length > 0 && (
          <div className="kd-section kd-similar-section">
            <h3 className="kd-section-title">More kitchens nearby</h3>
            <div className="kd-similar-grid">
              {similar.map(k => (
                <div key={k._id} className="kd-similar-card" onClick={() => navigate(`/kitchens/${k._id}`)}>
                  {k.images?.[0]?.url && (
                    <img src={k.images[0].url} className="kd-similar-img" alt="" />
                  )}
                  <div className="kd-similar-body">
                    <div className="kd-similar-name">{k.kitchenName}</div>
                    <div className="kd-similar-address">{k.address}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Unsubscribe Confirmation Modal ────────────────────────────────────────
function UnsubscribeModal({ kitchen, mealPlan, onConfirm, onCancel }) {
  const priceMap = {
    one:   kitchen.oneMealPrice,
    two:   kitchen.twoMealPrice,
    three: kitchen.threeMealPrice,
  };
  const mealsPerDay  = mealPlan === "three" ? 3 : mealPlan === "two" ? 2 : 1;
  const monthlyPrice = priceMap[mealPlan] || 0;

  const today       = new Date();
  const endOfMonth  = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const daysLeft    = Math.max(0, Math.ceil((endOfMonth - today) / (1000 * 60 * 60 * 24)));
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const dailyRate   = monthlyPrice / daysInMonth;
  const refundEst   = Math.round(dailyRate * daysLeft);

  return (
    <div className="unsub-overlay">
      <div className="unsub-modal">
        <div className="unsub-icon">⚠️</div>
        <h3 className="unsub-title">Unsubscribe from {kitchen.kitchenName}?</h3>
        <div className="unsub-info-box">
          <div className="unsub-info-row">
            <span>Days left this month</span>
            <strong>{daysLeft} days</strong>
          </div>
          <div className="unsub-info-row">
            <span>Meals you'll miss</span>
            <strong>{daysLeft * mealsPerDay} meals</strong>
          </div>
          <div className="unsub-divider" />
          <div className="unsub-info-row">
            <span>Estimated unused amount</span>
            <strong className="unsub-amount">≈ ₹{refundEst}</strong>
          </div>
        </div>
        <p className="unsub-note">
          ℹ️ Refunds are at the kitchen owner's discretion. Contact the owner directly to discuss a refund for the unused days.
        </p>
        <div className="unsub-actions">
          <button className="unsub-cancel-btn" onClick={onCancel}>Keep Subscription</button>
          <button className="unsub-confirm-btn" onClick={onConfirm}>Yes, Unsubscribe</button>
        </div>
      </div>
    </div>
  );
}