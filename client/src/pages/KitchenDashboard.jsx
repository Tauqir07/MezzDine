import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import "./KitchenDashboard.css";
import SubscribersMap      from "../components/SubscribersMap/SubscribersMap";
import Deliverystatuspanel from "../map/Deliverystatuspanel";
import Pausepanel          from "../Notification/Pausepanel";
import VisitStats          from "../components/VisitStats/VisitStats";
import PaymentStatusBadge  from "../components/PaymentStatusBadge/PaymentStatusBadge";
import UpiSettings         from "../components/PaymentModals/UpiSettings";
import PageLoader from "../components/PageLoader";

const MEAL_SCHEDULE = [
  { meal: "breakfast", label: "Breakfast", icon: "🌅", start: 0,  end: 8  },
  { meal: "lunch",     label: "Lunch",     icon: "☀️",  start: 8,  end: 13 },
  { meal: "dinner",    label: "Dinner",    icon: "🌙", start: 13, end: 22 },
];

function getMealOfHour(hour) {
  for (const s of MEAL_SCHEDULE) {
    if (hour >= s.start && hour < s.end) return s.meal;
  }
  return "dinner";
}

function getDayName(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toLocaleDateString("en-IN", { weekday: "long" });
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric"
  });
}

function daysLeft(endDate) {
  if (!endDate) return null;
  const diff = new Date(endDate) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

const MEAL_PLAN_LABEL = {
  one:   "1 Meal / Day",
  two:   "2 Meals / Day",
  three: "3 Meals / Day"
};

// ── Reusable collapsible section ──
function CollapsibleSection({ title, badge, badgeColor, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="kdash-section">
      <button className="kdash-collapsible-header" onClick={() => setOpen(o => !o)}>
        <h2 className="kdash-section-title" style={{ margin: 0 }}>
          {title}
          {badge != null && badge > 0 && (
            <span className="kdash-collapsible-badge" style={{ background: badgeColor || "#6b7280" }}>
              {badge}
            </span>
          )}
        </h2>
        <span className="kdash-collapsible-arrow">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="kdash-collapsible-body">{children}</div>}
    </div>
  );
}

