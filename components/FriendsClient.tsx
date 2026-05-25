"use client";

import { BookOpen, Check, ChevronRight, Search, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { RecipeGrid } from "@/components/RecipeGrid";
import { useRecipes } from "@/components/RecipeStore";
import { useSocial } from "@/components/SocialProvider";
import { UserAvatar } from "@/components/UserAvatar";
import type { UserProfile, UserSummary } from "@/lib/firebase/schema";

function profileMatches(profile: UserProfile, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return [profile.displayName, profile.username, profile.email]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(normalizedQuery);
}

export function FriendsClient() {
  const { profile } = useAuth();
  const {
    acceptCollaborationInvite,
    collaborationInvites,
    declineCollaborationInvite,
    friendRecipes,
  } = useRecipes();
  const {
    acceptFriendRequest,
    allUsers,
    declineFriendRequest,
    error,
    friends,
    incomingRequests,
    isFriend,
    isLoading,
    outgoingRequests,
    sendFriendRequest,
  } = useSocial();
  const [actionError, setActionError] = useState<string | undefined>();
  const [query, setQuery] = useState("");
  const [workingId, setWorkingId] = useState<string | undefined>();

  const friendIds = useMemo(() => new Set(friends.map((friend) => friend.id)), [friends]);
  const incomingIds = useMemo(
    () => new Set(incomingRequests.map((request) => request.fromUserId)),
    [incomingRequests],
  );
  const outgoingIds = useMemo(
    () => new Set(outgoingRequests.map((request) => request.toUserId)),
    [outgoingRequests],
  );
  const people = useMemo(
    () =>
      allUsers
        .filter((user) => user.id !== profile?.id)
        .filter((user) => profileMatches(user, query)),
    [allUsers, profile?.id, query],
  );
  const recipesFromFriends = useMemo(
    () =>
      friendRecipes.filter((recipe) => recipe.createdBy && friendIds.has(recipe.createdBy)),
    [friendIds, friendRecipes],
  );

  async function runAction(actionId: string, action: () => Promise<void>) {
    setWorkingId(actionId);
    setActionError(undefined);

    try {
      await action();
    } catch (friendError) {
      setActionError(
        friendError instanceof Error ? friendError.message : "Unable to update friends.",
      );
    } finally {
      setWorkingId(undefined);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-7">
      <section className="rounded-lg border border-stone-200 bg-white/74 p-3 shadow-sm sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--tomato)] sm:text-sm">
              Friends
            </p>
            <h1 className="mt-0.5 font-serif text-2xl leading-tight text-stone-950 sm:mt-2 sm:text-5xl">
              Friends
            </h1>
            <p className="mt-2 hidden max-w-2xl text-sm leading-6 text-stone-600 sm:block">
              Add friends, visit profiles, try their recipes, and collaborate on keepers.
            </p>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-2">
            <FriendStat label="friends" value={friends.length} />
            <FriendStat label="requests" value={incomingRequests.length} />
          </div>
        </div>
      </section>

      {actionError || error ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
          {actionError ?? error}
        </p>
      ) : null}

      {collaborationInvites.incoming.length > 0 ? (
        <section className="space-y-2 sm:space-y-3">
          <h2 className="font-serif text-xl text-stone-950 sm:text-3xl">Collaboration invites</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {collaborationInvites.incoming.map((invite) => (
              <article
                className="rounded-lg border border-stone-200 bg-white/76 p-3 shadow-sm sm:p-4"
                key={invite.id}
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#fff4e4] text-[var(--tomato)]">
                    <BookOpen aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-serif text-xl leading-tight text-stone-950">
                      {invite.recipeTitle}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-stone-500">
                      {invite.fromUser.displayName} invited you to collaborate.
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2 sm:mt-4">
                  <button
                    className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--tomato)] px-3 text-sm font-bold text-white"
                    disabled={workingId === invite.id}
                    onClick={() =>
                      runAction(invite.id, () => acceptCollaborationInvite(invite.id))
                    }
                    type="button"
                  >
                    <Check aria-hidden="true" className="h-4 w-4" />
                    Accept
                  </button>
                  <button
                    className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm font-bold text-stone-600"
                    disabled={workingId === invite.id}
                    onClick={() =>
                      runAction(invite.id, () => declineCollaborationInvite(invite.id))
                    }
                    type="button"
                  >
                    <X aria-hidden="true" className="h-4 w-4" />
                    Decline
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {collaborationInvites.outgoing.length > 0 ? (
        <section className="space-y-2 sm:space-y-3">
          <h2 className="font-serif text-xl text-stone-950 sm:text-3xl">Pending recipe invites</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {collaborationInvites.outgoing.map((invite) => (
              <article
                className="rounded-lg border border-stone-200 bg-white/76 p-3 shadow-sm sm:p-4"
                key={invite.id}
              >
                <p className="font-serif text-xl leading-tight text-stone-950">
                  {invite.recipeTitle}
                </p>
                <p className="mt-1 text-sm font-semibold text-stone-500">
                  Waiting on {invite.toUser.displayName}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {incomingRequests.length > 0 ? (
        <section className="space-y-2 sm:space-y-3">
          <h2 className="font-serif text-xl text-stone-950 sm:text-3xl">Friend requests</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {incomingRequests.map((request) => (
              <article
                className="rounded-lg border border-stone-200 bg-white/76 p-3 shadow-sm sm:p-4"
                key={request.id}
              >
                <UserLine user={request.fromUser} />
                <div className="mt-3 flex gap-2 sm:mt-4">
                  <button
                    className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--tomato)] px-3 text-sm font-bold text-white"
                    disabled={workingId === request.id}
                    onClick={() =>
                      runAction(request.id, () => acceptFriendRequest(request.id))
                    }
                    type="button"
                  >
                    <Check aria-hidden="true" className="h-4 w-4" />
                    Accept
                  </button>
                  <button
                    className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm font-bold text-stone-600"
                    disabled={workingId === request.id}
                    onClick={() =>
                      runAction(request.id, () => declineFriendRequest(request.id))
                    }
                    type="button"
                  >
                    <X aria-hidden="true" className="h-4 w-4" />
                    Decline
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-2 sm:space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-serif text-xl text-stone-950 sm:text-3xl">Your friends</h2>
            <p className="mt-1 hidden text-sm text-stone-600 sm:block">
              Friends can discover your recipes. Collaborators can edit recipes you invite them to.
            </p>
          </div>
        </div>
        {isLoading && friends.length === 0 ? (
          <p className="rounded-lg border border-stone-200 bg-white/72 p-4 text-sm font-semibold text-stone-600">
            Loading friends...
          </p>
        ) : null}
        {!isLoading && friends.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone-300 bg-white/70 p-4 text-sm leading-6 text-stone-600">
            No friends yet. Search for someone below and send the first request.
          </p>
        ) : null}
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {friends.map((friend) => (
            <FriendProfileLink friend={friend} key={friend.id} />
          ))}
        </div>
      </section>

      <section className="space-y-3 sm:space-y-4">
        <div>
          <h2 className="font-serif text-xl text-stone-950 sm:text-3xl">Find people</h2>
          <p className="mt-1 hidden text-sm text-stone-600 sm:block">
            Search by display name or email to send a friend request.
          </p>
        </div>
        <label className="relative block">
          <span className="sr-only">Search people</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400"
          />
          <input
            className="h-11 w-full rounded-lg border border-stone-200 bg-white/82 pl-12 pr-4 text-base text-stone-950 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-[var(--tomato)] focus:ring-4 focus:ring-red-100 sm:h-12"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search users"
            type="search"
            value={query}
          />
        </label>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {people.map((person) => (
            <article
              className="rounded-lg border border-stone-200 bg-white/76 p-3 shadow-sm sm:p-4"
              key={person.id}
            >
              <UserLine user={person} />
              <div className="mt-3 flex gap-2 sm:mt-4">
                <Link
                  className="inline-flex min-h-10 flex-1 items-center justify-center rounded-lg border border-stone-200 bg-white px-3 text-sm font-bold text-stone-700"
                  href={`/profiles/${person.id}`}
                >
                  View
                </Link>
                {isFriend(person.id) ? (
                  <span className="inline-flex min-h-10 flex-1 items-center justify-center rounded-lg bg-stone-100 px-3 text-sm font-bold text-stone-500">
                    Friends
                  </span>
                ) : incomingIds.has(person.id) ? (
                  <span className="inline-flex min-h-10 flex-1 items-center justify-center rounded-lg bg-amber-50 px-3 text-sm font-bold text-amber-700">
                    Requested you
                  </span>
                ) : outgoingIds.has(person.id) ? (
                  <span className="inline-flex min-h-10 flex-1 items-center justify-center rounded-lg bg-stone-100 px-3 text-sm font-bold text-stone-500">
                    Pending
                  </span>
                ) : (
                  <button
                    className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--tomato)] px-3 text-sm font-bold text-white"
                    disabled={workingId === person.id}
                    onClick={() =>
                      runAction(person.id, () => sendFriendRequest(person.id))
                    }
                    type="button"
                  >
                    <UserPlus aria-hidden="true" className="h-4 w-4" />
                    Add
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {recipesFromFriends.length > 0 ? (
        <section className="space-y-4">
          <h2 className="font-serif text-xl text-stone-950 sm:text-3xl">Recipes from friends</h2>
          <RecipeGrid recipes={recipesFromFriends.slice(0, 6)} />
        </section>
      ) : null}
    </div>
  );
}

function FriendStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-16 rounded-lg border border-stone-200 bg-white px-2.5 py-2 text-center shadow-sm sm:min-w-24 sm:px-4">
      <p className="font-serif text-xl leading-none text-stone-950 sm:text-2xl">{value}</p>
      <p className="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-stone-500 sm:text-xs">
        {label}
      </p>
    </div>
  );
}

function FriendProfileLink({ friend }: { friend: UserSummary }) {
  const displayName = String(friend.displayName || friend.email || "Cook");

  return (
    <Link
      className="flex min-h-16 items-center gap-3 rounded-lg border border-stone-200 bg-white/78 px-3 py-2.5 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
      href={`/profiles/${friend.id}`}
    >
      <UserAvatar displayName={displayName} photoURL={friend.photoURL} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-serif text-lg leading-tight text-stone-950">
          {displayName}
        </p>
        {friend.username ? (
          <p className="truncate text-sm font-medium text-stone-500">@{friend.username}</p>
        ) : null}
      </div>
      <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-stone-400" />
    </Link>
  );
}

function UserLine({ user }: { user: UserSummary | UserProfile }) {
  const displayName = String(user.displayName || user.email || "Cook");

  return (
    <div className="flex min-w-0 items-center gap-3">
      <UserAvatar displayName={displayName} photoURL={user.photoURL} size="sm" />
      <div className="min-w-0">
        <p className="truncate font-serif text-lg leading-tight text-stone-950 sm:text-xl">
          {displayName}
        </p>
        {user.username ? (
          <p className="truncate text-sm font-medium text-stone-500">@{user.username}</p>
        ) : null}
      </div>
    </div>
  );
}
