import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import api from "../../api/axios";
import "./KitchenDetails.css";
import { startConversation } from "../../api/chat";
import PageLoader from "../../components/PageLoader";
import Kitchenmap from "../../map/Kitchenmap";
import PaymentModal from "../../components/paymentModal/PaymentModal";

export default function KitchenDetails() {

  const navigate = useNavigate();
  const { id }   = useParams();
  const { user } = useAuth();

  const [kitchen, setKitchen]             = useState(null);
  const [menu, setMenu]                   = useState({});
  const [similar, setSimilar]             = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [mealPlan,      setMealPlan]      = useState("one");
  const [preferredMeal, setPreferredMeal] = useState("dinner"); // for one-meal plan
  const [isSubscribed, setIsSubscribed]   = useState(false);
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

  /* ── CHECK SUBSCRIPTION ── */
  useEffect(() => {
    if (!user) return;
    api.get("/subscriptions/my")
      .then(res => {
        const data    = res.data.data;
        const matched = Array.isArray(data)
          ? data.some(item => {
              const kId = item.subscription?.kitchenId?._id || item.subscription?.kitchenId;
              return String(kId) === String(id);
            })
          : false;
        setIsSubscribed(matched);
      })
      .catch(() => setIsSubscribed(false));
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

  /* ── CONTACT OWNER ── */
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
  // Step 1: user clicks Subscribe → open payment modal immediately (no subscription yet)
  function openAdvanceModal(plan) {
    const priceMap = {
      one:   kitchen.oneMealPrice,
      two:   kitchen.twoMealPrice,
      three: kitchen.threeMealPrice,
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

  // Step 2: called by PaymentModal after UTR is submitted → NOW create subscription
  async function onAdvancePaid() {
    setShowPayment(false);
    setSubLoading(true);
    setErrorMsg("");
    try {
      await api.post(`/kitchens/${id}/subscribe`, {
        mealPlan:      advanceInfo?.plan      || mealPlan,
        preferredMeal: advanceInfo?.preferredMeal || null,
      });
      setIsSubscribed(true);
      setSubCount(p => p + 1);
    } catch (err) {
      if (err.response?.status === 409) {
        setIsSubscribed(true); // already subscribed, fine
      } else {
        setErrorMsg("Payment submitted but subscription failed. Please contact the kitchen.");
      }
    } finally {
      setSubLoading(false);
    }
  }

  /* ── UNSUBSCRIBE ── */
  // Step 1: show confirmation modal
  function confirmUnsubscribe() {
    // Find current subscription end date from subscriptions check
    setShowUnsubConfirm(true);
  }

  // Step 2: user confirmed — actually unsubscribe
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

  // ── Fetch subscription end date so unsubscribe modal can show it ──
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

  return (
    <div className="kd-page">

      {/* ── Advance Payment Modal ─────────────────────────────────────────── */}
      {/* ── Advance Payment Modal (shown BEFORE subscription is created) ── */}
      {showPayment && advanceInfo && (
        <PaymentModal
          kitchenId={id}
          kitchenName={advanceInfo.kitchenName}
          upiId={advanceInfo.upiId}
          amount={advanceInfo.amount}
          type="advance"
          month={advanceInfo.month}
          mealPlan={advanceInfo.plan}
          onClose={() => setShowPayment(false)}
          onPaid={onAdvancePaid}
        />
      )}

      {/* ── Unsubscribe Confirmation Modal ── */}
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
                  {isSubscribed && <div className="kd-subscribed-badge">✓ You are subscribed</div>}
                  {errorMsg     && <div className="kd-error-msg">{errorMsg}</div>}

                  <button className="kd-contact-btn" onClick={contactOwner}>
                    Contact Owner
                  </button>

                  {/* Meal plan selector — only before subscribing */}
                  {!isSubscribed && (
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

                      {/* Which meal — only shown for 1-meal plan */}
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
                    {!isSubscribed ? (
                      <button
                        className="kd-subscribe-btn"
                        onClick={() => openAdvanceModal(mealPlan)}
                        disabled={subLoading}
                      >
                        {subLoading ? "Subscribing…" : "Subscribe & Pay"}
                      </button>
                    ) : (
                      <>
                        {/* Re-open payment modal if they dismissed without paying */}
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
  const mealsPerDay = mealPlan === "three" ? 3 : mealPlan === "two" ? 2 : 1;
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
          <button className="unsub-cancel-btn" onClick={onCancel}>
            Keep Subscription
          </button>
          <button className="unsub-confirm-btn" onClick={onConfirm}>
            Yes, Unsubscribe
          </button>
        </div>

      </div>
    </div>
  );
}