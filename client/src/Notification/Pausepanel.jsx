import { useEffect, useState } from "react";
import api from "../api/axios";
import "./Pausepanel.css";

const MEAL_INFO = {
  breakfast: { label: "Breakfast", emoji: "🌅", cutoffNote: "before 7:00 AM same day" },
  lunch:     { label: "Lunch",     emoji: "☀️",  cutoffNote: "3 hrs before (by 9:30 AM)" },
  dinner:    { label: "Dinner",    emoji: "🌙",  cutoffNote: "3 hrs before (by 6:00 PM)" },
};
const ALL_MEALS = ["breakfast", "lunch", "dinner"];
const MEAL_COLORS = {
  breakfast: { bg: "#FEF3C7", color: "#D97706", border: "#FDE68A" },
  lunch:     { bg: "#D1FAE5", color: "#065F46", border: "#6EE7B7" },
  dinner:    { bg: "#EEF2FF", color: "#4338CA", border: "#C7D2FE" },
};

function todayStr() { return new Date().toISOString().slice(0, 10); }
function addDays(str, n) {
  const d = new Date(str); d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function fmtDate(str) {
  return new Date(str).toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short",
  });
}
function isFullDay(meals) {
  if (!meals || meals.length === 0) return true;
  return ALL_MEALS.every(m => meals.includes(m));
}
function isPast(dateStr)  { return dateStr < todayStr(); }
function isToday(dateStr) { return dateStr === todayStr(); }

// ✅ Compute which meals this subscriber is allowed to pause
function getAllowedMeals(mealPlan, preferredMeal) {
  switch (mealPlan) {
    case "one":   return [preferredMeal].filter(Boolean);
    case "two":   return ["lunch", "dinner"];
    case "three": return ["breakfast", "lunch", "dinner"];
    default:      return ["breakfast", "lunch", "dinner"]; // owner / unknown — show all
  }
}

/* ── Meal badge pill ─────────────────────────────────────── */
function MealBadge({ meal }) {
  const c    = MEAL_COLORS[meal] || {};
  const info = MEAL_INFO[meal]   || {};
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
    }}>
      {info.emoji} {info.label}
    </span>
  );
}

