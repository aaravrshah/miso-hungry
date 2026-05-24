"use client";

import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail as sendFirebasePasswordResetEmail,
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

async function getAuthWithPersistence(staySignedIn = true) {
  const { auth } = getFirebaseServices();
  await setPersistence(auth, staySignedIn ? browserLocalPersistence : browserSessionPersistence);
  return auth;
}

function getFirebaseErrorCode(error: unknown) {
  return error && typeof error === "object" && "code" in error ? error.code : undefined;
}

function isIosHomeScreenApp() {
  if (typeof window === "undefined") {
    return false;
  }

  const navigatorWithStandalone = window.navigator as Navigator & {
    standalone?: boolean;
  };
  const isAppleMobile =
    /iPad|iPhone|iPod/.test(window.navigator.userAgent) ||
    (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean(navigatorWithStandalone.standalone);

  return isAppleMobile && isStandalone;
}

function withGooglePopupTimeout<T>(promise: Promise<T>) {
  return new Promise<T>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(
        new Error(
          "Google sign in did not finish. On iPhone home-screen apps, open Miso Hungry in Safari to use Google sign in, or use email and password here.",
        ),
      );
    }, 30000);

    promise
      .then((result) => {
        window.clearTimeout(timeout);
        resolve(result);
      })
      .catch((error) => {
        window.clearTimeout(timeout);
        reject(error);
      });
  });
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

export async function updateDisplayName(displayName: string) {
  const { auth, db } = getFirebaseServices();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("You must be signed in to update your profile.");
  }

  const nextDisplayName = displayName.trim();

  if (!nextDisplayName) {
    throw new Error("Display name is required.");
  }

  await updateProfile(user, { displayName: nextDisplayName });
  await setDoc(
    doc(db, firebaseCollections.users, user.uid),
    {
      displayName: nextDisplayName,
      email: user.email,
      photoURL: user.photoURL,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return getOrCreateUserProfile(user);
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
  staySignedIn = true,
}: {
  displayName: SupportedDisplayName | string;
  email: string;
  password: string;
  staySignedIn?: boolean;
}) {
  const auth = await getAuthWithPersistence(staySignedIn);
  const credentials = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credentials.user, { displayName });
  return saveUserProfile(credentials.user, displayName);
}

export async function signInWithEmailPassword({
  email,
  password,
  staySignedIn = true,
}: {
  email: string;
  password: string;
  staySignedIn?: boolean;
}) {
  const auth = await getAuthWithPersistence(staySignedIn);
  const credentials = await signInWithEmailAndPassword(auth, email, password);
  return getOrCreateUserProfile(credentials.user);
}

export async function sendPasswordReset(email: string) {
  const { auth } = getFirebaseServices();
  await sendFirebasePasswordResetEmail(auth, email);
}

export async function signInWithGoogle(staySignedIn = true) {
  if (isIosHomeScreenApp()) {
    throw new Error(
      "Google sign in does not reliably complete inside iPhone home-screen apps. Open Miso Hungry in Safari to sign in with Google, or use email and password here.",
    );
  }

  const auth = await getAuthWithPersistence(staySignedIn);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const credentials = await withGooglePopupTimeout(signInWithPopup(auth, provider));
  return getOrCreateUserProfile(credentials.user);
}

export async function signOutUser() {
  const { auth } = getFirebaseServices();
  await signOut(auth);
}
