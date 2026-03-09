import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../../api/axios";
import "./SubscribersMap.css";

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Kitchen pin — dark
const KITCHEN_ICON = L.divIcon({
  className: "",
  html: `<div style="
    width:36px;height:36px;border-radius:50% 50% 50% 0;
    background:#1a1a1a;border:3px solid #fff;
    transform:rotate(-45deg);
    box-shadow:0 2px 8px rgba(0,0,0,0.35);
  "></div>`,
  iconSize:   [36, 36],
  iconAnchor: [18, 36],
  popupAnchor:[0, -40],
});

// Customer pin — orange
function customerIcon(name = "") {
  const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:36px;height:36px;border-radius:50%;
        background:#f97316;border:3px solid #fff;
        box-shadow:0 2px 8px rgba(0,0,0,0.25);
        display:flex;align-items:center;justify-content:center;
        color:#fff;font-size:12px;font-weight:700;font-family:sans-serif;
      ">${initials}</div>`,
    iconSize:   [36, 36],
    iconAnchor: [18, 18],
    popupAnchor:[0, -20],
  });
}

export default function SubscribersMap({ kitchenId, kitchenLat, kitchenLng, kitchenName }) {
  const [subscribers, setSubscribers] = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    if (!kitchenId) return;
    api.get(`/kitchens/${kitchenId}/subscribers-map`)
      .then(res => setSubscribers(res.data.data || []))
      .catch(() => setSubscribers([]))
      .finally(() => setLoading(false));
  }, [kitchenId]);

  const hasKitchen   = kitchenLat && kitchenLng;
  const withLocation = subscribers.filter(s => s.lat && s.lng);

  if (!hasKitchen) {
    return (
      <div className="sm-no-location">
        <span>📍</span>
        <p>Kitchen location not set. Edit your kitchen to add an address.</p>
      </div>
    );
  }

  return (
    <div className="sm-wrap">
      <div className="sm-stats">
        <span className="sm-stat">
          <span className="sm-stat-dot sm-stat-dot--total" />
          {subscribers.length} subscriber{subscribers.length !== 1 ? "s" : ""}
        </span>
        <span className="sm-stat">
          <span className="sm-stat-dot sm-stat-dot--located" />
          {withLocation.length} location{withLocation.length !== 1 ? "s" : ""} available
        </span>
        {subscribers.length - withLocation.length > 0 && (
          <span className="sm-stat sm-stat--muted">
            {subscribers.length - withLocation.length} haven't shared location yet
          </span>
        )}
      </div>

      <MapContainer
        center={[kitchenLat, kitchenLng]}
        zoom={14}
        className="sm-map"
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* Kitchen pin */}
        <Marker position={[kitchenLat, kitchenLng]} icon={KITCHEN_ICON}>
          <Popup>
            <strong>🍽 {kitchenName || "Your Kitchen"}</strong>
            <br />Your kitchen location
          </Popup>
        </Marker>

        {/* Subscriber pins */}
        {withLocation.map((sub, i) => (
          <Marker
            key={i}
            position={[sub.lat, sub.lng]}
            icon={customerIcon(sub.name)}
          >
            <Popup>
              <strong>{sub.name}</strong>
              <br />📦 {sub.mealPlan === "one" ? "1 meal" : sub.mealPlan === "two" ? "2 meals" : "3 meals"} / day
              <br /><span style={{ fontSize: "11px", color: "#888" }}>
                Last updated: {sub.locationUpdatedAt
                  ? new Date(sub.locationUpdatedAt).toLocaleDateString()
                  : "Unknown"}
              </span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="sm-legend">
        <span className="sm-legend-item">
          <span className="sm-dot sm-dot--kitchen" /> Your kitchen
        </span>
        <span className="sm-legend-item">
          <span className="sm-dot sm-dot--customer" /> Subscribers
        </span>
      </div>
    </div>
  );
}