import { useEffect, useState } from "react";
import api from "../api/axios";
import "./Deliverytracker.css";

const STEPS = [
  { key: "preparing",        label: "Preparing",        icon: "👨‍🍳", desc: "Your food is being prepared" },
  { key: "out_for_delivery", label: "Out for Delivery",  icon: "🚴", desc: "Food is on the way to you" },
  { key: "delivered",        label: "Delivered",         icon: "✅", desc: "Food has arrived!" },
];

function stepIndex(status) {
  return STEPS.findIndex(s => s.key === status);
}

export default function DeliveryTracker({ kitchenId }) {
  const [delivery, setDelivery] = useState(null);
  const [loading,  setLoading]  = useState(true);

  async function fetchStatus() {
    try {
      const res = await api.get(`/delivery/status/${kitchenId}`);
      setDelivery(res.data.data);
    } catch {
      setDelivery(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!kitchenId) return;
    fetchStatus();
    // poll every 60 seconds for status updates
    const t = setInterval(fetchStatus, 60_000);
    return () => clearInterval(t);
  }, [kitchenId]);

  if (loading) return <div className="dt-loading">Loading delivery status…</div>;
  if (!delivery) return null;

  const currentIndex = stepIndex(delivery.status);

  function timeStr() {
    if (!delivery.updatedAt) return null;
    return new Date(delivery.updatedAt).toLocaleTimeString("en-IN", {
      hour: "2-digit", minute: "2-digit"
    });
  }

  return (
    <div className="dt-wrap">
      <div className="dt-header">
        <h3 className="dt-title">Today's Delivery</h3>
        {timeStr() && (
          <span className="dt-updated">Updated {timeStr()}</span>
        )}
      </div>

      {/* Step tracker */}
      <div className="dt-steps">
        {STEPS.map((step, i) => {
          const isDone   = i < currentIndex;
          const isActive = i === currentIndex;
          return (
            <div key={step.key} className="dt-step-wrap">
              <div className={`dt-step ${isDone ? "dt-step--done" : ""} ${isActive ? "dt-step--active" : ""}`}>
                <div className="dt-step-circle">
                  {isDone ? "✓" : step.icon}
                </div>
                <div className="dt-step-info">
                  <div className="dt-step-label">{step.label}</div>
                  {isActive && (
                    <div className="dt-step-desc">{step.desc}</div>
                  )}
                </div>
              </div>
              {/* connector line */}
              {i < STEPS.length - 1 && (
                <div className={`dt-connector ${i < currentIndex ? "dt-connector--done" : ""}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Owner note */}
      {delivery.note && (
        <div className="dt-note">
          📝 {delivery.note}
        </div>
      )}

      {/* Delivered celebration */}
      {delivery.status === "delivered" && (
        <div className="dt-delivered-msg">
          🎉 Enjoy your meal!
        </div>
      )}
    </div>
  );
}