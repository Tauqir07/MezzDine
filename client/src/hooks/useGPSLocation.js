import { useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/authContext";

export default function useGPSLocation() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || user.role !== "user") return;
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          await api.patch("/auth/location", { lat, lng });
        } catch {}
      },
      (err) => {
        console.log("[GPS] Location unavailable:", err.message);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  }, [user?._id]);
}