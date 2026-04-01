// src/hooks/usePushNotifications.js
import { useEffect } from "react";
import api from "../api/axios";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw     = window.atob(base64);
  const arr     = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export default function usePushNotifications(user) {

  useEffect(() => {
    if (!user?._id) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    async function setup() {
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");

    const { data } = await api.get("/push/vapid-public-key");
    const applicationServerKey = urlBase64ToUint8Array(data.publicKey);

    // ← ADD THIS: force fresh subscription every time
    const existing = await reg.pushManager.getSubscription();
    if (existing) await existing.unsubscribe();

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey,
    });

    await api.post("/push/subscribe", { subscription });

  } catch (err) {
    console.log("[Push] Setup skipped:", err.message);
  }
}

    setup();
  }, [user?._id]);
}