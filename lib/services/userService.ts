"use client";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseServices } from "@/lib/firebase/client";
import { firebaseCollections } from "@/lib/firebase/collections";
import type { SupportedDisplayName, UserProfile } from "@/lib/firebase/schema";

export function subscribeToAuthState(callback: (user: User | null) => void) {
  const { auth } = getFirebaseServices();
  return onAuthStateChanged(auth, callback);
}

export async function getUserProfile(userId: string) {
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

export async function saveUserProfile(user: User, displayName: SupportedDisplayName | string) {
  const { db } = getFirebaseServices();
  const profile: UserProfile = {
    id: user.uid,
    displayName,
    email: user.email,
    photoURL: user.photoURL,
  };

  await setDoc(
    doc(db, firebaseCollections.users, user.uid),
    {
      ...profile,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );

  return profile;
}

export async function signUpWithEmailPassword({
  displayName,
  email,
  password,
}: {
  displayName: SupportedDisplayName | string;
  email: string;
  password: string;
}) {
  const { auth } = getFirebaseServices();
  const credentials = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credentials.user, { displayName });
  return saveUserProfile(credentials.user, displayName);
}

export async function signInWithEmailPassword({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const { auth } = getFirebaseServices();
  const credentials = await signInWithEmailAndPassword(auth, email, password);
  const profile = await getUserProfile(credentials.user.uid);

  if (profile) {
    return profile;
  }

  return saveUserProfile(
    credentials.user,
    credentials.user.displayName || credentials.user.email || "Aarav",
  );
}

export async function signOutUser() {
  const { auth } = getFirebaseServices();
  await signOut(auth);
}
