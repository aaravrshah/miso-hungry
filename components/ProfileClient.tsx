"use client";

import { ArrowLeft, Check, Handshake, Settings, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { RecipeGrid } from "@/components/RecipeGrid";
import { useRecipes } from "@/components/RecipeStore";
import { useSocial } from "@/components/SocialProvider";
import { UserAvatar } from "@/components/UserAvatar";
import type { UserProfile, UserSummary } from "@/lib/firebase/schema";
import { fetchFriends } from "@/lib/services/socialService";

type ProfileClientProps = {
  userId: string;
};

function displayNameForUser(user?: Pick<UserProfile, "displayName" | "email"> | UserSummary) {
  return String(user?.displayName || user?.email || "Cook");
}

export function ProfileClient({ userId }: ProfileClientProps) {
  const { profile: currentUser } = useAuth();
  const { recipes } = useRecipes();
  const {
    allUsers,
    error,
    friends,
    incomingRequests,
    isFriend,
    isLoading,
    outgoingRequests,
    sendFriendRequest,
  } = useSocial();
  const [actionError, setActionError] = useState<string | undefined>();
  const [isSending, setIsSending] = useState(false);
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);
  const [isLoadingProfileFriends, setIsLoadingProfileFriends] = useState(false);
  const [profileFriends, setProfileFriends] = useState<UserSummary[]>([]);
  const [workingFriendId, setWorkingFriendId] = useState<string | undefined>();
  const profile =
    allUsers.find((user) => user.id === userId) ??
    (currentUser?.id === userId ? currentUser : undefined);
  const displayName = displayNameForUser(profile);
  const currentFriendIds = useMemo(
    () => new Set(friends.map((friend) => friend.id)),
    [friends],
  );
  const incomingIds = useMemo(
    () => new Set(incomingRequests.map((request) => request.fromUserId)),
    [incomingRequests],
  );
  const outgoingIds = useMemo(
    () => new Set(outgoingRequests.map((request) => request.toUserId)),
    [outgoingRequests],
  );
  const userLookup = useMemo(
    () => new Map(allUsers.map((user) => [user.id, user])),
    [allUsers],
  );
  const viewedFriends = useMemo(
    () =>
      profileFriends.map((friend) => {
        const latestProfile = userLookup.get(friend.id);

        return latestProfile
          ? {
              ...friend,
              displayName: displayNameForUser(latestProfile),
              email: latestProfile.email,
              photoURL: latestProfile.photoURL,
              username: latestProfile.username,
            }
          : friend;
      }),
    [profileFriends, userLookup],
  );
  const ownedRecipes = useMemo(
    () => recipes.filter((recipe) => recipe.createdBy === userId),
    [recipes, userId],
  );
  const collaborationRecipes = useMemo(
    () =>
      recipes.filter(
        (recipe) =>
          recipe.createdBy !== userId && recipe.collaboratorIds?.includes(userId),
      ),
    [recipes, userId],
  );
  const outgoingRequest = outgoingRequests.find((request) => request.toUserId === userId);
  const incomingRequest = incomingRequests.find((request) => request.fromUserId === userId);
  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    if (!profile) {
      return;
    }

    let active = true;

    window.queueMicrotask(() => {
      if (!active) {
        return;
      }

      setIsLoadingProfileFriends(true);

      fetchFriends(userId)
        .then((nextFriends) => {
          if (active) {
            setProfileFriends(nextFriends);
          }
        })
        .catch((friendsError) => {
          if (active) {
            setActionError(
              friendsError instanceof Error
                ? friendsError.message
                : "Unable to load this friends list.",
            );
          }
        })
        .finally(() => {
          if (active) {
            setIsLoadingProfileFriends(false);
          }
        });
    });

    return () => {
      active = false;
    };
  }, [profile, userId]);

  async function requestFriendship(targetUserId = userId) {
    setIsSending(targetUserId === userId);
    setWorkingFriendId(targetUserId === userId ? undefined : targetUserId);
    setActionError(undefined);

    try {
      await sendFriendRequest(targetUserId);
    } catch (friendError) {
      setActionError(
        friendError instanceof Error ? friendError.message : "Unable to send request.",
      );
    } finally {
      setIsSending(false);
      setWorkingFriendId(undefined);
    }
  }

  if (!profile && isLoading) {
    return (
      <p className="rounded-lg border border-stone-200 bg-white/72 p-4 text-sm font-semibold text-stone-600">
        Loading profile...
      </p>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-4 rounded-lg border border-stone-200 bg-white/72 p-6 shadow-sm">
        <h1 className="font-serif text-3xl text-stone-950">Profile not found</h1>
        <p className="text-sm leading-6 text-stone-600">
          This person may not have signed into Miso Hungry yet.
        </p>
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--tomato)] px-4 text-sm font-bold text-white"
          href="/friends"
        >
          Back to friends
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link
        className="inline-flex items-center gap-2 text-sm font-bold text-[var(--tomato)]"
        href="/friends"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Friends
      </Link>

      {actionError || error ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
          {actionError ?? error}
        </p>
      ) : null}

      <section className="rounded-lg border border-stone-200 bg-white/76 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <UserAvatar
              displayName={displayName}
              photoURL={profile.photoURL}
              size="xl"
            />
            <div className="min-w-0">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--tomato)]">
                {isOwnProfile ? "Your profile" : isFriend(userId) ? "Friend" : "Profile"}
              </p>
              <h1 className="truncate font-serif text-4xl leading-tight text-stone-950 sm:text-5xl">
                {displayName}
              </h1>
              <div className="mt-2 space-y-1 text-sm font-semibold text-stone-500">
                {profile.username ? <p>@{profile.username}</p> : null}
                {profile.email ? <p className="truncate">{profile.email}</p> : null}
              </div>
            </div>
          </div>

          {isOwnProfile ? (
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 shadow-sm"
              href="/settings"
            >
              <Settings aria-hidden="true" className="h-4 w-4" />
              Edit profile
            </Link>
          ) : isFriend(userId) ? (
            <span className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-50 px-4 text-sm font-bold text-emerald-700 ring-1 ring-emerald-200">
              <Handshake aria-hidden="true" className="h-4 w-4" />
              Friends
            </span>
          ) : outgoingRequest ? (
            <span className="inline-flex min-h-11 items-center justify-center rounded-lg bg-stone-100 px-4 text-sm font-bold text-stone-600">
              Request pending
            </span>
          ) : incomingRequest ? (
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-amber-50 px-4 text-sm font-bold text-amber-700 ring-1 ring-amber-200"
              href="/friends"
            >
              Respond in Friends
            </Link>
          ) : (
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--tomato)] px-4 text-sm font-bold text-white"
              disabled={isSending}
              onClick={() => requestFriendship()}
              type="button"
            >
              <UserPlus aria-hidden="true" className="h-4 w-4" />
              {isSending ? "Sending..." : "Add friend"}
            </button>
          )}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <button
            className="rounded-lg border border-stone-200 bg-white/80 p-4 text-left shadow-sm transition hover:bg-white"
            onClick={() => setIsFriendsOpen(true)}
            type="button"
          >
            <span className="block font-serif text-3xl text-stone-950">
              {isLoadingProfileFriends ? "..." : viewedFriends.length}
            </span>
            <span className="mt-1 block text-sm font-bold text-stone-500">friends</span>
          </button>
          <div className="rounded-lg border border-stone-200 bg-white/80 p-4 shadow-sm">
            <span className="block font-serif text-3xl text-stone-950">
              {ownedRecipes.length}
            </span>
            <span className="mt-1 block text-sm font-bold text-stone-500">recipes</span>
          </div>
          <div className="rounded-lg border border-stone-200 bg-white/80 p-4 shadow-sm">
            <span className="block font-serif text-3xl text-stone-950">
              {collaborationRecipes.length}
            </span>
            <span className="mt-1 block text-sm font-bold text-stone-500">
              collaborations
            </span>
          </div>
        </div>

        {profile.bio ? (
          <p className="mt-5 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-stone-700">
            {profile.bio}
          </p>
        ) : null}
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-3xl text-stone-950">Recipes</h2>
            <p className="mt-1 text-sm text-stone-600">
              Recipes {displayName} has shared with the cookbook.
            </p>
          </div>
        </div>
        <RecipeGrid
          emptyText="When they add recipes, they will appear here."
          emptyTitle="No recipes yet"
          recipes={ownedRecipes}
        />
      </section>

      {collaborationRecipes.length > 0 ? (
        <section className="space-y-4">
          <h2 className="font-serif text-3xl text-stone-950">Collaborating on</h2>
          <RecipeGrid recipes={collaborationRecipes} />
        </section>
      ) : null}

      {isFriendsOpen ? (
        <FriendsListDialog
          currentFriendIds={currentFriendIds}
          currentUserId={currentUser?.id}
          incomingIds={incomingIds}
          isLoading={isLoadingProfileFriends}
          onAddFriend={requestFriendship}
          onClose={() => setIsFriendsOpen(false)}
          outgoingIds={outgoingIds}
          ownerName={displayName}
          users={viewedFriends}
          workingFriendId={workingFriendId}
        />
      ) : null}
    </div>
  );
}

