"use client";

import { Star } from "lucide-react";
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

type StarRatingProps = {
  label?: string;
  onChange?: (value: number | undefined) => void;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  value?: number;
};

function normalizeDisplayRating(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return undefined;
  }

  const fivePointValue = value > 5 ? value / 2 : value;
  return Math.min(5, Math.max(0.5, Math.round(fivePointValue * 2) / 2));
}

function ratingFromPointer({
  container,
  pointerX,
}: {
  container: HTMLDivElement;
  pointerX: number;
}) {
  const rect = container.getBoundingClientRect();
  const rawValue = ((pointerX - rect.left) / rect.width) * 5;
  const nextValue = Math.ceil(rawValue * 2) / 2;

  return Math.min(5, Math.max(0.5, nextValue));
}

export function StarRating({
  label = "Rating",
  onChange,
  showValue = true,
  size = "md",
  value,
}: StarRatingProps) {
  const rating = normalizeDisplayRating(value);
  const interactive = Boolean(onChange);
  const [previewRating, setPreviewRating] = useState<number | undefined>();
  const containerRef = useRef<HTMLDivElement>(null);
  const displayRating = previewRating ?? rating;
  const starClassName =
    size === "lg" ? "h-7 w-7" : size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const textClassName =
    size === "lg" ? "text-base" : size === "sm" ? "text-xs" : "text-sm";

  function commitPointerRating(event: PointerEvent<HTMLDivElement>) {
    if (!interactive || !containerRef.current) {
      return;
    }

    const nextRating = ratingFromPointer({
      container: containerRef.current,
      pointerX: event.clientX,
    });
    onChange?.(nextRating);
  }

  function previewPointerRating(event: PointerEvent<HTMLDivElement>) {
    if (!interactive || !containerRef.current) {
      return;
    }

    setPreviewRating(
      ratingFromPointer({
        container: containerRef.current,
        pointerX: event.clientX,
      }),
    );
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!interactive) {
      return;
    }

    if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      onChange?.(undefined);
      return;
    }

    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }

    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 0.5 : -0.5;
    const nextRating = Math.min(5, Math.max(0.5, (rating ?? 0) + direction));
    onChange?.(nextRating);
  }

  return (
    <div className="inline-flex items-center gap-2">
      <div
        aria-label={label}
        aria-valuemax={5}
        aria-valuemin={0.5}
        aria-valuenow={displayRating}
        className={`inline-flex touch-none select-none items-center gap-0.5 rounded-sm ${
          interactive ? "cursor-ew-resize focus:outline-none focus:ring-2 focus:ring-amber-300" : ""
        }`}
        onKeyDown={handleKeyDown}
        onPointerCancel={() => setPreviewRating(undefined)}
        onPointerDown={(event) => {
          if (!interactive) {
            return;
          }

          event.currentTarget.setPointerCapture(event.pointerId);
          previewPointerRating(event);
          commitPointerRating(event);
        }}
        onPointerLeave={() => setPreviewRating(undefined)}
        onPointerMove={previewPointerRating}
        onPointerUp={(event) => {
          commitPointerRating(event);
          setPreviewRating(undefined);
        }}
        ref={containerRef}
        role={interactive ? "slider" : "img"}
        tabIndex={interactive ? 0 : undefined}
      >
        {Array.from({ length: 5 }, (_, index) => {
          const starValue = index + 1;
          const fillPercent =
            typeof displayRating === "number"
              ? Math.min(1, Math.max(0, displayRating - index)) * 100
              : 0;

          return (
            <span className="relative inline-block" key={starValue}>
              <Star
                aria-hidden="true"
                className={`${starClassName} fill-stone-200 text-stone-200`}
              />
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fillPercent}%` }}
              >
                <Star
                  aria-hidden="true"
                  className={`${starClassName} fill-amber-400 text-amber-400`}
                />
              </span>
            </span>
          );
        })}
      </div>
      {showValue && typeof rating === "number" ? (
        <span className={`${textClassName} font-bold text-stone-600`}>
          {rating.toFixed(rating % 1 ? 1 : 0)}
        </span>
      ) : null}
      {interactive && typeof rating === "number" ? (
        <button
          className={`${textClassName} font-bold text-stone-400 transition hover:text-stone-700`}
          onClick={() => onChange?.(undefined)}
          type="button"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}
