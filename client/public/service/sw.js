// public/sw.js — Service Worker
// Place this file in your client/public/ folder

self.addEventListener("push", function (event) {
  if (!event.data) return;

  const data = event.data.json();

  const title   = data.title   || "MeZzDiNe";
  const options = {
    body:    data.body    || "",
    icon:    data.icon    || "/icon.png",
    badge:   data.badge   || "/icon.png",
    data:    { url: data.url || "/" },
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {
      // if app is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // otherwise open a new tab
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});