"use client";

import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
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

function shouldUseGoogleRedirect() {
  if (typeof window === "undefined") {
    return false;
  }

  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const isiOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent);

  return isStandalone || isiOS;
}

function getFirebaseErrorCode(error: unknown) {
  return error && typeof error === "object" && "code" in error ? error.code : undefined;
}

function shouldFallbackToGoogleRedirect(error: unknown) {
  const code = getFirebaseErrorCode(error);

  return (
    code === "auth/popup-blocked" ||
    code === "auth/cancelled-popup-request" ||
    code === "auth/operation-not-supported-in-this-environment"
  );
}

export function getAuthErrorMessage(error: unknown, fallback = "Authentication failed.") {
  const code = getFirebaseErrorCode(error);

  if (code === "auth/unauthorized-domain") {
    return "This site URL is not authorized for Firebase Auth. Add the exact domain or local IP you are using on your phone in Firebase Authentication > Settings > Authorized domains.";
  }

  if (code === "auth/popup-closed-by-user") {
    return "Google sign in was closed before it finished.";
  }

  if (error instanceof Error) {
    return error.message;
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

  return saveUserProfile(user, user.displayName || user.email || "Aarav");
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

export async function completeGoogleRedirectSignIn() {
  const auth = await getAuthWithLocalPersistence();
  const credentials = await getRedirectResult(auth);

  if (!credentials) {
    return undefined;
  }

  return getOrCreateUserProfile(credentials.user);
}

export async function signInWithGoogle() {
  const auth = await getAuthWithLocalPersistence();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  if (shouldUseGoogleRedirect()) {
    await signInWithRedirect(auth, provider);
    return undefined;
  }

  const credentials = await signInWithPopup(auth, provider).catch(async (authError) => {
    if (shouldFallbackToGoogleRedirect(authError)) {
      await signInWithRedirect(auth, provider);
      return undefined;
    }

    throw authError;
  });

  if (!credentials) {
    return undefined;
  }

  return getOrCreateUserProfile(credentials.user);
}

export async function signOutUser() {
  const { auth } = getFirebaseServices();
  await signOut(auth);
}
