"use client";

import { Globe2, LockKeyhole, UsersRound } from "lucide-react";
import type { RecipeVisibility } from "@/lib/recipes";

type RecipeVisibilityBadgeProps = {
  className?: string;
  showLabel?: boolean;
  visibility: RecipeVisibility;
};

const visibilityConfig = {
  private: {
    icon: LockKeyhole,
    label: "Private",
    title: "Only you and collaborators can see this",
  },
  friends: {
    icon: UsersRound,
    label: "Friends",
    title: "Friends can view this recipe",
  },
  public: {
    icon: Globe2,
    label: "Public",
    title: "Anyone signed in can find this recipe",
  },
} satisfies Record<
  RecipeVisibility,
  {
    icon: typeof LockKeyhole;
    label: string;
    title: string;
  }
>;

export function RecipeVisibilityBadge({
  className = "",
  showLabel = false,
  visibility,
}: RecipeVisibilityBadgeProps) {
  const config = visibilityConfig[visibility];
  const Icon = config.icon;

  return (
    <span
      aria-label={`Recipe visibility: ${config.label}`}
      className={`inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/88 px-2 py-1 text-xs font-bold text-stone-700 shadow-sm backdrop-blur ${className}`}
      title={config.title}
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {showLabel ? <span>{config.label}</span> : null}
    </span>
  );
}
