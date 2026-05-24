"use client";

import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
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

async function getAuthWithLocalPersistence() {
  const { auth } = getFirebaseServices();
  await setPersistence(auth, browserLocalPersistence);
  return auth;
}

function getFirebaseErrorCode(error: unknown) {
  return error && typeof error === "object" && "code" in error ? error.code : undefined;
}

export function getAuthErrorMessage(error: unknown, fallback = "Authentication failed.") {
  const code = getFirebaseErrorCode(error);

  if (code === "auth/unauthorized-domain") {
    return "This site URL is not authorized for Firebase Auth. Add the exact domain or local IP you are using on your phone in Firebase Authentication > Settings > Authorized domains.";
  }

  if (code === "auth/popup-blocked") {
    return "The Google sign-in popup was blocked. Allow popups for this site and try again.";
  }

  if (code === "auth/cancelled-popup-request") {
    return "Google sign in was interrupted by another sign-in attempt. Please try again.";
  }

  if (code === "auth/popup-closed-by-user") {
    return "Google sign in was closed before it finished.";
  }

  if (code === "auth/operation-not-supported-in-this-environment") {
    return "This browser cannot use the current Google sign-in method. Try Safari/Chrome directly instead of an embedded browser.";
  }

  if (code === "auth/account-exists-with-different-credential") {
    return "An account already exists with this email using another sign-in method. Sign in with the original method first, then link Google later.";
  }

  if (code === "auth/network-request-failed") {
    return "Google sign in could not reach Firebase. Check your connection and try again.";
  }

  if (error instanceof Error) {
    return code ? `${error.message} (${String(code)})` : error.message;
  }

  return fallback;
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

async function getOrCreateUserProfile(user: User) {
  const profile = await getUserProfile(user.uid);

  if (profile) {
    return profile;
  }

  return saveUserProfile(user, user.displayName || user.email || "Cook");
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
  const auth = await getAuthWithLocalPersistence();
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
  const auth = await getAuthWithLocalPersistence();
  const credentials = await signInWithEmailAndPassword(auth, email, password);
  return getOrCreateUserProfile(credentials.user);
}

export async function signInWithGoogle() {
  const auth = await getAuthWithLocalPersistence();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const credentials = await signInWithPopup(auth, provider);
  return getOrCreateUserProfile(credentials.user);
}

export async function signOutUser() {
  const { auth } = getFirebaseServices();
  await signOut(auth);
}
