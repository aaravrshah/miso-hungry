"use client";

import { ChefHat, Loader2 } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import type { SupportedDisplayName } from "@/lib/firebase/schema";
import { useAuth } from "@/components/AuthProvider";

const supportedUsers: SupportedDisplayName[] = ["Aarav", "Sophie"];

export function AuthGate({ children }: { children: ReactNode }) {
  const { error, isConfigured, isLoading, missingConfig, profile, signIn, signUp } =
    useAuth();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [displayName, setDisplayName] = useState<SupportedDisplayName>("Aarav");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | undefined>();

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(undefined);

    try {
      if (mode === "sign-up") {
        await signUp({ displayName, email, password });
      } else {
        await signIn({ email, password });
      }
    } catch (authError) {
      setFormError(authError instanceof Error ? authError.message : "Authentication failed.");
    }
  }

  if (!isConfigured) {
    return (
      <FullPageShell>
        <div className="min-w-0 overflow-hidden rounded-lg border border-stone-200 bg-white/80 p-6 shadow-sm">
          <h1 className="font-serif text-3xl leading-tight text-stone-950">
            Firebase setup needed
          </h1>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            Add these values to `.env.local`, then restart the dev server.
          </p>
          <ul className="mt-4 space-y-2 rounded-lg bg-stone-50 p-4 text-sm font-semibold text-stone-700">
            {missingConfig.map((key) => (
              <li className="break-words [overflow-wrap:anywhere]" key={key}>
                {key}
              </li>
            ))}
          </ul>
        </div>
      </FullPageShell>
    );
  }

  if (isLoading && !profile) {
    return (
      <FullPageShell>
        <div className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white/80 p-5 text-stone-600 shadow-sm">
          <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
          Loading cookbook...
        </div>
      </FullPageShell>
    );
  }

  if (!profile) {
    return (
      <FullPageShell>
        <form
          className="space-y-5 rounded-lg border border-stone-200 bg-white/82 p-5 shadow-sm sm:p-6"
          onSubmit={submitAuth}
        >
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--tomato)]">
              Miso Hungry
            </p>
            <h1 className="mt-2 font-serif text-4xl leading-tight text-stone-950">
              Sign in to the kitchen
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-lg bg-stone-100 p-1">
            <button
              className={`min-h-10 rounded-md text-sm font-bold ${
                mode === "sign-in" ? "bg-white text-stone-950 shadow-sm" : "text-stone-500"
              }`}
              onClick={() => setMode("sign-in")}
              type="button"
            >
              Sign in
            </button>
            <button
              className={`min-h-10 rounded-md text-sm font-bold ${
                mode === "sign-up" ? "bg-white text-stone-950 shadow-sm" : "text-stone-500"
              }`}
              onClick={() => setMode("sign-up")}
              type="button"
            >
              Create account
            </button>
          </div>

          {mode === "sign-up" ? (
            <label className="space-y-2">
              <span className="text-sm font-bold text-stone-700">Profile</span>
              <select
                className={inputClassName}
                onChange={(event) => setDisplayName(event.target.value as SupportedDisplayName)}
                value={displayName}
              >
                {supportedUsers.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="space-y-2">
            <span className="text-sm font-bold text-stone-700">Email</span>
            <input
              className={inputClassName}
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-stone-700">Password</span>
            <input
              className={inputClassName}
              minLength={6}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          {formError || error ? (
            <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
              {formError ?? error}
            </p>
          ) : null}

          <button
            className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[var(--tomato)] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#a94e3a]"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? "Working..." : mode === "sign-up" ? "Create account" : "Sign in"}
          </button>
        </form>
      </FullPageShell>
    );
  }

  return <>{children}</>;
}

const inputClassName =
  "h-12 w-full rounded-lg border border-stone-200 bg-white px-4 text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-[var(--tomato)] focus:ring-4 focus:ring-red-100";

function FullPageShell({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="min-w-0 w-full max-w-[22rem]">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-lg bg-[var(--tomato)] text-white">
            <ChefHat aria-hidden="true" className="h-6 w-6" />
          </span>
          <div>
            <p className="font-serif text-2xl leading-none text-stone-950">Miso Hungry</p>
            <p className="mt-1 text-sm font-semibold text-stone-500">Aarav and Sophie</p>
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}
