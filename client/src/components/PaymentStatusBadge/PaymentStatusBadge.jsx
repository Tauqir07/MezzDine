import { useState } from "react";
import api from "../../api/axios";
import "./PaymentStatusBadge.css";

/*
  Props:
  - userId
  - kitchenId
  - unpaidMonths   — number
  - paymentColor   — "green" | "yellow" | "red" | "deepred"
  - latestPayment  — last Payment object
  - onMarkedPaid   — callback after owner marks paid
*/
export default function PaymentStatusBadge({
  userId,
  kitchenId,
  unpaidMonths,
  paymentColor,
  latestPayment,
  onMarkedPaid,
}) {
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const colorMap = {
    green:   { bg: "#f0faf4", text: "#2d6a4f", border: "#b7dfc8", label: "Paid" },
    yellow:  { bg: "#fffbeb", text: "#92400e", border: "#fde68a", label: `${unpaidMonths} month${unpaidMonths > 1 ? "s" : ""} unpaid` },
    red:     { bg: "#fff1f1", text: "#b91c1c", border: "#fecaca", label: `${unpaidMonths} months unpaid` },
    deepred: { bg: "#4c0519", text: "#fecaca", border: "#9f1239", label: `${unpaidMonths} months unpaid` },
  };

  const c = colorMap[paymentColor] || colorMap.green;

  async function handleMarkPaid() {
    if (!latestPayment?._id) return;
    setLoading(true);
    setError("");
    try {
      await api.patch(`/payments/mark-paid/${latestPayment._id}`);
      onMarkedPaid?.();
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to mark as paid");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="psb-wrap">
      <button
        className="psb-badge"
        style={{ background: c.bg, color: c.text, borderColor: c.border }}
        onClick={() => setOpen(o => !o)}
      >
        <span className="psb-dot" style={{ background: c.text }} />
        {c.label}
        <span className="psb-arrow">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="psb-dropdown">
          {unpaidMonths === 0 ? (
            <p className="psb-ok">✅ All payments up to date</p>
          ) : (
            <>
              <p className="psb-unpaid-note">
                ⚠️ <strong>{unpaidMonths} month{unpaidMonths > 1 ? "s" : ""}</strong> with pending/unconfirmed payment
              </p>

              {latestPayment && (
                <div className="psb-latest">
                  <div className="psb-latest-row">
                    <span>Month</span>
                    <span>{latestPayment.month}</span>
                  </div>
                  <div className="psb-latest-row">
                    <span>Amount</span>
                    <span>₹{latestPayment.finalAmount}</span>
                  </div>
                  <div className="psb-latest-row">
                    <span>Status</span>
                    <span className={`psb-status psb-status--${latestPayment.status}`}>
                      {latestPayment.status === "submitted" ? "🔔 UTR submitted" :
                       latestPayment.status === "paid"      ? "✅ Paid" :
                                                              "⏳ Pending"}
                    </span>
                  </div>
                  {latestPayment.utrNumber && (
                    <div className="psb-latest-row">
                      <span>UTR</span>
                      <span className="psb-utr">{latestPayment.utrNumber}</span>
                    </div>
                  )}
                  {latestPayment.paymentNote && (
                    <div className="psb-latest-row">
                      <span>Note</span>
                      <span>{latestPayment.paymentNote}</span>
                    </div>
                  )}
                </div>
              )}

              {latestPayment?.status === "submitted" && (
                <>
                  {error && <p className="psb-error">{error}</p>}
                  <button
                    className="psb-confirm-btn"
                    onClick={handleMarkPaid}
                    disabled={loading}
                  >
                    {loading ? "Confirming…" : "✅ Confirm Payment Received"}
                  </button>
                </>
              )}

              {latestPayment?.status === "pending" && (
                <p className="psb-pending-note">
                  Customer has not submitted payment yet.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}