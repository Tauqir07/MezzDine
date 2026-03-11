import { useEffect, useState } from "react";
import api from "../api/axios";
import "./Deliverystatuspanel.css";

const STEPS = [
  { key: "preparing",        label: "Preparing",       icon: "👨‍🍳" },
  { key: "out_for_delivery", label: "Out for Delivery", icon: "🚴" },
  { key: "delivered",        label: "Delivered",        icon: "✅" },
];

export default function DeliveryStatusPanel({ kitchenId }) {
  const [current, setCurrent] = useState("preparing");
  const [note,    setNote]    = useState("");
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/delivery/status/${kitchenId}`)
      .then(res => {
        const d = res.data.data;
        setCurrent(d.status || "preparing");
        setNote(d.note || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [kitchenId]);

  async function updateStatus(status) {
    setCurrent(status);
    setSaving(true);
    setSaved(false);
    try {
      await api.patch(`/delivery/status/${kitchenId}`, { status, note });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert("Failed to update status");
    } finally {
      setSaving(false);
    }
  }

  async function saveNote() {
    setSaving(true);
    try {
      await api.patch(`/delivery/status/${kitchenId}`, { status: current, note });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert("Failed to save note");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <div className="dsp-wrap">
      <h3 className="dsp-title">📦 Today's Delivery Status</h3>
      <p className="dsp-sub">
        Update the status below — your subscribers will be notified automatically.
      </p>

      <div className="dsp-steps">
        {STEPS.map((step, i) => {
          const stepIdx    = STEPS.findIndex(s => s.key === current);
          const isDone     = i < stepIdx;
          const isActive   = step.key === current;
          return (
            <button
              key={step.key}
              className={`dsp-step ${isActive ? "dsp-step--active" : ""} ${isDone ? "dsp-step--done" : ""}`}
              onClick={() => updateStatus(step.key)}
              disabled={saving}
            >
              <span className="dsp-step-icon">{isDone ? "✓" : step.icon}</span>
              <span className="dsp-step-label">{step.label}</span>
              {isActive && <span className="dsp-step-dot" />}
            </button>
          );
        })}
      </div>

      {/* Optional note */}
      <div className="dsp-note-row">
        <input
          className="dsp-note-input"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Optional note for subscribers (e.g. Lunch delayed 20 min)"
          onKeyDown={e => { if (e.key === "Enter") saveNote(); }}
        />
        <button
          className="dsp-note-btn"
          onClick={saveNote}
          disabled={saving}
        >
          Save
        </button>
      </div>

      {saved && <p className="dsp-saved">✓ Subscribers notified</p>}
    </div>
  );
}