type FriendsListDialogProps = {
  currentFriendIds: Set<string>;
  currentUserId?: string;
  incomingIds: Set<string>;
  isLoading: boolean;
  onAddFriend: (userId: string) => Promise<void>;
  onClose: () => void;
  outgoingIds: Set<string>;
  ownerName: string;
  users: UserSummary[];
  workingFriendId?: string;
};

function FriendsListDialog({
  currentFriendIds,
  currentUserId,
  incomingIds,
  isLoading,
  onAddFriend,
  onClose,
  outgoingIds,
  ownerName,
  users,
  workingFriendId,
}: FriendsListDialogProps) {
  return (
    <div className="fixed inset-0 z-50 bg-stone-950/35 p-4 backdrop-blur-sm">
      <button
        aria-label="Close friends list"
        className="absolute inset-0 h-full w-full"
        onClick={onClose}
        type="button"
      />
      <section className="relative mx-auto mt-[calc(3rem+env(safe-area-inset-top))] max-h-[min(42rem,calc(100vh-6rem))] max-w-xl overflow-hidden rounded-lg border border-stone-200 bg-[#fffaf1] shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b border-stone-200 p-4">
          <div className="min-w-0">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--tomato)]">
              Friends
            </p>
            <h2 className="truncate font-serif text-3xl leading-tight text-stone-950">
              {ownerName}
            </h2>
          </div>
          <button
            aria-label="Close friends list"
            className="grid min-h-10 min-w-10 place-items-center rounded-lg border border-stone-200 bg-white text-stone-500"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[calc(min(42rem,100vh-6rem)-6rem)] overflow-y-auto p-4">
          {isLoading ? (
            <p className="rounded-lg border border-stone-200 bg-white/80 p-4 text-sm font-semibold text-stone-600">
              Loading friends...
            </p>
          ) : null}

          {!isLoading && users.length === 0 ? (
            <p className="rounded-lg border border-dashed border-stone-300 bg-white/70 p-4 text-sm leading-6 text-stone-600">
              No friends to show yet.
            </p>
          ) : null}

          <div className="space-y-3">
            {users.map((user) => {
              const displayName = displayNameForUser(user);

              return (
                <article
                  className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white/80 p-3 shadow-sm"
                  key={user.id}
                >
                  <UserAvatar
                    displayName={displayName}
                    photoURL={user.photoURL}
                    size="md"
                  />
                  <Link
                    className="min-w-0 flex-1"
                    href={`/profiles/${user.id}`}
                    onClick={onClose}
                  >
                    <p className="truncate font-serif text-xl leading-tight text-stone-950">
                      {displayName}
                    </p>
                    {user.username ? (
                      <p className="truncate text-sm font-semibold text-stone-500">
                        @{user.username}
                      </p>
                    ) : null}
                  </Link>

                  {currentUserId === user.id ? (
                    <span className="inline-flex min-h-10 items-center justify-center rounded-lg bg-stone-100 px-3 text-xs font-bold text-stone-500">
                      You
                    </span>
                  ) : currentFriendIds.has(user.id) ? (
                    <span className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg bg-emerald-50 px-3 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                      <Check aria-hidden="true" className="h-3.5 w-3.5" />
                      Friends
                    </span>
                  ) : outgoingIds.has(user.id) ? (
                    <span className="inline-flex min-h-10 items-center justify-center rounded-lg bg-stone-100 px-3 text-xs font-bold text-stone-500">
                      Pending
                    </span>
                  ) : incomingIds.has(user.id) ? (
                    <Link
                      className="inline-flex min-h-10 items-center justify-center rounded-lg bg-amber-50 px-3 text-xs font-bold text-amber-700 ring-1 ring-amber-200"
                      href="/friends"
                    >
                      Respond
                    </Link>
                  ) : (
                    <button
                      className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg bg-[var(--tomato)] px-3 text-xs font-bold text-white"
                      disabled={workingFriendId === user.id}
                      onClick={() => onAddFriend(user.id)}
                      type="button"
                    >
                      <UserPlus aria-hidden="true" className="h-3.5 w-3.5" />
                      {workingFriendId === user.id ? "Adding..." : "Add"}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
