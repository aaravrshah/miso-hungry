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
  completeGoogleRedirectSignIn,
  getAuthErrorMessage,
  getUserProfile,
  saveUserProfile,
  signInWithEmailPassword,
  signInWithGoogle as signInWithGoogleProvider,
  signOutUser,
  signUpWithEmailPassword,
  subscribeToAuthState,
} from "@/lib/services/userService";

type AuthContextValue = {
  error?: string;
  isConfigured: boolean;
  isLoading: boolean;
  missingConfig: readonly string[];
  profile?: UserProfile;
  signIn: (input: { email: string; password: string }) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (input: {
    displayName: SupportedDisplayName | string;
    email: string;
    password: string;
  }) => Promise<void>;
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
    completeGoogleRedirectSignIn()
      .then((userProfile) => {
        if (active && userProfile) {
          setProfile(userProfile);
          setIsLoading(false);
        }
      })
      .catch((authError) => {
        if (active) {
          setError(getAuthErrorMessage(authError, "Unable to complete Google sign in."));
          setIsLoading(false);
        }
      });

    const unsubscribe = subscribeToAuthState(async (user) => {
      setError(undefined);

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
          (await saveUserProfile(user, user.displayName || user.email || "Aarav"));
        if (active) {
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

  const signIn = useCallback(async (input: { email: string; password: string }) => {
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

  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      const userProfile = await signInWithGoogleProvider();
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
      signIn,
      signInWithGoogle,
      signOut,
      signUp,
    }),
    [error, isLoading, profile, signIn, signInWithGoogle, signOut, signUp],
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
