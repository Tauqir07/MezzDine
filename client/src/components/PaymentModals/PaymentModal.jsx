import { useState, useEffect, useRef } from "react";
import api from "../../api/axios";
import "./PaymentModal.css";

export default function PaymentModal({
  kitchenId,
  kitchenName,
  upiId,
  amount,
  paymentId: initialPaymentId,
  type = "monthly",
  month,
  mealPlan,
  preferredMeal, 
  billBreakdown,
  onClose,
  onPaid,
}) {
  const [step,      setStep]      = useState("summary"); // "summary" | "qr" | "utr" | "done"
  const [utr,       setUtr]       = useState("");
  const [note,      setNote]      = useState("");
  const [paymentId, setPaymentId] = useState(initialPaymentId || null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [qrUrl,     setQrUrl]     = useState("");
  const canvasRef = useRef();

  // ── Generate QR when step = "qr" — dynamic import avoids Node.js/browser mismatch ──
  useEffect(() => {
    if (step !== "qr" || !upiId) return;
    setQrUrl(""); // reset while generating

    const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(kitchenName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`${type === "advance" ? "Advance" : "Monthly"} payment - ${month}`)}`;

    import("qrcode")
      .then(({ default: QRCode }) => {
        QRCode.toDataURL(upiLink, {
          width: 220,
          margin: 2,
          color: { dark: "#1c1a17", light: "#fdf0e6" },
        })
          .then(url => setQrUrl(url))
          .catch(err => console.error("QR generation error:", err));
      })
      .catch(() => console.error("qrcode package not found"));
  }, [step, upiId, amount]);

  // ── Create advance payment record (sends mealPlan so sub isn't required yet) ──
  async function ensurePaymentRecord() {
    if (paymentId) return paymentId;
    setLoading(true);
    try {
      const res = await api.post(`/payments/advance/${kitchenId}`, { mealPlan, preferredMeal }); 
      const id  = res.data.data._id;
      setPaymentId(id);
      return id;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to initialize payment. Please try again.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function handleProceedToQR() {
    const id = await ensurePaymentRecord();
    if (id) setStep("qr");
  }

  async function handleSubmitUTR() {
    if (!utr.trim()) { setError("Please enter your UTR / transaction ID"); return; }

    // payment record
    const id = await ensurePaymentRecord();
    if (!id) return;

    setLoading(true);
    setError("");
    try {
      await api.patch(`/payments/pay/${id}`, { utrNumber: utr, paymentNote: note });
      setStep("done");
      onPaid?.();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const displayMonth = month
    ? new Date(month + "-01").toLocaleString("default", { month: "long", year: "numeric" })
    : "";

  return (
    <div className="pm-overlay" onClick={onClose}>
      <div className="pm-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="pm-header">
          <div className="pm-header-left">
            <span className="pm-icon">💳</span>
            <div>
              <div className="pm-title">
                {type === "advance" ? "Advance Payment" : `Monthly Bill — ${displayMonth}`}
              </div>
              <div className="pm-subtitle">{kitchenName}</div>
            </div>
          </div>
          <button className="pm-close" onClick={onClose}>✕</button>
        </div>

        {/* ── STEP: Summary ── */}
        {step === "summary" && (
          <div className="pm-body">

            {type === "monthly" && billBreakdown && (
              <div className="pm-breakdown">
                <div className="pm-breakdown-row">
                  <span>Monthly price</span>
                  <span>₹{billBreakdown.monthlyPrice}</span>
                </div>
                {billBreakdown.pausedMeals > 0 && (
                  <div className="pm-breakdown-row pm-breakdown-row--deduct">
                    <span>Paused meals ({billBreakdown.pausedMeals} meals)</span>
                    <span>− ₹{billBreakdown.pauseDeduction}</span>
                  </div>
                )}
                <div className="pm-breakdown-divider" />
                <div className="pm-breakdown-row pm-breakdown-row--total">
                  <span>Total due</span>
                  <span>₹{amount}</span>
                </div>
              </div>
            )}

            {type === "advance" && (
              <div className="pm-breakdown">
                <div className="pm-breakdown-row pm-breakdown-row--total">
                  <span>Advance (1 month)</span>
                  <span>₹{amount}</span>
                </div>
                <p className="pm-note">
                  This advance will be adjusted against your first month's bill.
                </p>
              </div>
            )}

            {upiId ? (
              <div className="pm-upi-info">
                <span className="pm-upi-label">Pay to UPI</span>
                <span className="pm-upi-id">{upiId}</span>
              </div>
            ) : (
              <div className="pm-no-upi">
                ⚠️ Kitchen owner has not set up UPI. Please pay in cash and inform the owner.
              </div>
            )}

            {error && <div className="pm-error">{error}</div>}

            <div className="pm-actions">
              {upiId && (
                <button
                  className="pm-btn pm-btn--primary"
                  onClick={handleProceedToQR}
                  disabled={loading}
                >
                  {loading ? "Loading…" : "📱 Scan QR & Pay"}
                </button>
              )}
              <button
                className="pm-btn pm-btn--secondary"
                onClick={() => setStep("utr")}
              >
                I've already paid — enter UTR
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: QR Code ── */}
        {step === "qr" && (
          <div className="pm-body pm-body--center">
            <p className="pm-qr-label">Scan with any UPI app</p>
            {qrUrl
              ? <img src={qrUrl} alt="UPI QR" className="pm-qr-img" />
              : <div className="pm-qr-loading">Generating QR…</div>
            }
            <div className="pm-qr-amount">₹{amount}</div>
            <div className="pm-qr-upi">{upiId}</div>
            <p className="pm-qr-hint">After payment, tap below to enter your transaction ID</p>
            <button className="pm-btn pm-btn--primary" onClick={() => setStep("utr")}>
              ✅ I've paid — enter UTR
            </button>
            <button className="pm-btn pm-btn--ghost" onClick={() => setStep("summary")}>
              ← Back
            </button>
          </div>
        )}

        {/* ── STEP: Enter UTR ── */}
        {step === "utr" && (
          <div className="pm-body">
            <p className="pm-utr-label">
              Enter the UTR / Transaction ID from your UPI app to confirm payment
            </p>
            <input
              className="pm-input"
              type="text"
              placeholder="e.g. 425612345678"
              value={utr}
              onChange={e => { setUtr(e.target.value); setError(""); }}
              maxLength={30}
            />
            <textarea
              className="pm-input pm-textarea"
              placeholder="Note to owner (optional)"
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
            />
            {error && <div className="pm-error">{error}</div>}
            <div className="pm-actions">
              <button
                className="pm-btn pm-btn--primary"
                onClick={handleSubmitUTR}
                disabled={loading || !utr.trim()}
              >
                {loading ? "Submitting…" : "Submit Payment"}
              </button>
              <button
                className="pm-btn pm-btn--ghost"
                onClick={() => setStep(upiId ? "qr" : "summary")}
              >
                ← Back
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: Done ── */}
        {step === "done" && (
          <div className="pm-body pm-body--center">
            <div className="pm-done-icon">✅</div>
            <div className="pm-done-title">Payment submitted!</div>
            <p className="pm-done-sub">
              The kitchen owner will verify your UTR number and confirm your payment shortly.
            </p>
            <button className="pm-btn pm-btn--primary" onClick={onClose}>
              Done
            </button>
          </div>
        )}

      </div>
    </div>
  );
}