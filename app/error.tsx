"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white text-red-700 ring-1 ring-red-200">
            <AlertTriangle aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-serif text-3xl text-red-950">Something went sideways</h1>
            <p className="mt-2 text-sm leading-6 text-red-800">
              {error.message || "Miso Hungry could not load this view."}
            </p>
          </div>
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-700 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-red-800"
          onClick={reset}
          type="button"
        >
          <RotateCcw aria-hidden="true" className="h-4 w-4" />
          Try again
        </button>
      </div>
    </div>
  );
}
