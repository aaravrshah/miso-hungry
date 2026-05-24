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
import { useAuth } from "@/components/AuthProvider";
import type { FriendRequest, UserProfile, UserSummary } from "@/lib/firebase/schema";
import {
  acceptFriendRequest as acceptFriendRequestService,
  declineFriendRequest as declineFriendRequestService,
  fetchAllUserProfiles,
  fetchFriendRequests,
  fetchFriends,
  removeFriend as removeFriendService,
  sendFriendRequest as sendFriendRequestService,
} from "@/lib/services/socialService";

export type SocialContextValue = {
  allUsers: UserProfile[];
  error?: string;
  friends: UserSummary[];
  incomingRequests: FriendRequest[];
  isLoading: boolean;
  outgoingRequests: FriendRequest[];
  acceptFriendRequest: (requestId: string) => Promise<void>;
  declineFriendRequest: (requestId: string) => Promise<void>;
  isFriend: (userId?: string) => boolean;
  refreshSocialData: () => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  sendFriendRequest: (userId: string) => Promise<void>;
};

export const SocialContext = createContext<SocialContextValue | undefined>(undefined);

export function SocialProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [friends, setFriends] = useState<UserSummary[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const refreshSocialData = useCallback(async () => {
    if (!profile) {
      setAllUsers([]);
      setFriends([]);
      setIncomingRequests([]);
      setOutgoingRequests([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(undefined);

    try {
      const [nextUsers, nextFriends, requests] = await Promise.all([
        fetchAllUserProfiles(),
        fetchFriends(profile.id),
        fetchFriendRequests(profile.id),
      ]);
      setAllUsers(nextUsers);
      setFriends(nextFriends);
      setIncomingRequests(requests.incoming);
      setOutgoingRequests(requests.outgoing);
    } catch (socialError) {
      setError(
        socialError instanceof Error ? socialError.message : "Unable to load friends.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!active) {
        return;
      }

      await refreshSocialData();
    }

    window.queueMicrotask(() => {
      load();
    });

    return () => {
      active = false;
    };
  }, [refreshSocialData]);

  const sendFriendRequest = useCallback(
    async (userId: string) => {
      if (!profile) {
        throw new Error("You must be signed in to add friends.");
      }

      const toUser = allUsers.find((user) => user.id === userId);

      if (!toUser) {
        throw new Error("User not found.");
      }

      setError(undefined);
      await sendFriendRequestService({ currentUser: profile, toUser });
      await refreshSocialData();
    },
    [allUsers, profile, refreshSocialData],
  );

  const acceptFriendRequest = useCallback(
    async (requestId: string) => {
      if (!profile) {
        throw new Error("You must be signed in to accept friends.");
      }

      const request = incomingRequests.find((item) => item.id === requestId);

      if (!request) {
        throw new Error("Friend request not found.");
      }

      setError(undefined);
      await acceptFriendRequestService({ currentUser: profile, request });
      await refreshSocialData();
    },
    [incomingRequests, profile, refreshSocialData],
  );

  const declineFriendRequest = useCallback(
    async (requestId: string) => {
      if (!profile) {
        throw new Error("You must be signed in to change friend requests.");
      }

      const request =
        incomingRequests.find((item) => item.id === requestId) ??
        outgoingRequests.find((item) => item.id === requestId);

      if (!request) {
        throw new Error("Friend request not found.");
      }

      setError(undefined);
      await declineFriendRequestService({ currentUser: profile, request });
      await refreshSocialData();
    },
    [incomingRequests, outgoingRequests, profile, refreshSocialData],
  );

  const removeFriend = useCallback(
    async (friendId: string) => {
      if (!profile) {
        throw new Error("You must be signed in to remove friends.");
      }

      setError(undefined);
      await removeFriendService({ currentUserId: profile.id, friendId });
      await refreshSocialData();
    },
    [profile, refreshSocialData],
  );

  const isFriend = useCallback(
    (userId?: string) => Boolean(userId && friends.some((friend) => friend.id === userId)),
    [friends],
  );

  const value = useMemo(
    () => ({
      acceptFriendRequest,
      allUsers,
      declineFriendRequest,
      error,
      friends,
      incomingRequests,
      isFriend,
      isLoading,
      outgoingRequests,
      refreshSocialData,
      removeFriend,
      sendFriendRequest,
    }),
    [
      acceptFriendRequest,
      allUsers,
      declineFriendRequest,
      error,
      friends,
      incomingRequests,
      isFriend,
      isLoading,
      outgoingRequests,
      refreshSocialData,
      removeFriend,
      sendFriendRequest,
    ],
  );

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}

export function useSocial() {
  const context = useContext(SocialContext);

  if (!context) {
    throw new Error("useSocial must be used inside SocialProvider");
  }

  return context;
}
