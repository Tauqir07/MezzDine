import { useEffect, useState } from "react";
import api from "../../api/axios";

/**
 * Props:
 *   kitchenId  — string
 *   currentUpi — string (kitchen.upiId from parent)
 *   onSaved    — (newUpiId: string) => void
 */
export default function UpiSettings({ kitchenId, currentUpi = "", onSaved }) {

  const [upiId,   setUpiId]   = useState(currentUpi);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState("");
  const [preview, setPreview] = useState(false);

  // ── Sync prop → state when parent fetches kitchen data ──
  // (runs once when currentUpi first arrives from API, e.g. "" → "name@upi")
  useEffect(() => {
    setUpiId(currentUpi);
  }, [currentUpi]);

  const isValid = /^[\w.\-]+@[\w.\-]+$/.test(upiId.trim());

  async function save() {
    if (!isValid) { setMsg("❌ Enter a valid UPI ID (e.g. name@upi)"); return; }
    setSaving(true);
    setMsg("");
    try {
      const res = await api.put(`/kitchens/${kitchenId}`, { upiId: upiId.trim() });
      // Use the value returned from server — source of truth
      const saved = res.data?.data?.upiId || upiId.trim();
      setUpiId(saved);
      onSaved?.(saved);
      setMsg("✅ UPI ID saved!");
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      setMsg("❌ " + (err.response?.data?.message || "Failed to save"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={styles.icon}>📲</span>
        <div>
          <div style={styles.title}>UPI Payment ID</div>
          <div style={styles.subtitle}>
            Subscribers will scan a QR code to pay you
          </div>
        </div>
      </div>

      <div style={styles.inputRow}>
        <input
          style={{
            ...styles.input,
            borderColor: upiId && !isValid ? "#ef4444" : "#e8e0d5"
          }}
          type="text"
          placeholder="yourname@upi  or  9876543210@paytm"
          value={upiId}
          onChange={e => { setUpiId(e.target.value); setMsg(""); }}
        />
        <button
          style={{ ...styles.saveBtn, opacity: saving ? 0.6 : 1, cursor: saving ? "not-allowed" : "pointer" }}
          onClick={save}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {upiId && !isValid && (
        <p style={styles.hint}>Format: name@upi · 9876543210@paytm · name@gpay</p>
      )}

      {msg && (
        <p style={{ ...styles.hint, color: msg.startsWith("✅") ? "#2d6a4f" : "#c0392b" }}>
          {msg}
        </p>
      )}

      {/* Preview QR — only show when saved value matches what's in the input */}
      {isValid && upiId === currentUpi && currentUpi !== "" && (
        <div style={styles.previewRow}>
          <button style={styles.previewBtn} onClick={() => setPreview(p => !p)}>
            {preview ? "Hide Preview" : "👁 Preview QR"}
          </button>
          {preview && <QRPreview upiId={upiId} />}
        </div>
      )}

      <div style={styles.examples}>
        <strong>Common formats: </strong>
        <span>name@okicici</span>
        <span>name@oksbi</span>
        <span>number@paytm</span>
        <span>name@gpay</span>
        <span>name@ybl</span>
      </div>
    </div>
  );
}

// ── QR Preview ─────────────────────────────────────────────────────────────
function QRPreview({ upiId }) {
  const [qrUrl, setQrUrl] = useState("");

  // ← useEffect, not useState
  useEffect(() => {
    import("qrcode").then(QRCode => {
      const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&cu=INR`;
      QRCode.toDataURL(upiLink, { width: 160, margin: 1 })
        .then(setQrUrl)
        .catch(() => {});
    });
  }, [upiId]);

  if (!qrUrl) return <p style={{ fontSize: 12, color: "#8a7f74" }}>Generating QR…</p>;
  return (
    <div style={styles.qrWrap}>
      <img src={qrUrl} alt="UPI QR Preview" style={{ width: 140, height: 140, borderRadius: 8 }} />
      <p style={styles.qrLabel}>{upiId}</p>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = {
  card: {
    background: "#fff",
    border: "1.5px solid #e8e0d5",
    borderRadius: 14,
    padding: "18px 20px",
    marginTop: 16,
  },
  header:   { display: "flex", alignItems: "center", gap: 12, marginBottom: 14 },
  icon:     { fontSize: 26 },
  title:    { fontWeight: 700, fontSize: 15, color: "#1c1a17" },
  subtitle: { fontSize: 12.5, color: "#8a7f74", marginTop: 2 },
  inputRow: { display: "flex", gap: 8 },
  input: {
    flex: 1,
    padding: "9px 12px",
    borderRadius: 8,
    border: "1.5px solid #e8e0d5",
    fontSize: 13.5,
    fontFamily: "inherit",
    color: "#1c1a17",
    outline: "none",
    transition: "border-color 0.15s",
  },
  saveBtn: {
    padding: "9px 18px",
    borderRadius: 8,
    border: "none",
    background: "#c2692a",
    color: "#fff",
    fontWeight: 700,
    fontSize: 13,
    fontFamily: "inherit",
    flexShrink: 0,
  },
  hint:       { fontSize: 12, color: "#8a7f74", marginTop: 6, fontStyle: "italic" },
  previewRow: { marginTop: 10 },
  previewBtn: {
    fontSize: 12.5,
    color: "#c2692a",
    background: "#fdf0e6",
    border: "1px solid #f0d5be",
    borderRadius: 6,
    padding: "5px 12px",
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 600,
  },
  qrWrap:   { marginTop: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 },
  qrLabel:  { fontSize: 12, color: "#5a5048", fontWeight: 600 },
  examples: {
    marginTop: 12,
    padding: "8px 10px",
    background: "#f7f3ee",
    borderRadius: 8,
    fontSize: 12,
    color: "#8a7f74",
    display: "flex",
    flexWrap: "wrap",
    gap: "6px 14px",
  },
};