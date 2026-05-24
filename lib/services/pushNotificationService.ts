"use client";

import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type MessagePayload,
} from "firebase/messaging";
import { getFirebaseServices } from "@/lib/firebase/client";
import { firebaseCollections } from "@/lib/firebase/collections";

const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export type PushNotificationState = {
  enabled: boolean;
  error?: string;
  permission: NotificationPermission | "unsupported";
  supported: boolean;
  token?: string;
  vapidKeyConfigured: boolean;
};

function isBrowser() {
  return typeof window !== "undefined" && typeof navigator !== "undefined";
}

function notificationPermission(): NotificationPermission | "unsupported" {
  if (!isBrowser() || !("Notification" in window)) {
    return "unsupported";
  }

  return Notification.permission;
}

async function supportsPushNotifications() {
  return (
    isBrowser() &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    (await isSupported().catch(() => false))
  );
}

async function pushTokenId(token: string) {
  const data = new TextEncoder().encode(token);
  const hash = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function getMessagingRegistration() {
  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  return registration;
}

async function getDevicePushToken() {
  if (!vapidKey) {
    throw new Error("Missing NEXT_PUBLIC_FIREBASE_VAPID_KEY.");
  }

  const { app } = getFirebaseServices();
  const messaging = getMessaging(app);
  const registration = await getMessagingRegistration();
  const token = await getToken(messaging, {
    serviceWorkerRegistration: registration,
    vapidKey,
  });

  if (!token) {
    throw new Error("Firebase did not return a push token for this device.");
  }

  return token;
}

function pushTokenRef(userId: string, tokenId: string) {
  const { db } = getFirebaseServices();
  return doc(
    db,
    firebaseCollections.users,
    userId,
    firebaseCollections.pushTokens,
    tokenId,
  );
}

export async function getPushNotificationState(userId?: string): Promise<PushNotificationState> {
  const supported = await supportsPushNotifications();
  const permission = notificationPermission();
  const baseState: PushNotificationState = {
    enabled: false,
    permission,
    supported,
    vapidKeyConfigured: Boolean(vapidKey),
  };

  if (!supported || !userId || permission !== "granted" || !vapidKey) {
    return baseState;
  }

  try {
    const token = await getDevicePushToken();
    const tokenId = await pushTokenId(token);
    const snapshot = await getDoc(pushTokenRef(userId, tokenId));

    return {
      ...baseState,
      enabled: snapshot.exists(),
      token,
    };
  } catch (error) {
    return {
      ...baseState,
      error: error instanceof Error ? error.message : "Unable to inspect push status.",
    };
  }
}

export async function enableDevicePushNotifications(userId: string) {
  const supported = await supportsPushNotifications();

  if (!supported || notificationPermission() === "unsupported") {
    throw new Error("This browser does not support web push notifications.");
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error("Notification permission was not granted for this device.");
  }

  const token = await getDevicePushToken();
  const tokenId = await pushTokenId(token);

  await setDoc(
    pushTokenRef(userId, tokenId),
    {
      token,
      userAgent: navigator.userAgent,
      userId,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );

  return token;
}

export async function disableDevicePushNotifications(userId: string) {
  if (!(await supportsPushNotifications()) || notificationPermission() !== "granted" || !vapidKey) {
    return;
  }

  const { app } = getFirebaseServices();
  const messaging = getMessaging(app);
  const token = await getDevicePushToken();
  const tokenId = await pushTokenId(token);

  await deleteDoc(pushTokenRef(userId, tokenId)).catch(() => undefined);
  await deleteToken(messaging).catch(() => undefined);
}

export async function subscribeToForegroundPushMessages(
  onPushMessage: (payload: MessagePayload) => void,
) {
  if (!(await supportsPushNotifications())) {
    return () => undefined;
  }

  const { app } = getFirebaseServices();
  const messaging = getMessaging(app);

  return onMessage(messaging, onPushMessage);
}
