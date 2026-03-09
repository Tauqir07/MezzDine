import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./KitchenMap.css";

// Fix leaflet default icon broken by webpack/vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom coloured marker factory
function coloredIcon(color) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:32px;height:32px;border-radius:50% 50% 50% 0;
        background:${color};border:3px solid #fff;
        transform:rotate(-45deg);
        box-shadow:0 2px 8px rgba(0,0,0,0.3);
      "></div>`,
    iconSize:   [32, 32],
    iconAnchor: [16, 32],
    popupAnchor:[0, -36],
  });
}

const KITCHEN_ICON  = coloredIcon("#1a1a1a");
const CUSTOMER_ICON = coloredIcon("#16a34a");

// Re-centres map when centre prop changes
function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.setView([lat, lng], 14);
  }, [lat, lng]);
  return null;
}

export default function KitchenMap({
  kitchenLat,
  kitchenLng,
  kitchenName,
  customerLat,
  customerLng,
  customerAddress,
  label = "Kitchen",
  height = 280,   // default 280px; pass height={400} on details pages
}) {
  const hasKitchen  = kitchenLat  && kitchenLng;
  const hasCustomer = customerLat && customerLng;

  if (!hasKitchen) {
    return (
      <div className="km-no-location">
        <span>📍</span>
        <p>{label} location not available yet.</p>
      </div>
    );
  }

  const centLat = hasCustomer ? (kitchenLat + customerLat) / 2 : kitchenLat;
  const centLng = hasCustomer ? (kitchenLng + customerLng) / 2 : kitchenLng;

  return (
    <div className="km-wrap">
      <MapContainer
        center={[centLat, centLng]}
        zoom={13}
        className="km-map"
        style={{ height: `${height}px` }}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        <RecenterMap lat={centLat} lng={centLng} />

        {/* Kitchen pin */}
        <Marker position={[kitchenLat, kitchenLng]} icon={KITCHEN_ICON}>
          <Popup>
            <strong>🍽 {kitchenName || "Kitchen"}</strong>
            <br />Your food is prepared here
          </Popup>
        </Marker>

        {/* Customer pin */}
        {hasCustomer && (
          <Marker position={[customerLat, customerLng]} icon={CUSTOMER_ICON}>
            <Popup>
              <strong>🏠 Your location</strong>
              {customerAddress && <><br />{customerAddress}</>}
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Legend */}
      <div className="km-legend">
        <span className="km-legend-item">
          <span className="km-dot km-dot--kitchen" /> {label}
        </span>
        {hasCustomer && (
          <span className="km-legend-item">
            <span className="km-dot km-dot--customer" /> Your location
          </span>
        )}
      </div>
    </div>
  );
}