export default function KitchenDashboard() {

  const { kitchenId } = useParams();

  const [subscribers,    setSubscribers]    = useState([]);
  const [menu,           setMenu]           = useState(null);
  const [kitchen,        setKitchen]        = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [activeTab,      setActiveTab]      = useState("all");
  const [now,            setNow]            = useState(new Date());
  const [paymentData,    setPaymentData]    = useState([]);
  const [billGenLoading, setBillGenLoading] = useState(false);
  const [billGenMsg,     setBillGenMsg]     = useState("");
  const [unsubNotifs,    setUnsubNotifs]    = useState([]);

  const [pendingPayments,  setPendingPayments]  = useState([]);
  const [pendingLoading,   setPendingLoading]   = useState(false);
  const [approveLoadingId, setApproveLoadingId] = useState(null);
  const [rejectLoadingId,  setRejectLoadingId]  = useState(null);

  function getPaymentInfo(userId) {
    return paymentData.find(p => String(p.userId) === String(userId));
  }

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  async function fetchKitchen() {
    try {
      const res = await api.get(`/kitchens/${kitchenId}`);
      setKitchen(res.data.data || null);
    } catch (err) { console.error(err); }
  }

  useEffect(() => {
    async function load() {
      try {
        const [subRes, menuRes, kitchenRes] = await Promise.all([
          api.get(`/subscriptions/kitchen/${kitchenId}`),
          api.get(`/menu/${kitchenId}`),
          api.get(`/kitchens/${kitchenId}`),
        ]);
        setSubscribers(subRes.data.data  || []);
        setMenu(menuRes.data.data        || null);
        setKitchen(kitchenRes.data.data  || null);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [kitchenId]);

  useEffect(() => {
    api.get(`/payments/kitchen/${kitchenId}`)
      .then(res => setPaymentData(res.data.data || []))
      .catch(() => {});
  }, [kitchenId]);

  async function fetchPendingPayments() {
    setPendingLoading(true);
    try {
      const res = await api.get(`/payments/pending/${kitchenId}`);
      setPendingPayments(res.data.data || []);
    } catch { setPendingPayments([]); }
    finally { setPendingLoading(false); }
  }

  useEffect(() => { fetchPendingPayments(); }, [kitchenId]);

  async function approvePayment(paymentId) {
    setApproveLoadingId(paymentId);
    try {
      await api.patch(`/payments/mark-paid/${paymentId}`);
      await fetchPendingPayments();
      refetchPayments();
      const subRes = await api.get(`/subscriptions/kitchen/${kitchenId}`);
      setSubscribers(subRes.data.data || []);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to approve payment");
    } finally { setApproveLoadingId(null); }
  }

  async function rejectPayment(paymentId) {
    setRejectLoadingId(paymentId);
    try {
      await api.patch(`/payments/reject/${paymentId}`);
      await fetchPendingPayments();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject payment");
    } finally { setRejectLoadingId(null); }
  }

  async function generateBills() {
    setBillGenLoading(true); setBillGenMsg("");
    try {
      const res = await api.post(`/payments/generate/${kitchenId}`);
      setBillGenMsg(`✅ Bills generated for ${res.data.generated ?? "all"} subscribers`);
    } catch (err) {
      setBillGenMsg("❌ " + (err.response?.data?.message || "Failed to generate bills"));
    } finally { setBillGenLoading(false); }
  }

  useEffect(() => {
    api.get(`/notifications/my`)
      .then(res => {
        const all = res.data.data?.notifications || [];
        setUnsubNotifs(
          all.filter(n => n.type === "unsubscription" &&
            String(n.kitchenId?._id || n.kitchenId) === String(kitchenId))
        );
      })
      .catch(() => {});
  }, [kitchenId]);

  function refetchPayments() {
    api.get(`/payments/kitchen/${kitchenId}`)
      .then(res => setPaymentData(res.data.data || []));
  }

  const currentHour  = now.getHours();
  const currentMeal  = getMealOfHour(currentHour);
  const todayName    = getDayName(0);
  const tomorrowName = getDayName(1);
  const todayDays    = menu?.weeks?.[0]?.days || [];
  const todayData    = todayDays.find(d => d.day === todayName);
  const tomorrowData = todayDays.find(d => d.day === tomorrowName);
  const pausedList   = subscribers.filter(s => s.isPaused);
  const activeList   = subscribers.filter(s => !s.isPaused);
  const displayList  = activeTab === "paused" ? pausedList : activeTab === "active" ? activeList : subscribers;
  const unreadUnsubs = unsubNotifs.filter(n => !n.isRead).length;

  if (loading) return <PageLoader />;

  return (
    <div className="kdash-page">

      {/* ── Header ── */}
      <div className="kdash-header">
        <div>
          <h1 className="kdash-title">Kitchen Dashboard</h1>
          <p className="kdash-clock">
            {now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            &nbsp;·&nbsp;
            {now.toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long" })}
          </p>
        </div>
        <div className="kdash-stats">
          <div className="kdash-stat">
            <span className="kdash-stat-num">{subscribers.length}</span>
            <span className="kdash-stat-label">Total</span>
          </div>
          <div className="kdash-stat kdash-stat--ok">
            <span className="kdash-stat-num">{activeList.length}</span>
            <span className="kdash-stat-label">Active</span>
          </div>
          <div className="kdash-stat kdash-stat--warn">
            <span className="kdash-stat-num">{pausedList.length}</span>
            <span className="kdash-stat-label">Paused</span>
          </div>
          {pendingPayments.length > 0 && (
            <div className="kdash-stat kdash-stat--pending">
              <span className="kdash-stat-num">{pendingPayments.length}</span>
              <span className="kdash-stat-label">Pending</span>
            </div>
          )}
        </div>
      </div>

      {/* ── ⏳ Pending Approvals — always visible ── */}
      {(pendingPayments.length > 0 || pendingLoading) && (
        <div className="kdash-section kdash-pending-section">
          <h2 className="kdash-section-title">
            ⏳ Pending Approvals
            {pendingPayments.length > 0 && (
              <span className="kdash-pending-count">{pendingPayments.length}</span>
            )}
          </h2>
          {pendingLoading ? <p className="kdash-empty">Loading...</p> : (
            <div className="kdash-pending-list">
              {pendingPayments.map(payment => (
                <div key={payment._id} className="kdash-pending-card">
                  <div className="kdash-pending-top">
                    <div className="kdash-avatar">{payment.userId?.name?.[0]?.toUpperCase() || "?"}</div>
                    <div className="kdash-pending-info">
                      <div className="kdash-pending-name">{payment.userId?.name || "Unknown"}</div>
                      <div className="kdash-pending-contact">
                        {payment.userId?.phone && <span>📞 {payment.userId.phone}</span>}
                        {payment.userId?.email && <span>✉️ {payment.userId.email}</span>}
                      </div>
                    </div>
                    <div className={`kdash-pending-status ${payment.status === "submitted" ? "kdash-pending-status--submitted" : "kdash-pending-status--waiting"}`}>
                      {payment.status === "submitted" ? "UTR Submitted" : "Awaiting UTR"}
                    </div>
                  </div>
                  <div className="kdash-pending-details">
                    <div className="kdash-pending-detail"><span>Plan</span><strong>{MEAL_PLAN_LABEL[payment.mealPlan] || payment.mealPlan || "—"}</strong></div>
                    <div className="kdash-pending-detail"><span>Amount</span><strong>₹{payment.finalAmount || payment.totalAmount || 0}</strong></div>
                    <div className="kdash-pending-detail"><span>Month</span><strong>{payment.month || "—"}</strong></div>
                    {payment.utrNumber && <div className="kdash-pending-detail"><span>UTR</span><strong className="kdash-pending-utr">{payment.utrNumber}</strong></div>}
                    {payment.paymentNote && <div className="kdash-pending-detail kdash-pending-detail--full"><span>Note</span><strong>{payment.paymentNote}</strong></div>}
                    <div className="kdash-pending-detail"><span>Submitted</span><strong>{formatDate(payment.updatedAt || payment.createdAt)}</strong></div>
                  </div>
                  {payment.status === "submitted" && (
                    <div className="kdash-pending-actions">
                      <button className="kdash-approve-btn" onClick={() => approvePayment(payment._id)} disabled={approveLoadingId === payment._id}>
                        {approveLoadingId === payment._id ? "Approving…" : "✅ Approve"}
                      </button>
                      <button className="kdash-reject-btn" onClick={() => rejectPayment(payment._id)} disabled={rejectLoadingId === payment._id}>
                        {rejectLoadingId === payment._id ? "Rejecting…" : "❌ Reject"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Delivery Status Panel ── */}
      <div className="kdash-section">
        <h2 className="kdash-section-title">📦 Today's Delivery</h2>
        <Deliverystatuspanel kitchenId={kitchenId} />
      </div>

      {/* ── ⏸ Pause Kitchen — collapsible ── */}
      <CollapsibleSection title="⏸ Pause Kitchen Service">
        <Pausepanel kitchenId={kitchenId} isOwner={true} />
      </CollapsibleSection>

      {/* ── Subscribers Map ── */}
      <div className="kdash-section">
        <h2 className="kdash-section-title">📍 Subscriber Locations</h2>
        <SubscribersMap
          kitchenId={kitchenId}
          kitchenLat={kitchen?.location?.lat}
          kitchenLng={kitchen?.location?.lng}
          kitchenName={kitchen?.kitchenName}
        />
      </div>

      {/* ── Today's Menu ── */}
      <div className="kdash-section">
        <h2 className="kdash-section-title">Today's Menu — {todayName}</h2>
        <div className="kdash-timeline">
          {MEAL_SCHEDULE.map(({ meal, label, icon, start, end }) => {
            const isActive = currentMeal === meal;
            const mealData = todayData?.[meal];
            return (
              <div key={meal} className={`kdash-slot ${isActive ? "kdash-slot--active" : ""}`}>
                <div className="kdash-slot-time">
                  {icon}&nbsp;
                  {start === 0 ? "12 AM" : start > 12 ? `${start - 12} PM` : `${start} AM`}
                  {" – "}
                  {end > 12 ? `${end - 12} PM` : `${end} AM`}
                </div>
                <div className="kdash-slot-label">{label}</div>
                {mealData?.image?.url && <img src={mealData.image.url} className="kdash-slot-img" alt={label} />}
                <div className="kdash-slot-name">{mealData?.name || <span className="kdash-slot-empty">Not set</span>}</div>
                {isActive && <div className="kdash-slot-badge">Serving Now</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Tomorrow's Menu ── */}
      {tomorrowData && (
        <div className="kdash-section">
          <h2 className="kdash-section-title">Tomorrow — {tomorrowName}</h2>
          <div className="kdash-timeline kdash-timeline--muted">
            {MEAL_SCHEDULE.map(({ meal, label, icon }) => {
              const mealData = tomorrowData?.[meal];
              return (
                <div key={meal} className="kdash-slot">
                  <div className="kdash-slot-label">{icon} {label}</div>
                  {mealData?.image?.url && <img src={mealData.image.url} className="kdash-slot-img" alt={label} />}
                  <div className="kdash-slot-name">{mealData?.name || <span className="kdash-slot-empty">Not set</span>}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Subscribers List ── */}
      <div className="kdash-section">
        <div className="kdash-section-head">
          <h2 className="kdash-section-title">Subscribers</h2>
          <div className="kdash-tabs">
            {["all", "active", "paused"].map(tab => (
              <button key={tab} className={`kdash-tab ${activeTab === tab ? "kdash-tab--active" : ""}`} onClick={() => setActiveTab(tab)}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {displayList.length === 0 ? (
          <p className="kdash-empty">No subscribers in this category.</p>
        ) : (
          <div className="kdash-grid">
            {displayList.map(sub => {
              const left   = daysLeft(sub.endDate);
              const urgent = left !== null && left <= 5;
              const info   = getPaymentInfo(sub.userId?._id);
              return (
                <div key={sub._id} className={`kdash-card ${sub.isPaused ? "kdash-card--paused" : ""}`}>
                  <div className="kdash-card-top">
                    <div className="kdash-avatar">{sub.userId?.name?.[0]?.toUpperCase() || "?"}</div>
                    <div>
                      <div className="kdash-card-name">{sub.userId?.name || "Unknown"}</div>
                      <div className="kdash-card-phone">{sub.userId?.phone || sub.userId?.email || "—"}</div>
                    </div>
                    <div className={`kdash-badge ${sub.isPaused ? "kdash-badge--paused" : "kdash-badge--active"}`}>
                      {sub.isPaused ? "⏸ Paused" : "✓ Active"}
                    </div>
                  </div>
                  <div className="kdash-card-row">
                    <div className="kdash-card-cell"><span className="kdash-cell-label">Started</span><span className="kdash-cell-val">{formatDate(sub.startDate)}</span></div>
                    <div className="kdash-card-cell"><span className="kdash-cell-label">Ends</span><span className={`kdash-cell-val ${urgent ? "kdash-cell-urgent" : ""}`}>{formatDate(sub.endDate)}</span></div>
                    <div className="kdash-card-cell"><span className="kdash-cell-label">Days Left</span><span className={`kdash-cell-val ${urgent ? "kdash-cell-urgent" : ""}`}>{left !== null ? `${left}d` : "—"}</span></div>
                  </div>
                  <div className="kdash-card-row">
                    <div className="kdash-card-cell"><span className="kdash-cell-label">Meal Plan</span><span className="kdash-cell-val">{MEAL_PLAN_LABEL[sub.mealPlan] || sub.mealPlan || "—"}</span></div>
                    {sub.isPaused && sub.pausedAt && (
                      <div className="kdash-card-cell"><span className="kdash-cell-label">Paused On</span><span className="kdash-cell-val kdash-cell-urgent">{formatDate(sub.pausedAt)}</span></div>
                    )}
                  </div>
                  {left !== null && (
                    <div className="kdash-bar-wrap">
                      <div className="kdash-bar-fill" style={{ width: `${Math.min(100, (left / 30) * 100)}%`, background: urgent ? "#ef4444" : "#22c55e" }} />
                    </div>
                  )}
                  {sub.userId?._id && <Pausepanel kitchenId={kitchenId} userId={sub.userId._id} userName={sub.userId?.name} />}
                  {info && <PaymentStatusBadge userId={sub.userId._id} kitchenId={kitchenId} unpaidMonths={info.unpaidMonths} paymentColor={info.paymentColor} latestPayment={info.latestPayment} onMarkedPaid={refetchPayments} />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 👋 Recent Unsubscriptions — collapsible ── */}
      {unsubNotifs.length > 0 && (
        <CollapsibleSection title="👋 Recent Unsubscriptions" badge={unreadUnsubs} badgeColor="#ef4444">
          <div className="kdash-unsub-list">
            {unsubNotifs.map(n => (
              <div key={n._id} className={`kdash-unsub-card ${n.isRead ? "" : "kdash-unsub-card--unread"}`}>
                <div className="kdash-unsub-top">
                  <div className="kdash-unsub-avatar">{n.meta?.subscriberName?.[0]?.toUpperCase() || "?"}</div>
                  <div className="kdash-unsub-info">
                    <div className="kdash-unsub-name">{n.meta?.subscriberName || "Subscriber"}</div>
                    <div className="kdash-unsub-time">
                      {new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  {!n.isRead && <span className="kdash-unsub-new">New</span>}
                </div>
                <div className="kdash-unsub-stats">
                  <div className="kdash-unsub-stat"><span>Plan</span><strong>{n.meta?.mealPlan ? `${n.meta.mealPlan} meal` : "—"}</strong></div>
                  <div className="kdash-unsub-stat"><span>Days left</span><strong>{n.meta?.daysLeft ?? "—"}d</strong></div>
                  <div className="kdash-unsub-stat"><span>Meals missed</span><strong>{n.meta?.mealsLeft ?? "—"}</strong></div>
                  <div className="kdash-unsub-stat kdash-unsub-stat--refund"><span>Est. refund</span><strong>₹{n.meta?.refundEst ?? 0}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* ── 💳 Payment Settings ── */}
      <div className="kdash-section">
        <h2 className="kdash-section-title">💳 Payment Settings</h2>
        <UpiSettings kitchenId={kitchenId} currentUpi={kitchen?.upiId || ""} onSaved={() => fetchKitchen()} />
        <div className="kdash-bill-gen">
          <p className="kdash-bill-gen-desc">Generate bills for all subscribers for the current month. The cron job does this automatically on the 1st — use this to trigger manually.</p>
          <button className="kdash-generate-btn" onClick={generateBills} disabled={billGenLoading}>
            {billGenLoading ? "Generating…" : "🧾 Generate Monthly Bills"}
          </button>
          {billGenMsg && <p className="kdash-bill-msg">{billGenMsg}</p>}
        </div>
      </div>

      {/* ── Visitor Stats ── */}
      <div className="kdash-section">
        <h2 className="kdash-section-title">👁 Visitor Stats</h2>
        <VisitStats entityType="kitchen" entityId={kitchenId} ownerId={kitchen?.ownerId} />
      </div>

    </div>
  );
}