import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Kitchenmap from "../map/Kitchenmap";
import Deliverytracker from "../map/Deliverytracker";
import PageLoader from "../components/PageLoader";
import Pausepanel from "../Notification/Pausepanel";
import PaymentModal from "../components/PaymentModals/PaymentModal";
import "./UserDashboard.css";

const MEAL_PLAN_LABEL = {
  one:   "1 Meal / day",
  two:   "2 Meals / day",
  three: "3 Meals / day",
};

export default function UserDashboard() {

  const navigate = useNavigate();

  const [subscriptions,  setSubscriptions]  = useState([]);
  const [activeIndex,    setActiveIndex]    = useState(0);
  const [loading,        setLoading]        = useState(true);
  const [actionLoading,  setActionLoading]  = useState(false);
  const [showPausePanel, setShowPausePanel] = useState(false);
  const [customerCoords, setCustomerCoords] = useState(null);

  // ── Payment state ──────────────────────────────────────────────────────────
  const [bill,           setBill]           = useState(null);
  const [billLoading,    setBillLoading]    = useState(false);
  const [showPayment,    setShowPayment]    = useState(false);
  const [earlyPay,       setEarlyPay]       = useState(false);

  useEffect(() => {
    fetchData();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setCustomerCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCustomerCoords(null)
      );
    }
  }, []);

  async function fetchData() {
    try {
      const res  = await api.get("/subscriptions/my");
      const data = res.data.data;
      if (!data || !data.length) { setSubscriptions([]); setLoading(false); return; }
      const enriched = await Promise.all(
        data.map(async (item) => {
          if (item.menu) return item;
          try {
            const menuRes = await api.get(`/menu/${item.subscription.kitchenId._id}`);
            return { ...item, menu: menuRes.data.data };
          } catch { return item; }
        })
      );
      setSubscriptions(enriched);
    } catch {
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  }

  // ── Fetch bill whenever active kitchen changes ─────────────────────────────
  useEffect(() => {
    if (!subscriptions.length) return;
    const kitchenId = subscriptions[activeIndex]?.subscription?.kitchenId?._id;
    if (!kitchenId) return;
    fetchBill(kitchenId, false);
  }, [activeIndex, subscriptions.length]);

  async function fetchBill(kitchenId, early = false) {
    setBillLoading(true);
    try {
      const res = await api.get(`/payments/bill/${kitchenId}${early ? "?early=true" : ""}`);
      setBill(res.data.data);
    } catch {
      setBill(null);
    } finally {
      setBillLoading(false);
    }
  }

  async function resumeSubscription() {
    try {
      setActionLoading(true);
      await api.patch("/subscriptions/resume", {
        kitchenId: sub?.kitchenId?._id,
      });
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to resume");
    } finally {
      setActionLoading(false);
    }
  }

  function handlePayNow(early = false) {
    setEarlyPay(early);
    if (early) {
      fetchBill(kitchen?._id, true).then(() => setShowPayment(true));
    } else {
      setShowPayment(true);
    }
  }

  if (loading) return <PageLoader />;

  if (!subscriptions.length) return (
    <div className="ud-empty">
      <div className="ud-empty-icon">🍽</div>
      <h2>No active subscriptions</h2>
      <p>Find a kitchen near you and subscribe to start getting meals.</p>
      <button className="ud-empty-btn" onClick={() => navigate("/kitchens")}>
        Browse Kitchens
      </button>
    </div>
  );

  const current  = subscriptions[activeIndex];
  const sub      = current.subscription;
  const menu     = current.menu;
  const kitchen  = sub.kitchenId;

  const start    = new Date(sub.startDate);
  const end      = new Date(sub.endDate);
  const today    = new Date();
  const daysLeft = Math.max(Math.ceil((end - today) / (1000 * 60 * 60 * 24)), 0);
  const progress = Math.min(100, Math.round(((today - start) / (end - start)) * 100));

  const todayName  = today.toLocaleDateString("en-US", { weekday: "long" });
  const todayMeals = menu?.weeks?.[0]?.days?.find(d => d.day === todayName);

  const status = sub.isPaused ? "paused" : daysLeft > 0 ? "active" : "expired";
  const STATUS_LABEL = { active: "Active", paused: "Paused", expired: "Expired" };

  // ── Bill status helpers ────────────────────────────────────────────────────
  const billStatusColor = {
    paid:          { bg: "#f0faf4", text: "#2d6a4f", border: "#b7dfc8", label: "✅ Paid" },
    submitted:     { bg: "#fdf0e6", text: "#c2692a", border: "#f0d5be", label: "🔔 Awaiting confirmation" },
    pending:       { bg: "#fffbeb", text: "#92400e", border: "#fde68a", label: "⏳ Payment due" },
    not_generated: { bg: "#f7f3ee", text: "#8a7f74", border: "#e8e0d5", label: "📋 Bill not generated yet" },
  };
  const billStatus = billStatusColor[bill?.status] || billStatusColor.not_generated;

  return (
    <div className="ud-page">

      {/* ── Payment Modal ── */}
      {showPayment && bill && (
        <PaymentModal
          kitchenId={kitchen?._id}
          kitchenName={kitchen?.kitchenName}
          upiId={bill.upiId}
          amount={earlyPay ? bill.finalAmount : bill.finalAmount}
          paymentId={bill.paymentId}
          type="monthly"
          month={bill.month}
          billBreakdown={{
            monthlyPrice:   bill.monthlyPrice,
            pausedMeals:    bill.pausedMeals,
            pauseDeduction: bill.pauseDeduction,
          }}
          onClose={() => setShowPayment(false)}
          onPaid={() => {
            setShowPayment(false);
            fetchBill(kitchen?._id, false);
          }}
        />
      )}

      {/* ── Page header ── */}
      <div className="ud-page-header">
        <h1 className="ud-page-title">My Subscriptions</h1>
        <button className="ud-browse-btn" onClick={() => navigate("/kitchens")}>
          + Browse Kitchens
        </button>
      </div>

      {/* ── Tab switcher ── */}
      {subscriptions.length > 1 && (
        <div className="ud-tabs">
          {subscriptions.map((item, i) => (
            <button
              key={i}
              className={`ud-tab ${activeIndex === i ? "active" : ""}`}
              onClick={() => setActiveIndex(i)}
            >
              {item.subscription.kitchenId?.kitchenName || `Kitchen ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* ── Main grid ── */}
      <div className="ud-grid">

        {/* ── LEFT COLUMN ── */}
        <div className="ud-left">

          {/* Kitchen hero card */}
          <div
            className="ud-kitchen-card"
            onClick={() => navigate(`/kitchens/${kitchen?._id}`)}
            title="View kitchen page"
          >
            {kitchen?.images?.[0]?.url && (
              <img src={kitchen.images[0].url} className="ud-kitchen-img" alt={kitchen?.kitchenName} />
            )}
            <div className="ud-kitchen-overlay">
              <h2 className="ud-kitchen-name">{kitchen?.kitchenName}</h2>
              <p className="ud-kitchen-address">📍 {kitchen?.address}</p>
              <span className="ud-kitchen-link">View Kitchen →</span>
            </div>
          </div>

          {/* Status + plan row */}
          <div className="ud-info-row">
            <div className="ud-info-pill">
              <span className="ud-info-label">Status</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className={`ud-status-dot ud-status-dot--${status}`} />
                <strong className={`ud-status-text ud-status-text--${status}`}>
                  {STATUS_LABEL[status]}
                </strong>
              </div>
            </div>
            <div className="ud-info-pill">
              <span className="ud-info-label">Plan</span>
              <strong>{MEAL_PLAN_LABEL[sub.mealPlan] || sub.mealPlan}</strong>
            </div>
            <div className="ud-info-pill">
              <span className="ud-info-label">Days Left</span>
              <strong className={daysLeft <= 5 ? "ud-urgent" : ""}>{daysLeft}d</strong>
            </div>
          </div>

          {/* Progress bar */}
          <div className="ud-progress-wrap">
            <div className="ud-progress-labels">
              <span>{start.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
              <span className="ud-progress-pct">{progress}% elapsed</span>
              <span>{end.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
            </div>
            <div className="ud-progress-bar">
              <div
                className="ud-progress-fill"
                style={{ width: `${progress}%`, background: daysLeft <= 5 ? "#ef4444" : "#16a34a" }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="ud-actions">
            {!sub.isPaused ? (
              <button
                className="ud-btn ud-btn--pause"
                onClick={() => setShowPausePanel(true)}
                disabled={status === "expired"}
              >
                ⏸ Pause Meals
              </button>
            ) : (
              <button
                className="ud-btn ud-btn--resume"
                onClick={resumeSubscription}
                disabled={actionLoading}
              >
                {actionLoading ? "..." : "▶ Resume Meals"}
              </button>
            )}
            <button
              className="ud-btn ud-btn--secondary"
              onClick={() => navigate(`/kitchens/${kitchen?._id}#subscribe`)}
            >
              🔄 Renew
            </button>
          </div>

          {/* ── Pause Panel Drawer ── */}
          {showPausePanel && (
            <div className="ud-pause-overlay" onClick={() => setShowPausePanel(false)}>
              <div className="ud-pause-drawer" onClick={e => e.stopPropagation()}>
                <div className="ud-pause-drawer-header">
                  <h3>⏸ Pause Meals</h3>
                  <button className="ud-pause-drawer-close" onClick={() => setShowPausePanel(false)}>✕</button>
                </div>
                <div style={{ padding: "0 4px 20px" }}>
                  <Pausepanel kitchenId={kitchen?._id} />
                </div>
              </div>
            </div>
          )}

          {/* ── 💳 Monthly Bill Card ───────────────────────────────────────── */}
          <div className="ud-section">
            <h3 className="ud-section-title">💳 Monthly Bill</h3>

            {billLoading ? (
              <div className="ud-bill-loading">Calculating your bill…</div>
            ) : bill ? (
              <div className="ud-bill-card">

                {/* Status badge */}
                <div
                  className="ud-bill-status"
                  style={{ background: billStatus.bg, color: billStatus.text, borderColor: billStatus.border }}
                >
                  {billStatus.label}
                </div>

                {/* Bill breakdown */}
                <div className="ud-bill-breakdown">
                  <div className="ud-bill-row">
                    <span>Month</span>
                    <span>{new Date(bill.month + "-01").toLocaleString("default", { month: "long", year: "numeric" })}</span>
                  </div>
                  <div className="ud-bill-row">
                    <span>Monthly price</span>
                    <span>₹{bill.monthlyPrice}</span>
                  </div>
                  {bill.pausedMeals > 0 && (
                    <div className="ud-bill-row ud-bill-row--deduct">
                      <span>Paused meals ({bill.pausedMeals} meals)</span>
                      <span>− ₹{bill.pauseDeduction}</span>
                    </div>
                  )}
                  <div className="ud-bill-divider" />
                  <div className="ud-bill-row ud-bill-row--total">
                    <span>Total due</span>
                    <span>₹{bill.finalAmount}</span>
                  </div>
                </div>

                {/* Pay buttons — only show when not already paid */}
                {bill.status !== "paid" && (
                  <div className="ud-bill-actions">
                    {bill.status === "submitted" ? (
                      <p className="ud-bill-submitted-note">
                        🔔 Payment submitted — waiting for kitchen to confirm.
                      </p>
                    ) : (
                      <>
                        <button
                          className="ud-bill-pay-btn"
                          onClick={() => handlePayNow(false)}
                          disabled={!bill.paymentId && bill.status === "not_generated"}
                        >
                          💳 Pay ₹{bill.finalAmount} for {new Date(bill.month + "-01").toLocaleString("default", { month: "long" })}
                        </button>
                        <button
                          className="ud-bill-pay-btn ud-bill-pay-btn--early"
                          onClick={() => handlePayNow(true)}
                          disabled={!bill.paymentId && bill.status === "not_generated"}
                        >
                          ⚡ Pay now for meals so far
                        </button>
                      </>
                    )}
                  </div>
                )}

                {bill.status === "not_generated" && (
                  <p className="ud-bill-not-generated">
                    Your bill for this month hasn't been generated yet. The kitchen owner will generate it at the start of the month.
                  </p>
                )}

              </div>
            ) : (
              <p className="ud-empty-text">Could not load bill.</p>
            )}
          </div>

          {/* Delivery tracker */}
          <div className="ud-section">
            <h3 className="ud-section-title">📦 Delivery Status</h3>
            <Deliverytracker kitchenId={kitchen?._id} />
          </div>

        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="ud-right">

          {/* Today's meals */}
          <div className="ud-section">
            <h3 className="ud-section-title">🍽 Today's Meals — {todayName}</h3>

            {sub.isPaused ? (
              <div className="ud-paused-notice">
                ⏸ Subscription is paused — no meals today
              </div>
            ) : todayMeals ? (
              <div className="ud-meals-row">
                {[
                  { key: "breakfast", label: "Breakfast", icon: "🌅",
                    show: sub.mealPlan === "three" || sub.mealPlan === "two" },
                  { key: "lunch",     label: "Lunch",     icon: "☀️",  show: true },
                  { key: "dinner",    label: "Dinner",    icon: "🌙",
                    show: sub.mealPlan === "three" },
                ].filter(m => m.show && todayMeals[m.key]).map(m => (
                  <div key={m.key} className="ud-meal-card">
                    {todayMeals[m.key]?.image?.url
                      ? <img src={todayMeals[m.key].image.url} className="ud-meal-img" alt="" />
                      : <div className="ud-meal-placeholder">{m.icon}</div>
                    }
                    <div className="ud-meal-info">
                      <span className="ud-meal-label">{m.icon} {m.label}</span>
                      <span className="ud-meal-name">{todayMeals[m.key]?.name || "—"}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="ud-empty-text">No menu set for today.</p>
            )}
          </div>

          {/* Map */}
          <div className="ud-section">
            <h3 className="ud-section-title">📍 Location</h3>
            <Kitchenmap
              kitchenLat={kitchen?.location?.lat}
              kitchenLng={kitchen?.location?.lng}
              kitchenName={kitchen?.kitchenName}
              customerLat={customerCoords?.lat}
              customerLng={customerCoords?.lng}
              height={320}
            />
          </div>

        </div>
      </div>
    </div>
  );
}