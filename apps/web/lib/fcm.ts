import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { app } from "./firebase";

/**
 * Initialize FCM and request permission
 * Returns FCM token if successful
 */
export async function initFCM(): Promise<string | null> {
  try {
    // Check if FCM is supported
    if (!(await isSupported())) {
      console.log("FCM not supported in this browser");
      return null;
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission denied");
      return null;
    }

    const messaging = getMessaging(app);
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!vapidKey) {
      console.error("VAPID public key not configured");
      return null;
    }

    // Get FCM token
    const token = await getToken(messaging, { vapidKey });

    // Listen for foreground messages
    onMessage(messaging, (payload) => {
      console.log("FCM message received:", payload);
      
      // Show notification
      if (payload.notification) {
        new Notification(payload.notification.title || "Notification", {
          body: payload.notification.body,
          icon: "/icon-192.png",
        });
      }
    });

    return token;
  } catch (error) {
    console.error("Error initializing FCM:", error);
    return null;
  }
}

/**
 * Register FCM token for a donor
 */
export async function registerFCMToken(
  orgId: string,
  donorId: string,
  token: string
): Promise<void> {
  try {
    const response = await fetch("/api/fcm/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orgId,
        donorId,
        token,
        platform: "web",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to register FCM token");
    }

    console.log("FCM token registered successfully");
  } catch (error) {
    console.error("Error registering FCM token:", error);
  }
}
