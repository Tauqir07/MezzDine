import { useEffect, useState } from "react";
import api from "../../api/axios";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";
import "./VisitStats.css";

function CustomTooltip({ active, payload, label }) {
  if (active && payload?.length) {
    return (
      <div className="vs-tooltip">
        <p className="vs-tooltip-label">{label}</p>
        <p className="vs-tooltip-val">{payload[0].value} visitors</p>
      </div>
    );
  }
  return null;
}

export default function VisitStats({ entityType, entityId, ownerId }) {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!entityId) return;

    // record the visit
    api.post(`/visits/${entityType}/${entityId}`, { ownerId }).catch(() => {});

    // fetch stats
    api.get(`/visits/${entityType}/${entityId}`)
      .then(res => setStats(res.data.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [entityId]);

  if (loading) return (
    <div className="vs-wrap">
      <div className="vs-skeleton-title" />
      <div className="vs-skeleton-cards">
        {[1,2,3].map(i => <div key={i} className="vs-skeleton-card" />)}
      </div>
      <div className="vs-skeleton-chart" />
    </div>
  );

  if (!stats) return null;

  // only show every 5th label on x-axis to avoid clutter
  const tickFormatter = (val, index) => index % 5 === 0 ? val : "";

  return (
    <div className="vs-wrap">
      <h3 className="vs-title">👁 Visitor Stats — Last 30 Days</h3>

      {/* summary cards */}
      <div className="vs-cards">
        <div className="vs-card vs-card--today">
          <span className="vs-num">{stats.today}</span>
          <span className="vs-label">Today</span>
        </div>
        <div className="vs-card vs-card--week">
          <span className="vs-num">{stats.week}</span>
          <span className="vs-label">This Week</span>
        </div>
        <div className="vs-card vs-card--total">
          <span className="vs-num">{stats.total}</span>
          <span className="vs-label">Last 30 Days</span>
        </div>
      </div>

      {/* chart */}
      <div className="vs-chart-wrap">
        {stats.total === 0 ? (
          <div className="vs-no-data">No visits yet in the last 30 days</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats.daily} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="visitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#aaa" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={tickFormatter}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#aaa" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                strokeWidth={2.5}
                fill="url(#visitGrad)"
                dot={false}
                activeDot={{ r: 5, fill: "#6366f1" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}