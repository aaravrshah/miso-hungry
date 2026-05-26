"use client";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { getFirebaseServices } from "@/lib/firebase/client";
import { firebaseCollections } from "@/lib/firebase/collections";
import type {
  AppNotification,
  NotificationBin,
  NotificationCreateInput,
  NotificationPreferences,
  UserProfile,
} from "@/lib/firebase/schema";
import { removeUndefinedDeep } from "@/lib/services/helpers";
import { defaultNotificationPreferences } from "@/lib/services/userService";

function notificationFromDoc(id: string, data: Partial<AppNotification>): AppNotification {
  return {
    bin: data.bin ?? "recipeActivity",
    body: data.body ?? "",
    createdAt: data.createdAt,
    emoji: data.emoji ?? "🔔",
    href: data.href,
    id,
    isRead: Boolean(data.isRead),
    recipientId: data.recipientId ?? "",
    title: data.title ?? "Notification",
    type: data.type ?? "friend_posted_recipe",
    actor: data.actor,
    actorId: data.actorId,
    recipeId: data.recipeId,
  };
}

function notificationPreferences(profile?: Partial<UserProfile>): NotificationPreferences {
  return {
    ...defaultNotificationPreferences,
    ...(profile?.notificationPreferences ?? {}),
  };
}

async function recipientAllowsNotification(recipientId: string, bin: NotificationBin) {
  const { db } = getFirebaseServices();
  const snapshot = await getDoc(doc(db, firebaseCollections.users, recipientId));
  const profile = snapshot.exists() ? (snapshot.data() as Partial<UserProfile>) : undefined;

  return notificationPreferences(profile)[bin] !== false;
}

export async function createAppNotification(input: NotificationCreateInput) {
  if (!input.recipientId || input.actorId === input.recipientId) {
    return undefined;
  }

  if (!(await recipientAllowsNotification(input.recipientId, input.bin))) {
    return undefined;
  }

  const { db } = getFirebaseServices();
  const notification = removeUndefinedDeep({
    ...input,
    isRead: input.isRead ?? false,
    createdAt: serverTimestamp(),
  });
  const notificationRef = await addDoc(
    collection(db, firebaseCollections.notifications),
    notification,
  );

  return {
    id: notificationRef.id,
    ...input,
    isRead: input.isRead ?? false,
  } satisfies AppNotification;
}

export async function createAppNotifications(inputs: NotificationCreateInput[]) {
  const created = await Promise.all(inputs.map((input) => createAppNotification(input)));

  return created.filter((notification): notification is AppNotification =>
    Boolean(notification),
  );
}

export async function fetchNotifications(userId: string) {
  const { db } = getFirebaseServices();
  const snapshot = await getDocs(
    query(
      collection(db, firebaseCollections.notifications),
      where("recipientId", "==", userId),
    ),
  );

  return snapshot.docs
    .map((notificationDoc) =>
      notificationFromDoc(notificationDoc.id, notificationDoc.data()),
    )
    .sort((first, second) => {
      const firstDate =
        first.createdAt &&
        typeof first.createdAt === "object" &&
        "toMillis" in first.createdAt &&
        typeof first.createdAt.toMillis === "function"
          ? first.createdAt.toMillis()
          : 0;
      const secondDate =
        second.createdAt &&
        typeof second.createdAt === "object" &&
        "toMillis" in second.createdAt &&
        typeof second.createdAt.toMillis === "function"
          ? second.createdAt.toMillis()
          : 0;

      return secondDate - firstDate;
    })
    .slice(0, 80);
}

export async function markNotificationRead(notificationId: string) {
  const { db } = getFirebaseServices();

  await updateDoc(doc(db, firebaseCollections.notifications, notificationId), {
    isRead: true,
  });
}

export async function markAllNotificationsRead(userId: string) {
  const { db } = getFirebaseServices();
  const snapshot = await getDocs(
    query(
      collection(db, firebaseCollections.notifications),
      where("recipientId", "==", userId),
      where("isRead", "==", false),
    ),
  );
  const batch = writeBatch(db);

  snapshot.docs.forEach((notificationDoc) => {
    batch.update(notificationDoc.ref, { isRead: true });
  });

  await batch.commit();
}
