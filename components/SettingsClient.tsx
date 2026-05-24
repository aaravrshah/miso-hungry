"use client";

import { AtSign, Bell, ImagePlus, KeyRound, Mail, Save } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useAuth } from "@/components/AuthProvider";
import { UserAvatar } from "@/components/UserAvatar";
import type { AccountVisibility, NotificationBin, NotificationPreferences } from "@/lib/firebase/schema";
import { defaultRecipeVisibility, type RecipeVisibility } from "@/lib/recipes";
import { defaultNotificationPreferences } from "@/lib/services/userService";

const accountVisibilityOptions: Array<{
  description: string;
  label: string;
  value: AccountVisibility;
}> = [
  {
    description: "Non-friends only see a limited profile and can request you.",
    label: "Private",
    value: "private",
  },
  {
    description: "Anyone signed in can see your public profile.",
    label: "Public",
    value: "public",
  },
];

const recipeVisibilityOptions: Array<{
  description: string;
  label: string;
  value: RecipeVisibility;
}> = [
  {
    description: "Only you and collaborators can see new recipes.",
    label: "Private",
    value: "private",
  },
  {
    description: "Friends can view new recipes by default.",
    label: "Friends",
    value: "friends",
  },
  {
    description: "New recipes can appear in Explore.",
    label: "Public",
    value: "public",
  },
];

const notificationOptions: Array<{
  bin: NotificationBin;
  description: string;
  emoji: string;
  label: string;
}> = [
  {
    bin: "social",
    description: "Friend requests and accepted friend requests.",
    emoji: "👋",
    label: "Social",
  },
  {
    bin: "collaboration",
    description: "Collaborator invites and shared recipe edits.",
    emoji: "🤝",
    label: "Collaboration",
  },
  {
    bin: "recipeActivity",
    description: "Saves, cooks, ratings, tags, and new recipes from friends.",
    emoji: "🍽️",
    label: "Recipe activity",
  },
  {
    bin: "reminders",
    description: "Meal plan and grocery reminders once scheduling is enabled.",
    emoji: "⏰",
    label: "Reminders",
  },
];

