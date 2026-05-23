"use client";

import { ArrowLeft, Handshake, Pencil, UserPlus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { RecipeGrid } from "@/components/RecipeGrid";
import { useRecipes } from "@/components/RecipeStore";
import { useSocial } from "@/components/SocialProvider";

type ProfileClientProps = {
  userId: string;
};

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
  const profile = allUsers.find((user) => user.id === userId);
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
  const friend = friends.find((item) => item.id === userId);
  const isOwnProfile = currentUser?.id === userId;
  const displayName = profile?.displayName ?? friend?.displayName ?? "Cook";

  async function requestFriendship() {
    setIsSending(true);
    setActionError(undefined);

    try {
      await sendFriendRequest(userId);
    } catch (friendError) {
      setActionError(
        friendError instanceof Error ? friendError.message : "Unable to send request.",
      );
    } finally {
      setIsSending(false);
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            {profile.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt=""
                className="h-20 w-20 rounded-full object-cover ring-1 ring-stone-200"
                src={profile.photoURL}
              />
            ) : (
              <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-stone-100 font-serif text-4xl text-stone-700 ring-1 ring-stone-200">
                {String(displayName).slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--tomato)]">
                Profile
              </p>
              <h1 className="truncate font-serif text-4xl leading-tight text-stone-950 sm:text-5xl">
                {displayName}
              </h1>
              {profile.email ? (
                <p className="mt-2 truncate text-sm font-semibold text-stone-500">
                  {profile.email}
                </p>
              ) : null}
            </div>
          </div>
          {isOwnProfile ? (
            <span className="inline-flex min-h-11 items-center justify-center rounded-lg bg-stone-100 px-4 text-sm font-bold text-stone-600">
              This is you
            </span>
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
              onClick={requestFriendship}
              type="button"
            >
              <UserPlus aria-hidden="true" className="h-4 w-4" />
              {isSending ? "Sending..." : "Add friend"}
            </button>
          )}
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

      {isOwnProfile ? (
        <section className="rounded-lg border border-stone-200 bg-white/72 p-4 text-sm leading-6 text-stone-600 shadow-sm">
          <div className="flex items-start gap-3">
            <Pencil aria-hidden="true" className="mt-1 h-4 w-4 text-stone-400" />
            Profile editing can come next. For now this profile is built from your Firebase
            display name, email, and photo.
          </div>
        </section>
      ) : null}
    </div>
  );
}
