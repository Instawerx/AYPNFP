/* global importScripts, firebase */

// Import Firebase scripts
importScripts("https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js");

// Initialize Firebase in service worker
firebase.initializeApp({
  apiKey: "AIzaSyDWmfX1jYaIsFUucmyno6EBjdZNFTh6k_0",
  authDomain: "adopt-a-young-parent.firebaseapp.com",
  projectId: "adopt-a-young-parent",
  storageBucket: "adopt-a-young-parent.firebasestorage.app",
  messagingSenderId: "499950524793",
  appId: "1:499950524793:web:9016b05e3aa3cc795277a8",
  measurementId: "G-FGJDKEK435"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("Background message received:", payload);

  const notificationTitle = payload.notification?.title || "ADOPT A YOUNG PARENT";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: "/icon-192.png",
    badge: "/badge-72.png",
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event);
  event.notification.close();

  const data = event.notification.data;
  let url = "/";

  // Route based on notification type
  if (data?.type === "RECEIPT") {
    url = "/portal/donor";
  } else if (data?.type === "FUNDRAISER_MESSAGE") {
    url = "/portal/donor";
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
