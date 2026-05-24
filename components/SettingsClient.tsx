"use client";

import { AtSign, ImagePlus, KeyRound, Mail, Save } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useAuth } from "@/components/AuthProvider";
import { UserAvatar } from "@/components/UserAvatar";

export function SettingsClient() {
  const { error, profile, sendPasswordReset, updateUserProfile } = useAuth();
  const [displayNameDraft, setDisplayNameDraft] = useState<string | undefined>();
  const [usernameDraft, setUsernameDraft] = useState<string | undefined>();
  const [photoFile, setPhotoFile] = useState<File | undefined>();
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();
  const [message, setMessage] = useState<string | undefined>();
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const profileHref = profile ? `/profiles/${profile.id}` : "/settings";
  const displayName = displayNameDraft ?? String(profile?.displayName ?? "");
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
      await updateUserProfile({ displayName, photoFile, username });
      setDisplayNameDraft(undefined);
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
