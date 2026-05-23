import { Star } from "lucide-react";

type StarRatingProps = {
  label?: string;
  onChange?: (value: number | undefined) => void;
  size?: "sm" | "md" | "lg";
  value?: number;
};

function normalizeDisplayRating(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return undefined;
  }

  return Math.min(5, Math.max(1, value > 5 ? value / 2 : value));
}

export function StarRating({
  label = "Rating",
  onChange,
  size = "md",
  value,
}: StarRatingProps) {
  const rating = normalizeDisplayRating(value);
  const interactive = Boolean(onChange);
  const starClassName =
    size === "lg" ? "h-6 w-6" : size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const textClassName =
    size === "lg" ? "text-base" : size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className="inline-flex items-center gap-2">
      <div className="inline-flex items-center gap-0.5" aria-label={label}>
        {Array.from({ length: 5 }, (_, index) => {
          const starValue = index + 1;
          const filled = typeof rating === "number" && rating >= starValue - 0.25;
          const Icon = (
            <Star
              aria-hidden="true"
              className={`${starClassName} ${
                filled ? "fill-amber-400 text-amber-400" : "fill-stone-200 text-stone-200"
              }`}
            />
          );

          if (!interactive) {
            return <span key={starValue}>{Icon}</span>;
          }

          return (
            <button
              aria-label={`${starValue} star${starValue === 1 ? "" : "s"}`}
              className="rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              key={starValue}
              onClick={() => onChange?.(rating === starValue ? undefined : starValue)}
              type="button"
            >
              {Icon}
            </button>
          );
        })}
      </div>
      {typeof rating === "number" ? (
        <span className={`${textClassName} font-bold text-stone-600`}>
          {rating.toFixed(rating % 1 ? 1 : 0)}
        </span>
      ) : null}
    </div>
  );
}
