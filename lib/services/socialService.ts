"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { getFirebaseServices } from "@/lib/firebase/client";
import { firebaseCollections } from "@/lib/firebase/collections";
import type {
  FriendRequest,
  Friendship,
  UserProfile,
  UserSummary,
} from "@/lib/firebase/schema";
import { removeUndefinedDeep } from "@/lib/services/helpers";
import { createAppNotification } from "@/lib/services/notificationService";

export function userSummaryFromProfile(profile: UserProfile): UserSummary {
  return removeUndefinedDeep({
    id: profile.id,
    displayName: String(profile.displayName || profile.email || "Cook"),
    email: profile.email,
    username: profile.username,
    photoURL: profile.photoURL,
  });
}

function friendRequestFromDoc(id: string, data: Partial<FriendRequest>): FriendRequest {
  return {
    id,
    fromUser: data.fromUser ?? {
      id: data.fromUserId ?? "",
      displayName: "Someone",
    },
    fromUserId: data.fromUserId ?? data.fromUser?.id ?? "",
    status: data.status ?? "pending",
    toUser: data.toUser ?? {
      id: data.toUserId ?? "",
      displayName: "Someone",
    },
    toUserId: data.toUserId ?? data.toUser?.id ?? "",
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

function friendshipIdForUsers(firstUserId: string, secondUserId: string) {
  return [firstUserId, secondUserId].sort().join("__");
}

function friendshipFromDoc(id: string, data: Partial<Friendship>): Friendship {
  return {
    id,
    userIds: data.userIds ?? [],
    users: data.users ?? {},
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function fetchAllUserProfiles() {
  const { db } = getFirebaseServices();
  const snapshot = await getDocs(collection(db, firebaseCollections.users));

  return snapshot.docs
    .map((userDoc) => ({
      id: userDoc.id,
      ...userDoc.data(),
    }) as UserProfile)
    .sort((first, second) =>
      String(first.displayName).localeCompare(String(second.displayName)),
    );
}

export async function fetchUserProfileById(userId: string) {
  const { db } = getFirebaseServices();
  const snapshot = await getDoc(doc(db, firebaseCollections.users, userId));

  if (!snapshot.exists()) {
    return undefined;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as UserProfile;
}

export async function fetchFriendships(userId: string) {
  const { db } = getFirebaseServices();
  const snapshot = await getDocs(
    query(
      collection(db, firebaseCollections.friendships),
      where("userIds", "array-contains", userId),
    ),
  );

  return snapshot.docs.map((friendshipDoc) =>
    friendshipFromDoc(friendshipDoc.id, friendshipDoc.data()),
  );
}

export async function fetchFriends(userId: string) {
  const friendships = await fetchFriendships(userId);

  return friendships
    .map((friendship) => {
      const friendId = friendship.userIds.find((id) => id !== userId);
      return friendId ? friendship.users[friendId] : undefined;
    })
    .filter((friend): friend is UserSummary => Boolean(friend))
    .sort((first, second) => first.displayName.localeCompare(second.displayName));
}

export async function fetchFriendRequests(userId: string) {
  const { db } = getFirebaseServices();
  const [incomingSnapshot, outgoingSnapshot] = await Promise.all([
    getDocs(
      query(
        collection(db, firebaseCollections.friendRequests),
        where("toUserId", "==", userId),
        where("status", "==", "pending"),
      ),
    ),
    getDocs(
      query(
        collection(db, firebaseCollections.friendRequests),
        where("fromUserId", "==", userId),
        where("status", "==", "pending"),
      ),
    ),
  ]);

  return {
    incoming: incomingSnapshot.docs.map((requestDoc) =>
      friendRequestFromDoc(requestDoc.id, requestDoc.data()),
    ),
    outgoing: outgoingSnapshot.docs.map((requestDoc) =>
      friendRequestFromDoc(requestDoc.id, requestDoc.data()),
    ),
  };
}

async function findPendingFriendRequest(firstUserId: string, secondUserId: string) {
  const { db } = getFirebaseServices();
  const snapshot = await getDocs(collection(db, firebaseCollections.friendRequests));

  return snapshot.docs
    .map((requestDoc) => friendRequestFromDoc(requestDoc.id, requestDoc.data()))
    .find(
      (request) =>
        request.status === "pending" &&
        ((request.fromUserId === firstUserId && request.toUserId === secondUserId) ||
          (request.fromUserId === secondUserId && request.toUserId === firstUserId)),
    );
}

export async function sendFriendRequest({
  currentUser,
  toUser,
}: {
  currentUser: UserProfile;
  toUser: UserProfile;
}) {
  if (currentUser.id === toUser.id) {
    throw new Error("You cannot add yourself as a friend.");
  }

  const { db } = getFirebaseServices();
  const friendshipId = friendshipIdForUsers(currentUser.id, toUser.id);
  const existingFriendship = await getDoc(
    doc(db, firebaseCollections.friendships, friendshipId),
  );

  if (existingFriendship.exists()) {
    throw new Error("You are already friends.");
  }

  const existingRequest = await findPendingFriendRequest(currentUser.id, toUser.id);

  if (existingRequest) {
    throw new Error("A friend request is already pending.");
  }

  const request: Omit<FriendRequest, "id"> = {
    fromUser: userSummaryFromProfile(currentUser),
    fromUserId: currentUser.id,
    status: "pending",
    toUser: userSummaryFromProfile(toUser),
    toUserId: toUser.id,
  };
  const requestRef = await addDoc(
    collection(db, firebaseCollections.friendRequests),
    removeUndefinedDeep({
      ...request,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );

  await createAppNotification({
    actor: userSummaryFromProfile(currentUser),
    actorId: currentUser.id,
    bin: "social",
    body: `${currentUser.displayName} wants to be friends on Miso Hungry.`,
    emoji: "👋",
    href: "/friends",
    recipientId: toUser.id,
    title: "Friend request received",
    type: "friend_request_received",
  }).catch(() => undefined);

  return {
    id: requestRef.id,
    ...request,
  };
}

export async function acceptFriendRequest({
  currentUser,
  request,
}: {
  currentUser: UserProfile;
  request: FriendRequest;
}) {
  if (request.toUserId !== currentUser.id) {
    throw new Error("Only the recipient can accept this friend request.");
  }

  const { db } = getFirebaseServices();
  const friendshipId = friendshipIdForUsers(request.fromUserId, request.toUserId);
  const userIds = [request.fromUserId, request.toUserId].sort();

  await Promise.all([
    setDoc(
      doc(db, firebaseCollections.friendships, friendshipId),
      removeUndefinedDeep({
        userIds,
        users: {
          [request.fromUserId]: request.fromUser,
          [request.toUserId]: userSummaryFromProfile(currentUser),
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    ),
    updateDoc(doc(db, firebaseCollections.friendRequests, request.id), {
      status: "accepted",
      updatedAt: serverTimestamp(),
    }),
  ]);

  await createAppNotification({
    actor: userSummaryFromProfile(currentUser),
    actorId: currentUser.id,
    bin: "social",
    body: `${currentUser.displayName} accepted your friend request.`,
    emoji: "🥂",
    href: `/profiles/${currentUser.id}`,
    recipientId: request.fromUserId,
    title: "Friend request accepted",
    type: "friend_request_accepted",
  }).catch(() => undefined);
}

export async function declineFriendRequest({
  currentUser,
  request,
}: {
  currentUser: UserProfile;
  request: FriendRequest;
}) {
  if (request.toUserId !== currentUser.id && request.fromUserId !== currentUser.id) {
    throw new Error("You cannot change this friend request.");
  }

  const { db } = getFirebaseServices();
  await updateDoc(doc(db, firebaseCollections.friendRequests, request.id), {
    status: "declined",
    updatedAt: serverTimestamp(),
  });
}

export async function removeFriend({
  currentUserId,
  friendId,
}: {
  currentUserId: string;
  friendId: string;
}) {
  const { db } = getFirebaseServices();
  await deleteDoc(
    doc(db, firebaseCollections.friendships, friendshipIdForUsers(currentUserId, friendId)),
  );
}