/* ── Shared pause list ──────────────────────────────────── */
function PauseHistory({ pauses, isOwner, onRemove }) {
  const [showPast, setShowPast] = useState(false);
  const sorted   = [...pauses].sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = sorted.filter(p => !isPast(p.date));
  const past     = sorted.filter(p =>  isPast(p.date));

  return (
    <div className="pp-history">
      {upcoming.length > 0 && (
        <>
          <p className="pp-active-title">
            {isOwner ? "📅 Upcoming closures" : "📅 Upcoming pauses"}
            <span className="pp-history-count">{upcoming.length}</span>
          </p>
          <ul className="pp-active-list">
            {upcoming.map(p => (
              <li
                key={p.date + (p.source || "")}
                className={`pp-active-item ${isToday(p.date) ? "pp-item--today" : ""}`}
              >
                <div className="pp-item-left">
                  <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                    <span className="pp-item-date">{fmtDate(p.date)}</span>
                    {isToday(p.date) && <span className="pp-today-tag">Today</span>}
                    {p.source === "kitchen"  && <span className="pp-source-tag pp-source-tag--kitchen">🍳 By Kitchen</span>}
                    {p.source === "customer" && <span className="pp-source-tag pp-source-tag--customer">👤 By Customer</span>}
                  </div>
                  <div className="pp-item-meals">
                    {isFullDay(p.meals)
                      ? <span className="pp-fullday-pill">🚫 Full Day</span>
                      : (p.meals || []).map(m => <MealBadge key={m} meal={m} />)
                    }
                  </div>
                </div>
                {p.source !== "kitchen" && !p.readOnly && onRemove && (
                  <button className="pp-remove-btn" onClick={() => onRemove(p.date)}>
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {upcoming.length === 0 && (
        <p style={{ padding:"10px 14px", fontSize:12, color:"#9CA3AF", margin:0 }}>
          No upcoming pauses.
        </p>
      )}

      {past.length > 0 && (
        <>
          <button className="pp-past-toggle" onClick={() => setShowPast(s => !s)}>
            {showPast ? "▲ Hide" : "▼ Show"} past pauses ({past.length})
          </button>
          {showPast && (
            <ul className="pp-active-list pp-past-list">
              {past.map(p => (
                <li key={p.date + (p.source || "")} className="pp-active-item pp-item--past">
                  <div className="pp-item-left">
                    <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                      <span className="pp-item-date">{fmtDate(p.date)}</span>
                      {p.source === "kitchen"  && <span className="pp-source-tag pp-source-tag--kitchen">🍳 By Kitchen</span>}
                      {p.source === "customer" && <span className="pp-source-tag pp-source-tag--customer">👤 By Customer</span>}
                    </div>
                    <div className="pp-item-meals">
                      {isFullDay(p.meals)
                        ? <span className="pp-fullday-pill">🚫 Full Day</span>
                        : (p.meals || []).map(m => <MealBadge key={m} meal={m} />)
                      }
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT

   Props:
     kitchenId     — always required
     isOwner       — true when used in KitchenDashboard
     userId        — pass when kitchen is viewing a subscriber card
     userName      — display name for subscriber (card view)
     mealPlan      — "one" | "two" | "three" (customer only)
     preferredMeal — "breakfast"|"lunch"|"dinner" (only for mealPlan="one")
   ══════════════════════════════════════════════════════════ */
export default function PausePanel({
  kitchenId,
  isOwner      = false,
  userId       = null,
  userName     = "",
  mealPlan     = null,   // ✅ NEW
  preferredMeal = null,  // ✅ NEW
}) {
  const isCardView = Boolean(userId);

  const endpoint = isOwner
    ? `/notifications/kitchen-pause/${kitchenId}`
    : `/notifications/pause/${kitchenId}`;

  const [pauseRecord,   setPauseRecord]   = useState(null);
  const [kitchenPauses, setKitchenPauses] = useState([]);
  const [historyOpen,   setHistoryOpen]   = useState(false);
  const [fetched,       setFetched]       = useState(false);
  const [loadingCard,   setLoadingCard]   = useState(false);

  const [selectedDate,  setSelectedDate]  = useState(todayStr());
  const [selectedMeals, setSelectedMeals] = useState([]);
  const [fullDay,       setFullDay]       = useState(true);
  const [status,        setStatus]        = useState(null);
  const [errMsg,        setErrMsg]        = useState("");

  // ✅ Compute allowed meals for this subscriber
  // isOwner gets all meals (kitchen can close any meal)
  const allowedMeals = isOwner
    ? ALL_MEALS
    : getAllowedMeals(mealPlan, preferredMeal);

  useEffect(() => {
    if (isCardView || !kitchenId) return;
    api.get(endpoint)
      .then(res => setPauseRecord(res.data.data))
      .catch(() => setPauseRecord(null));
  }, [kitchenId, isCardView]);

  useEffect(() => {
    if (isCardView || isOwner || !kitchenId) return;
    api.get(`/notifications/kitchen-pause/${kitchenId}`)
      .then(res => {
        const raw = res.data.data?.dates || [];
        setKitchenPauses(raw.map(p => ({ date: p.date, meals: p.meals || [], source: "kitchen" })));
      })
      .catch(() => setKitchenPauses([]));
  }, [kitchenId, isOwner, isCardView]);

  async function loadCardData() {
    if (fetched) return;
    setLoadingCard(true);
    try {
      const res = await api.get(`/notifications/pause/${kitchenId}/user/${userId}`);
      const d   = res.data.data;
      const customerMeals = d.customerMeals || [];
      const customerRows  = (d.customerDates || []).map(date => ({
        date, meals: customerMeals, source: "customer", readOnly: true,
      }));
      const kitchenRows = (d.kitchenDates || []).map(p => ({
        date: p.date, meals: p.meals || [], source: "kitchen", readOnly: true,
      }));
      setPauseRecord({ merged: [...customerRows, ...kitchenRows] });
      setFetched(true);
    } catch {
      setPauseRecord({ merged: [] });
    } finally {
      setLoadingCard(false);
    }
  }

  function toggleHistory() {
    if (!historyOpen && isCardView) loadCardData();
    setHistoryOpen(o => !o);
  }

  const allPauses = (() => {
    if (isCardView) return pauseRecord?.merged || [];
    const raw = pauseRecord?.dates || [];
    const ownPauses = isOwner
      ? raw.map(p => ({ date: p.date, meals: p.meals || [], source: null }))
      : raw.map(d => ({ date: d, meals: pauseRecord?.meals || [], source: "customer" }));
    if (isOwner) return ownPauses;
    return [
      ...ownPauses,
      ...kitchenPauses.filter(kp => !ownPauses.some(op => op.date === kp.date)),
    ];
  })();

  const activeDates   = allPauses.filter(p => p.date >= todayStr()).map(p => p.date);
  const totalUpcoming = allPauses.filter(p => !isPast(p.date)).length;

  function toggleMeal(meal) {
    // ✅ Silently ignore if meal not in allowedMeals (shouldn't happen since button is disabled)
    if (!allowedMeals.includes(meal)) return;
    setSelectedMeals(prev =>
      prev.includes(meal) ? prev.filter(m => m !== meal) : [...prev, meal]
    );
  }

  async function savePause() {
    setStatus("saving"); setErrMsg("");
    try {
      const meals = fullDay ? [] : selectedMeals;
      if (!fullDay && meals.length === 0) {
        setErrMsg("Select at least one meal or choose full day.");
        setStatus(null); return;
      }

      // ✅ Frontend guard: make sure all selected meals are allowed
      const invalid = meals.filter(m => !allowedMeals.includes(m));
      if (invalid.length) {
        setErrMsg(`You can't pause ${invalid.join(", ")} — not part of your meal plan.`);
        setStatus(null); return;
      }

      const res = await api.post(endpoint, { dates: [selectedDate], meals });
      setPauseRecord(res.data.data);
      setStatus("saved");
      setHistoryOpen(true);
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      setErrMsg(err.response?.data?.message || "Failed to save pause.");
      setStatus("error");
    }
  }

  async function removeDate(date) {
    try {
      await api.delete(endpoint, { data: { dates: [date] } });
      setPauseRecord(prev => {
        if (!prev) return null;
        const filtered = isOwner
          ? prev.dates.filter(d => d.date !== date)
          : prev.dates.filter(d => d !== date);
        return { ...prev, dates: filtered };
      });
    } catch {
      alert("Failed to remove pause.");
    }
  }

  /* ── CARD VIEW ── */
  if (isCardView) {
    return (
      <div className="pp-history-wrap" style={{ marginTop: 10 }}>
        <button className="pp-history-toggle" onClick={toggleHistory}>
          <span>
            📋 Pause History
            {!loadingCard && totalUpcoming > 0 && (
              <span className="pp-history-badge">{totalUpcoming} upcoming</span>
            )}
            {loadingCard && (
              <span className="pp-history-badge" style={{ background: "#9CA3AF" }}>
                Loading…
              </span>
            )}
          </span>
          <span className="pp-history-arrow">{historyOpen ? "▲" : "▼"}</span>
        </button>

        {historyOpen && (
          <>
            {loadingCard ? (
              <div style={{ padding: "12px 16px", fontSize: 12, color: "#9CA3AF" }}>
                Fetching pauses for {userName || "this customer"}…
              </div>
            ) : (
              <PauseHistory pauses={allPauses} isOwner={false} onRemove={null} />
            )}
          </>
        )}
      </div>
    );
  }

  /* ── FULL PANEL VIEW ── */
  return (
    <div className="pp-wrap">
      <h3 className="pp-title">
        {isOwner ? "⏸ Pause Kitchen Service" : "⏸ Pause My Meals"}
      </h3>
      <p className="pp-sub">
        {isOwner
          ? "Close your kitchen for a day or specific meals. All subscribers will be notified."
          : "Skip delivery for a specific date. Requests must be made before the cutoff time."}
      </p>

      {/* ✅ Show subscriber's meal plan info */}
      {!isOwner && mealPlan && (
        <div className="pp-plan-info">
          <span className="pp-plan-label">Your plan:</span>
          <div className="pp-plan-meals">
            {allowedMeals.map(m => <MealBadge key={m} meal={m} />)}
          </div>
        </div>
      )}

      <div className="pp-cutoffs">
        {Object.entries(MEAL_INFO)
          // ✅ Only show cutoff info for meals in the subscriber's plan
          .filter(([key]) => isOwner || allowedMeals.includes(key))
          .map(([key, info]) => (
            <div key={key} className="pp-cutoff-item">
              <span>{info.emoji} {info.label}</span>
              <span className="pp-cutoff-note">{info.cutoffNote}</span>
            </div>
          ))}
      </div>

      <label className="pp-label">Select date</label>
      <div className="pp-date-row">
        {[0, 1, 2, 3, 4, 5, 6].map(offset => {
          const d        = addDays(todayStr(), offset);
          const isActive = activeDates.includes(d);
          return (
            <button
              key={d}
              className={`pp-date-btn ${selectedDate === d ? "active" : ""} ${isActive ? "paused" : ""}`}
              onClick={() => setSelectedDate(d)}
            >
              <span className="pp-date-day">
                {offset === 0 ? "Today" : new Date(d).toLocaleDateString("en-IN", { weekday: "short" })}
              </span>
              <span className="pp-date-num">{new Date(d).getDate()}</span>
              {isActive && <span className="pp-date-paused-dot" />}
            </button>
          );
        })}
      </div>

      <div className="pp-fullday-row">
        <label className="pp-toggle-label">
          <input
            type="checkbox"
            checked={fullDay}
            onChange={e => { setFullDay(e.target.checked); setSelectedMeals([]); }}
          />
          <span>{isOwner ? "Close full day" : "Pause full day"}</span>
        </label>
      </div>

      {!fullDay && (
        <div className="pp-meals">
          {Object.entries(MEAL_INFO).map(([key, info]) => {
            const allowed = allowedMeals.includes(key);
            return (
              <button
                key={key}
                className={`pp-meal-btn ${selectedMeals.includes(key) ? "active" : ""} ${!allowed ? "pp-meal-btn--disabled" : ""}`}
                onClick={() => toggleMeal(key)}
                disabled={!allowed}
                title={!allowed ? `Not part of your meal plan` : ""}
              >
                {info.emoji} {info.label}
                {!allowed && <span className="pp-meal-na"> · N/A</span>}
              </button>
            );
          })}
        </div>
      )}

      {errMsg && <p className="pp-err">{errMsg}</p>}

      <button className="pp-save-btn" onClick={savePause} disabled={status === "saving"}>
        {status === "saving" ? "Saving…" : isOwner ? "Confirm Closure" : "Confirm Pause"}
      </button>

      {status === "saved" && (
        <p className="pp-feedback pp-feedback--ok">✓ Saved successfully</p>
      )}

      {allPauses.length > 0 && (
        <div className="pp-history-wrap">
          <button className="pp-history-toggle" onClick={toggleHistory}>
            <span>
              📋 {isOwner ? "Pause Schedule" : "My Paused Meals"}
              {totalUpcoming > 0 && (
                <span className="pp-history-badge">{totalUpcoming} upcoming</span>
              )}
            </span>
            <span className="pp-history-arrow">{historyOpen ? "▲" : "▼"}</span>
          </button>

          {historyOpen && (
            <PauseHistory
              pauses={allPauses}
              isOwner={isOwner}
              onRemove={removeDate}
            />
          )}
        </div>
      )}
    </div>
  );
}