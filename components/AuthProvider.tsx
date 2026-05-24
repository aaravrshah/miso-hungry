"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { isFirebaseConfigured, missingFirebaseConfig } from "@/lib/firebase/client";
import type { SupportedDisplayName, UserProfile } from "@/lib/firebase/schema";
import {
  getAuthErrorMessage,
  getUserProfile,
  saveUserProfile,
  sendPasswordReset,
  signInWithEmailPassword,
  signInWithGoogle as signInWithGoogleProvider,
  signOutUser,
  signUpWithEmailPassword,
  subscribeToAuthState,
  updateDisplayName,
} from "@/lib/services/userService";

type AuthContextValue = {
  error?: string;
  isConfigured: boolean;
  isLoading: boolean;
  missingConfig: readonly string[];
  profile?: UserProfile;
  sendPasswordReset: (email: string) => Promise<void>;
  signIn: (input: {
    email: string;
    password: string;
    staySignedIn?: boolean;
  }) => Promise<void>;
  signInWithGoogle: (staySignedIn?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (input: {
    displayName: SupportedDisplayName | string;
    email: string;
    password: string;
    staySignedIn?: boolean;
  }) => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | undefined>();
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return;
    }

    let active = true;

    const unsubscribe = subscribeToAuthState(async (user) => {
      if (!user) {
        if (active) {
          setProfile(undefined);
          setIsLoading(false);
        }
        return;
      }

      try {
        const userProfile =
          (await getUserProfile(user.uid)) ??
          (await saveUserProfile(user, user.displayName || user.email || "Cook"));
        if (active) {
          setError(undefined);
          setProfile(userProfile);
          setIsLoading(false);
        }
      } catch (authError) {
        if (active) {
          setError(getAuthErrorMessage(authError, "Unable to load profile."));
          setIsLoading(false);
        }
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (input: {
    email: string;
    password: string;
    staySignedIn?: boolean;
  }) => {
    setIsLoading(true);
    setError(undefined);

    try {
      const userProfile = await signInWithEmailPassword(input);
      setProfile(userProfile);
    } catch (authError) {
      const message = getAuthErrorMessage(authError, "Unable to sign in.");
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setError(undefined);

    try {
      await sendPasswordReset(email);
    } catch (authError) {
      const message = getAuthErrorMessage(authError, "Unable to send password reset.");
      setError(message);
      throw new Error(message);
    }
  }, []);

  const saveDisplayName = useCallback(async (displayName: string) => {
    setError(undefined);

    try {
      const userProfile = await updateDisplayName(displayName);
      setProfile(userProfile);
    } catch (authError) {
      const message = getAuthErrorMessage(authError, "Unable to update profile.");
      setError(message);
      throw new Error(message);
    }
  }, []);

  const signInWithGoogle = useCallback(async (staySignedIn = true) => {
    setIsLoading(true);
    setError(undefined);

    try {
      const userProfile = await signInWithGoogleProvider(staySignedIn);
      setProfile(userProfile);
    } catch (authError) {
      const message = getAuthErrorMessage(authError, "Unable to sign in with Google.");
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(
    async (input: {
      displayName: SupportedDisplayName | string;
      email: string;
      password: string;
      staySignedIn?: boolean;
    }) => {
      setIsLoading(true);
      setError(undefined);

      try {
        const userProfile = await signUpWithEmailPassword(input);
        setProfile(userProfile);
      } catch (authError) {
        const message = getAuthErrorMessage(authError, "Unable to create account.");
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      await signOutUser();
      setProfile(undefined);
    } catch (authError) {
      setError(getAuthErrorMessage(authError, "Unable to sign out."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      error,
      isConfigured: isFirebaseConfigured,
      isLoading,
      missingConfig: missingFirebaseConfig,
      profile,
      sendPasswordReset: resetPassword,
      signIn,
      signInWithGoogle,
      signOut,
      signUp,
      updateDisplayName: saveDisplayName,
    }),
    [
      error,
      isLoading,
      profile,
      resetPassword,
      saveDisplayName,
      signIn,
      signInWithGoogle,
      signOut,
      signUp,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside FirebaseAuthProvider");
  }

  return context;
}
