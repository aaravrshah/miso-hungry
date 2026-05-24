"use client";

import { KeyRound, Mail, Save, UserCircle } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/AuthProvider";

export function SettingsClient() {
  const { error, profile, sendPasswordReset, updateDisplayName } = useAuth();
  const [displayName, setDisplayName] = useState(String(profile?.displayName ?? ""));
  const [formError, setFormError] = useState<string | undefined>();
  const [message, setMessage] = useState<string | undefined>();
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const profileHref = profile ? `/profiles/${profile.id}` : "/settings";

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(undefined);
    setMessage(undefined);
    setIsSavingName(true);

    try {
      await updateDisplayName(displayName);
      setMessage("Profile updated.");
    } catch (nameError) {
      setFormError(
        nameError instanceof Error ? nameError.message : "Unable to update profile.",
      );
    } finally {
      setIsSavingName(false);
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
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#fff4e4] text-[var(--tomato)] ring-1 ring-stone-200">
            <UserCircle aria-hidden="true" className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h2 className="font-serif text-2xl leading-tight text-stone-950">
              {profile?.displayName ?? "Your profile"}
            </h2>
            <p className="mt-1 truncate text-sm font-semibold text-stone-500">
              {profile?.email ?? "No email"}
            </p>
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
        onSubmit={saveName}
      >
        <label className="block space-y-2">
          <span className="text-sm font-bold text-stone-700">Display name</span>
          <input
            className="h-12 w-full rounded-lg border border-stone-200 bg-white px-4 text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-[var(--tomato)] focus:ring-4 focus:ring-red-100"
            onChange={(event) => setDisplayName(event.target.value)}
            required
            value={displayName}
          />
        </label>
        <button
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--tomato)] px-4 text-sm font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          disabled={isSavingName}
          type="submit"
        >
          <Save aria-hidden="true" className="h-4 w-4" />
          {isSavingName ? "Saving..." : "Save name"}
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
