"use client";

import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithCredential,
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

const googleWebClientId = process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const googleIdentityScriptSrc = "https://accounts.google.com/gsi/client";

type GoogleOAuthTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleOAuthTokenClient = {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
};

type GoogleIdentity = {
  accounts: {
    oauth2: {
      initTokenClient: (input: {
        callback: (response: GoogleOAuthTokenResponse) => void;
        client_id: string;
        error_callback?: (error: unknown) => void;
        prompt?: string;
        scope: string;
      }) => GoogleOAuthTokenClient;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

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

function shouldUseGoogleIdentityServices() {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(googleWebClientId) && !shouldUseGoogleRedirect();
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

  if (code === "auth/popup-blocked") {
    return "The Google sign-in popup was blocked. On mobile, use the full-page Google redirect flow; on desktop, allow popups for this site.";
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

function loadGoogleIdentityScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google sign in is only available in the browser."));
  }

  if (window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }

  const existingScript = document.querySelector<HTMLScriptElement>(
    `script[src="${googleIdentityScriptSrc}"]`,
  );

  if (existingScript) {
    return new Promise<void>((resolve, reject) => {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Unable to load Google sign in.")),
        { once: true },
      );
    });
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.src = googleIdentityScriptSrc;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Google sign in."));
    document.head.appendChild(script);
  });
}

export function preloadGoogleIdentityServices() {
  if (!shouldUseGoogleIdentityServices()) {
    return;
  }

  loadGoogleIdentityScript().catch(() => {
    // The interactive sign-in path will surface the load error if the user taps Google.
  });
}

async function signInWithGoogleIdentityServices() {
  if (!googleWebClientId) {
    throw new Error("Missing NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID.");
  }

  const auth = await getAuthWithLocalPersistence();
  await loadGoogleIdentityScript();

  const accessToken = await new Promise<string>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error("Google sign in timed out. Please try again."));
    }, 60000);

    const tokenClient = window.google?.accounts.oauth2.initTokenClient({
      callback: (response) => {
        window.clearTimeout(timeout);

        if (response.access_token) {
          resolve(response.access_token);
          return;
        }

        reject(
          new Error(
            response.error_description ||
              response.error ||
              "Google did not return a sign-in token.",
          ),
        );
      },
      client_id: googleWebClientId,
      error_callback: (error) => {
        window.clearTimeout(timeout);
        reject(error instanceof Error ? error : new Error("Google sign in failed."));
      },
      prompt: "select_account",
      scope: "openid email profile",
    });

    if (!tokenClient) {
      window.clearTimeout(timeout);
      reject(new Error("Google sign in is unavailable in this browser."));
      return;
    }

    tokenClient.requestAccessToken({ prompt: "select_account" });
  });

  const credential = GoogleAuthProvider.credential(null, accessToken);
  const credentials = await signInWithCredential(auth, credential);
  return getOrCreateUserProfile(credentials.user);
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

  if (shouldUseGoogleIdentityServices()) {
    return signInWithGoogleIdentityServices();
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