export function SettingsClient() {
  const { error, profile, sendPasswordReset, updateUserProfile } = useAuth();
  const [accountVisibilityDraft, setAccountVisibilityDraft] = useState<
    AccountVisibility | undefined
  >();
  const [defaultRecipeVisibilityDraft, setDefaultRecipeVisibilityDraft] = useState<
    RecipeVisibility | undefined
  >();
  const [displayNameDraft, setDisplayNameDraft] = useState<string | undefined>();
  const [notificationPreferencesDraft, setNotificationPreferencesDraft] = useState<
    NotificationPreferences | undefined
  >();
  const [usernameDraft, setUsernameDraft] = useState<string | undefined>();
  const [photoFile, setPhotoFile] = useState<File | undefined>();
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();
  const [message, setMessage] = useState<string | undefined>();
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const profileHref = profile ? `/profiles/${profile.id}` : "/settings";
  const accountVisibility =
    accountVisibilityDraft ?? profile?.accountVisibility ?? "private";
  const defaultVisibility =
    defaultRecipeVisibilityDraft ??
    profile?.defaultRecipeVisibility ??
    defaultRecipeVisibility;
  const displayName = displayNameDraft ?? String(profile?.displayName ?? "");
  const notificationPreferences =
    notificationPreferencesDraft ??
    {
      ...defaultNotificationPreferences,
      ...(profile?.notificationPreferences ?? {}),
    };
  const username = usernameDraft ?? profile?.username ?? "";
  const avatarUrl = photoPreviewUrl ?? profile?.photoURL;

  useEffect(
    () => () => {
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
    },
    [photoPreviewUrl],
  );

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    setPhotoFile(file);
    setMessage(undefined);

    if (!file) {
      setPhotoPreviewUrl(undefined);
      return;
    }

    setPhotoPreviewUrl(URL.createObjectURL(file));
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(undefined);
    setMessage(undefined);
    setIsSavingProfile(true);

    try {
      await updateUserProfile({
        accountVisibility,
        defaultRecipeVisibility: defaultVisibility,
        displayName,
        notificationPreferences,
        photoFile,
        username,
      });
      setAccountVisibilityDraft(undefined);
      setDefaultRecipeVisibilityDraft(undefined);
      setDisplayNameDraft(undefined);
      setNotificationPreferencesDraft(undefined);
      setUsernameDraft(undefined);
      setPhotoFile(undefined);
      setPhotoPreviewUrl(undefined);
      setMessage("Profile updated.");
    } catch (nameError) {
      setFormError(
        nameError instanceof Error ? nameError.message : "Unable to update profile.",
      );
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function resetPassword() {
    if (!profile?.email) {
      setFormError("This account does not have an email address.");
      return;
    }

    setFormError(undefined);
    setMessage(undefined);
    setIsSendingReset(true);

    try {
      await sendPasswordReset(profile.email);
      setMessage(`Password reset email sent to ${profile.email}.`);
    } catch (resetError) {
      setFormError(
        resetError instanceof Error ? resetError.message : "Unable to send password reset.",
      );
    } finally {
      setIsSendingReset(false);
    }
  }

  async function saveNotificationPreferences() {
    setFormError(undefined);
    setMessage(undefined);
    setIsSavingProfile(true);

    try {
      await updateUserProfile({
        accountVisibility,
        defaultRecipeVisibility: defaultVisibility,
        displayName,
        notificationPreferences,
        username,
      });
      setNotificationPreferencesDraft(undefined);
      setMessage("Notification settings updated.");
    } catch (notificationError) {
      setFormError(
        notificationError instanceof Error
          ? notificationError.message
          : "Unable to update notification settings.",
      );
    } finally {
      setIsSavingProfile(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 sm:space-y-6">
      <section className="space-y-2">
        <p className="hidden text-sm font-bold uppercase tracking-[0.18em] text-[var(--tomato)] sm:block">
          Settings
        </p>
        <h1 className="font-serif text-3xl leading-tight text-stone-950 sm:text-5xl">
          Account
        </h1>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white/75 p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3">
          <UserAvatar
            displayName={String(profile?.displayName ?? "Cook")}
            photoURL={profile?.photoURL}
            size="lg"
          />
          <div className="min-w-0">
            <h2 className="font-serif text-2xl leading-tight text-stone-950">
              {profile?.displayName ?? "Your profile"}
            </h2>
            <div className="mt-1 space-y-1 text-sm font-semibold text-stone-500">
              {profile?.username ? <p>@{profile.username}</p> : null}
              <p className="truncate">{profile?.email ?? "No email"}</p>
            </div>
            <Link
              className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg border border-stone-200 bg-white px-3 text-sm font-bold text-[var(--tomato)] shadow-sm"
              href={profileHref}
            >
              View public profile
            </Link>
          </div>
        </div>
      </section>

      <form
        className="rounded-lg border border-stone-200 bg-white/75 p-4 shadow-sm sm:p-5"
        onSubmit={saveProfile}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <UserAvatar displayName={displayName || "Cook"} photoURL={avatarUrl} size="xl" />
          <div className="min-w-0 flex-1 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-bold text-stone-700">Profile photo</span>
              <span className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-stone-300 bg-white px-4 text-sm font-bold text-stone-700 transition hover:bg-stone-50">
                <ImagePlus aria-hidden="true" className="h-4 w-4" />
                {photoFile ? photoFile.name : "Choose photo"}
                <input
                  accept="image/*"
                  className="sr-only"
                  onChange={handlePhotoChange}
                  type="file"
                />
              </span>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-bold text-stone-700">Display name</span>
              <input
                className="h-12 w-full rounded-lg border border-stone-200 bg-white px-4 text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-[var(--tomato)] focus:ring-4 focus:ring-red-100"
                onChange={(event) => setDisplayNameDraft(event.target.value)}
                required
                value={displayName}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-bold text-stone-700">Username</span>
              <span className="flex h-12 items-center rounded-lg border border-stone-200 bg-white px-4 focus-within:border-[var(--tomato)] focus-within:ring-4 focus-within:ring-red-100">
                <AtSign aria-hidden="true" className="h-4 w-4 text-stone-400" />
                <input
                  className="min-w-0 flex-1 bg-transparent pl-2 text-stone-950 outline-none placeholder:text-stone-400"
                  onChange={(event) => setUsernameDraft(event.target.value)}
                  placeholder="aarav"
                  value={username}
                />
              </span>
              <span className="text-xs font-medium text-stone-500">
                Lowercase letters, numbers, dots, and underscores work best.
              </span>
            </label>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <PrivacyOptionGroup
            description="This controls what people can see before they are friends with you."
            label="Profile visibility"
            onChange={setAccountVisibilityDraft}
            options={accountVisibilityOptions}
            value={accountVisibility}
          />
          <PrivacyOptionGroup
            description="You can still override this on each individual recipe."
            label="Default recipe visibility"
            onChange={setDefaultRecipeVisibilityDraft}
            options={recipeVisibilityOptions}
            value={defaultVisibility}
          />
        </div>

        <button
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--tomato)] px-4 text-sm font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          disabled={isSavingProfile}
          type="submit"
        >
          <Save aria-hidden="true" className="h-4 w-4" />
          {isSavingProfile ? "Saving..." : "Save profile"}
        </button>
      </form>

      <section className="rounded-lg border border-stone-200 bg-white/75 p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#fff4e4] text-[var(--tomato)]">
            <Bell aria-hidden="true" className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-serif text-2xl leading-tight text-stone-950">
              Notifications
            </h2>
            <p className="mt-1 text-sm leading-6 text-stone-600">
              Choose which in-app notification bins should show up. Push alerts can use
              these same settings later.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-2">
          {notificationOptions.map((option) => {
            const enabled = notificationPreferences[option.bin] !== false;

            return (
              <button
                className={`flex min-h-16 items-center gap-3 rounded-lg border p-3 text-left transition ${
                  enabled
                    ? "border-[var(--tomato)] bg-[#fff4e4] ring-2 ring-orange-100"
                    : "border-stone-200 bg-white hover:bg-stone-50"
                }`}
                key={option.bin}
                onClick={() =>
                  setNotificationPreferencesDraft({
                    ...notificationPreferences,
                    [option.bin]: !enabled,
                  })
                }
                type="button"
              >
                <span className="text-xl" aria-hidden="true">
                  {option.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-stone-950">{option.label}</span>
                  <span className="mt-1 block text-xs font-medium leading-5 text-stone-500">
                    {option.description}
                  </span>
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    enabled
                      ? "bg-[var(--tomato)] text-white"
                      : "bg-stone-100 text-stone-500"
                  }`}
                >
                  {enabled ? "On" : "Off"}
                </span>
              </button>
            );
          })}
        </div>
        <button
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--tomato)] px-4 text-sm font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          disabled={isSavingProfile}
          onClick={saveNotificationPreferences}
          type="button"
        >
          <Save aria-hidden="true" className="h-4 w-4" />
          {isSavingProfile ? "Saving..." : "Save notification settings"}
        </button>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white/75 p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-stone-100 text-stone-600">
            <Mail aria-hidden="true" className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-serif text-2xl leading-tight text-stone-950">Email</h2>
            <p className="mt-1 truncate text-sm font-semibold text-stone-500">
              {profile?.email ?? "No email address"}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white/75 p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-stone-100 text-stone-600">
            <KeyRound aria-hidden="true" className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-serif text-2xl leading-tight text-stone-950">Password</h2>
            <button
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              disabled={isSendingReset || !profile?.email}
              onClick={resetPassword}
              type="button"
            >
              {isSendingReset ? "Sending..." : "Send password reset email"}
            </button>
          </div>
        </div>
      </section>

      {formError || error ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
          {formError ?? error}
        </p>
      ) : null}

      {message ? (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
          {message}
        </p>
      ) : null}
    </div>
  );
}

function PrivacyOptionGroup<Value extends string>({
  description,
  label,
  onChange,
  options,
  value,
}: {
  description: string;
  label: string;
  onChange: (value: Value) => void;
  options: Array<{ description: string; label: string; value: Value }>;
  value: Value;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-bold text-stone-700">{label}</legend>
      <p className="text-xs font-medium leading-5 text-stone-500">{description}</p>
      <div className="grid gap-2">
        {options.map((option) => (
          <button
            className={`rounded-lg border p-3 text-left transition ${
              option.value === value
                ? "border-[var(--tomato)] bg-[#fff4e4] text-stone-950 ring-2 ring-orange-100"
                : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
            }`}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            <span className="block text-sm font-bold">{option.label}</span>
            <span className="mt-1 block text-xs font-medium leading-5 text-stone-500">
              {option.description}
            </span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
