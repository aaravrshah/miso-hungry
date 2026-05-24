"use client";

import { BookOpen, Check, Search, UserPlus, Users, X } from "lucide-react";
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
    removeFriend,
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
    <div className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--tomato)]">
            Friends
          </p>
          <h1 className="mt-2 font-serif text-4xl leading-tight text-stone-950 sm:text-5xl">
            A shared table for favorite recipes
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
            Add friends, visit profiles, try their recipes, and collaborate on keepers.
          </p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white/76 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-rose-100 text-rose-700">
              <Users aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <p className="font-serif text-xl text-stone-950">{friends.length} friends</p>
              <p className="text-sm font-medium text-stone-500">
                {incomingRequests.length} incoming requests
              </p>
            </div>
          </div>
        </div>
      </section>

      {actionError || error ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
          {actionError ?? error}
        </p>
      ) : null}

      {collaborationInvites.incoming.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-serif text-3xl text-stone-950">Collaboration invites</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {collaborationInvites.incoming.map((invite) => (
              <article
                className="rounded-lg border border-stone-200 bg-white/76 p-4 shadow-sm"
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
                <div className="mt-4 flex gap-2">
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
        <section className="space-y-3">
          <h2 className="font-serif text-3xl text-stone-950">Pending recipe invites</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {collaborationInvites.outgoing.map((invite) => (
              <article
                className="rounded-lg border border-stone-200 bg-white/76 p-4 shadow-sm"
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
        <section className="space-y-3">
          <h2 className="font-serif text-3xl text-stone-950">Friend requests</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {incomingRequests.map((request) => (
              <article
                className="rounded-lg border border-stone-200 bg-white/76 p-4 shadow-sm"
                key={request.id}
              >
                <UserLine user={request.fromUser} />
                <div className="mt-4 flex gap-2">
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

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-serif text-3xl text-stone-950">Your friends</h2>
            <p className="mt-1 text-sm text-stone-600">
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
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {friends.map((friend) => (
            <article
              className="rounded-lg border border-stone-200 bg-white/76 p-4 shadow-sm"
              key={friend.id}
            >
              <UserLine user={friend} />
              <div className="mt-4 flex gap-2">
                <Link
                  className="inline-flex min-h-10 flex-1 items-center justify-center rounded-lg border border-stone-200 bg-white px-3 text-sm font-bold text-[var(--tomato)] shadow-sm transition hover:bg-stone-50"
                  href={`/profiles/${friend.id}`}
                >
                  Profile
                </Link>
                <button
                  className="inline-flex min-h-10 flex-1 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 text-sm font-bold text-red-700"
                  disabled={workingId === friend.id}
                  onClick={() => {
                    if (!window.confirm(`Remove ${friend.displayName} as a friend?`)) {
                      return;
                    }

                    runAction(friend.id, () => removeFriend(friend.id));
                  }}
                  type="button"
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-3xl text-stone-950">Find people</h2>
          <p className="mt-1 text-sm text-stone-600">
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
            className="h-12 w-full rounded-lg border border-stone-200 bg-white/82 pl-12 pr-4 text-base text-stone-950 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-[var(--tomato)] focus:ring-4 focus:ring-red-100"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search users"
            type="search"
            value={query}
          />
        </label>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {people.map((person) => (
            <article
              className="rounded-lg border border-stone-200 bg-white/76 p-4 shadow-sm"
              key={person.id}
            >
              <UserLine user={person} />
              <div className="mt-4 flex gap-2">
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
          <h2 className="font-serif text-3xl text-stone-950">Recipes from friends</h2>
          <RecipeGrid recipes={recipesFromFriends.slice(0, 6)} />
        </section>
      ) : null}
    </div>
  );
}

function UserLine({ user }: { user: UserSummary | UserProfile }) {
  const displayName = String(user.displayName || user.email || "Cook");

  return (
    <div className="flex min-w-0 items-center gap-3">
      <UserAvatar displayName={displayName} photoURL={user.photoURL} size="md" />
      <div className="min-w-0">
        <p className="truncate font-serif text-xl leading-tight text-stone-950">
          {displayName}
        </p>
        {user.username ? (
          <p className="truncate text-sm font-medium text-stone-500">@{user.username}</p>
        ) : null}
      </div>
    </div>
  );
}
