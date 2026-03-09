import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import "./RoomDashboard.css";
import VisitStats from "../components/VisitStats/VisitStats";

const TENANT_CONFIG = {
  bachelor_male:   { icon: "👨", label: "Bachelor (Male)",   color: "#3b82f6", bg: "#eff6ff" },
  bachelor_female: { icon: "👩", label: "Bachelor (Female)", color: "#ec4899", bg: "#fdf2f8" },
  family:          { icon: "👨‍👩‍👧‍👦", label: "Family",           color: "#16a34a", bg: "#f0fdf4" },
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function daysSince(date) {
  const diff = new Date() - new Date(date);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function RoomDashboard() {

  const { roomId } = useParams();

  const [tenants,   setTenants]   = useState([]);
  const [room,      setRoom]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [showForm,  setShowForm]  = useState(false);
  const [saving,    setSaving]    = useState(false);

  const [form, setForm] = useState({
    tenantName:  "",
    tenantPhone: "",
    tenantType:  "bachelor_male",
    monthlyRent: "",
    rentDueDay:  "1",
    startDate:   new Date().toISOString().split("T")[0],
    adults:      "2",
    children:    "0",
    notes:       "",
  });

  async function fetchTenants() {
    try {
      const [tenantsRes, roomRes] = await Promise.all([
        api.get(`/room-rentals/${roomId}`),
        api.get(`/rooms/${roomId}`),
      ]);
      setTenants(tenantsRes.data.data || []);
      setRoom(roomRes.data.data || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchTenants(); }, [roomId]);

  async function markPaid(rentalId) {
    try {
      await api.patch(`/room-rentals/${rentalId}/pay`);
      fetchTenants();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to mark paid");
    }
  }

  async function removeTenant(rentalId) {
    if (!window.confirm("Remove this tenant?")) return;
    try {
      await api.delete(`/room-rentals/${rentalId}`);
      fetchTenants();
    } catch {
      alert("Failed to remove tenant");
    }
  }

  async function addTenant(e) {
    e.preventDefault();
    if (!form.tenantName.trim()) { alert("Tenant name is required"); return; }
    setSaving(true);
    try {
      await api.post(`/room-rentals/${roomId}`, {
        tenantName:    form.tenantName.trim(),
        tenantPhone:   form.tenantPhone.trim(),
        tenantType:    form.tenantType,
        monthlyRent:   Number(form.monthlyRent),
        rentDueDay:    Number(form.rentDueDay),
        startDate:     form.startDate,
        notes:         form.notes,
        familyMembers: {
          adults:   Number(form.adults),
          children: Number(form.children),
        },
      });
      setShowForm(false);
      setForm({
        tenantName: "", tenantPhone: "", tenantType: "bachelor_male",
        monthlyRent: "", rentDueDay: "1",
        startDate: new Date().toISOString().split("T")[0],
        adults: "2", children: "0", notes: "",
      });
      fetchTenants();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add tenant");
    } finally {
      setSaving(false);
    }
  }

  const unpaidList  = tenants.filter(t => !t.currentMonthPaid);
  const paidList    = tenants.filter(t => t.currentMonthPaid);
  const overdueList = tenants.filter(t => t.isOverdue);

  const displayList =
    activeTab === "unpaid"  ? unpaidList  :
    activeTab === "paid"    ? paidList    :
    activeTab === "overdue" ? overdueList : tenants;

  const now = new Date();
  const monthLabel = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  if (loading) return (
    <div className="rdb-loading">
      <div className="rdb-spinner" />
      <p>Loading dashboard…</p>
    </div>
  );

  return (
    <div className="rdb-page">

      {/* ── Header ── */}
      <div className="rdb-header">
        <div>
          <h1 className="rdb-title">Room Dashboard</h1>
          <p className="rdb-sub">{monthLabel} · Rent overview</p>
        </div>
        <div className="rdb-header-right">
          <div className="rdb-stats">
            <div className="rdb-stat">
              <span className="rdb-stat-num">{tenants.length}</span>
              <span className="rdb-stat-label">Tenants</span>
            </div>
            <div className="rdb-stat rdb-stat--ok">
              <span className="rdb-stat-num">{paidList.length}</span>
              <span className="rdb-stat-label">Paid</span>
            </div>
            <div className="rdb-stat rdb-stat--warn">
              <span className="rdb-stat-num">{unpaidList.length}</span>
              <span className="rdb-stat-label">Unpaid</span>
            </div>
            {overdueList.length > 0 && (
              <div className="rdb-stat rdb-stat--danger">
                <span className="rdb-stat-num">{overdueList.length}</span>
                <span className="rdb-stat-label">Overdue</span>
              </div>
            )}
          </div>
          <button className="rdb-add-btn" onClick={() => setShowForm(true)}>
            + Add Tenant
          </button>
        </div>
      </div>

      {/* ── Add Tenant Form ── */}
      {showForm && (
        <div className="rdb-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="rdb-modal" onClick={e => e.stopPropagation()}>
            <div className="rdb-modal-header">
              <h2>Add New Tenant</h2>
              <button className="rdb-modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={addTenant} className="rdb-form">

              <div className="rdb-form-row">
                <div className="rdb-form-group">
                  <label>Tenant Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Kumar"
                    value={form.tenantName}
                    onChange={e => setForm({...form, tenantName: e.target.value})}
                    required
                  />
                </div>
                <div className="rdb-form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={form.tenantPhone}
                    onChange={e => setForm({...form, tenantPhone: e.target.value})}
                  />
                </div>
              </div>

              <div className="rdb-form-row">
                <div className="rdb-form-group">
                  <label>Tenant Type</label>
                  <select value={form.tenantType} onChange={e => setForm({...form, tenantType: e.target.value})}>
                    <option value="bachelor_male">Bachelor (Male)</option>
                    <option value="bachelor_female">Bachelor (Female)</option>
                    <option value="family">Family</option>
                  </select>
                </div>
                <div className="rdb-form-group">
                  <label>Monthly Rent (₹) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 8000"
                    value={form.monthlyRent}
                    onChange={e => setForm({...form, monthlyRent: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="rdb-form-row">
                <div className="rdb-form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm({...form, startDate: e.target.value})}
                    required
                  />
                </div>
                <div className="rdb-form-group">
                  <label>Rent Due Day</label>
                  <input
                    type="number"
                    min="1" max="28"
                    placeholder="e.g. 1"
                    value={form.rentDueDay}
                    onChange={e => setForm({...form, rentDueDay: e.target.value})}
                  />
                </div>
              </div>

              {form.tenantType === "family" && (
                <div className="rdb-form-row">
                  <div className="rdb-form-group">
                    <label>Adults</label>
                    <input type="number" min="1" value={form.adults}
                      onChange={e => setForm({...form, adults: e.target.value})} />
                  </div>
                  <div className="rdb-form-group">
                    <label>Children</label>
                    <input type="number" min="0" value={form.children}
                      onChange={e => setForm({...form, children: e.target.value})} />
                  </div>
                </div>
              )}

              <div className="rdb-form-group">
                <label>Notes (optional)</label>
                <textarea
                  placeholder="Any extra info about the tenant..."
                  value={form.notes}
                  onChange={e => setForm({...form, notes: e.target.value})}
                />
              </div>

              <div className="rdb-form-actions">
                <button type="button" className="rdb-btn-cancel" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="rdb-btn-save" disabled={saving}>
                  {saving ? "Adding..." : "Add Tenant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="rdb-tabs-row">
        {[
          { key: "all",     label: `All (${tenants.length})`         },
          { key: "unpaid",  label: `Unpaid (${unpaidList.length})`   },
          { key: "paid",    label: `Paid (${paidList.length})`       },
          { key: "overdue", label: `Overdue (${overdueList.length})` },
        ].map(tab => (
          <button
            key={tab.key}
            className={`rdb-tab ${activeTab === tab.key ? "rdb-tab--active" : ""} ${tab.key === "overdue" && overdueList.length > 0 ? "rdb-tab--danger" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tenant Cards ── */}
      {displayList.length === 0 ? (
        <div className="rdb-empty">
          <p>No tenants in this category.</p>
        </div>
      ) : (
        <div className="rdb-grid">
          {displayList.map(tenant => {
            const cfg       = TENANT_CONFIG[tenant.tenantType] || TENANT_CONFIG.bachelor_male;
            const dayCount  = daysSince(tenant.startDate);
            const due       = tenant.daysUntilDue;
            const isOverdue = tenant.isOverdue;

            const displayName  = tenant.tenantId?.name  || tenant.tenantName  || "Tenant";
            const displayPhone = tenant.tenantId?.phone || tenant.tenantPhone || tenant.tenantId?.email || "—";

            return (
              <div
                key={tenant._id}
                className={`rdb-card ${isOverdue ? "rdb-card--overdue" : ""} ${tenant.currentMonthPaid ? "rdb-card--paid" : ""}`}
              >
                <div className="rdb-card-top">
                  <div className="rdb-avatar" style={{ background: cfg.bg, color: cfg.color }}>
                    {cfg.icon}
                  </div>
                  <div className="rdb-card-info">
                    <div className="rdb-card-name">{displayName}</div>
                    <div className="rdb-card-contact">{displayPhone}</div>
                  </div>
                  <span className="rdb-type-badge" style={{ background: cfg.bg, color: cfg.color }}>
                    {cfg.label}
                  </span>
                </div>

                {tenant.tenantType === "family" && (
                  <div className="rdb-family-row">
                    <span>👨‍👩 {tenant.familyMembers?.adults || 2} adults</span>
                    {tenant.familyMembers?.children > 0 && (
                      <span>👧 {tenant.familyMembers.children} children</span>
                    )}
                  </div>
                )}

                <div className={`rdb-payment-status ${tenant.currentMonthPaid ? "rdb-payment-status--paid" : isOverdue ? "rdb-payment-status--overdue" : "rdb-payment-status--unpaid"}`}>
                  {tenant.currentMonthPaid ? (
                    <><span className="rdb-ps-icon">✅</span>
                    <div>
                      <div className="rdb-ps-label">Paid — {monthLabel}</div>
                      <div className="rdb-ps-sub">on {formatDate(tenant.currentMonthPaidOn)}</div>
                    </div></>
                  ) : isOverdue ? (
                    <><span className="rdb-ps-icon">🚨</span>
                    <div>
                      <div className="rdb-ps-label">Overdue — {monthLabel}</div>
                      <div className="rdb-ps-sub">{Math.abs(due)} days past due</div>
                    </div></>
                  ) : (
                    <><span className="rdb-ps-icon">⏳</span>
                    <div>
                      <div className="rdb-ps-label">Not paid — {monthLabel}</div>
                      <div className="rdb-ps-sub">{due > 0 ? `${due} days left` : "Due today"}</div>
                    </div></>
                  )}
                </div>

                <div className="rdb-details">
                  <div className="rdb-detail">
                    <span className="rdb-detail-label">Monthly Rent</span>
                    <span className="rdb-detail-val">₹{tenant.monthlyRent?.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="rdb-detail">
                    <span className="rdb-detail-label">Started</span>
                    <span className="rdb-detail-val">{formatDate(tenant.startDate)}</span>
                  </div>
                  <div className="rdb-detail">
                    <span className="rdb-detail-label">Days Staying</span>
                    <span className="rdb-detail-val">{dayCount}d</span>
                  </div>
                  <div className="rdb-detail">
                    <span className="rdb-detail-label">Due Date</span>
                    <span className="rdb-detail-val">
                      {tenant.rentDueDay}{["st","nd","rd"][tenant.rentDueDay-1] || "th"} of month
                    </span>
                  </div>
                </div>

                <div className="rdb-month-bar-wrap">
                  <div className="rdb-month-bar-label">
                    <span>Month progress</span>
                    <span>{now.getDate()} / {new Date(now.getFullYear(), now.getMonth()+1, 0).getDate()} days</span>
                  </div>
                  <div className="rdb-month-bar">
                    <div
                      className="rdb-month-bar-fill"
                      style={{
                        width: `${(now.getDate() / new Date(now.getFullYear(), now.getMonth()+1, 0).getDate()) * 100}%`,
                        background: tenant.currentMonthPaid ? "#16a34a" : isOverdue ? "#dc2626" : "#f59e0b",
                      }}
                    />
                  </div>
                </div>

                {tenant.notes && (
                  <div className="rdb-notes">📝 {tenant.notes}</div>
                )}

                <div className="rdb-card-actions">
                  {!tenant.currentMonthPaid && (
                    <button className="rdb-btn-pay" onClick={() => markPaid(tenant._id)}>
                      ✓ Mark Paid
                    </button>
                  )}
                  <button className="rdb-btn-remove" onClick={() => removeTenant(tenant._id)}>
                    Remove
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ── Visitor Stats ── */}
      <div className="rdb-section">
        <h2 className="rdb-section-title">👁 Visitor Stats</h2>
        <VisitStats
          entityType="room"
          entityId={roomId}
          ownerId={room?.ownerId}
        />
      </div>

    </div>
  );
}