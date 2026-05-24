import { CalendarDays, ChefHat, Flame } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CategoryPill } from "@/components/CategoryPill";
import { StarRating } from "@/components/StarRating";
import {
  averageRating,
  formatRecipeDate,
  formatRating,
  getRecipeCategoryNames,
  type Recipe,
} from "@/lib/recipes";

type RecipeCardProps = {
  recipe: Recipe;
};

export function RecipeCard({ recipe }: RecipeCardProps) {
  const rating = averageRating(recipe);
  const recipeCategories = getRecipeCategoryNames(recipe);

  return (
    <Link
      className="group grid grid-cols-[6.5rem_1fr] overflow-hidden rounded-lg border border-stone-200 bg-white/78 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:block"
      href={`/recipes/${recipe.id}`}
    >
      <div className="relative aspect-square overflow-hidden bg-stone-200 sm:aspect-[4/3]">
        {recipe.coverImageUrl ? (
          <Image
            alt={recipe.title}
            fill
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            sizes="(min-width: 1280px) 28vw, (min-width: 640px) 44vw, 92vw"
            src={recipe.coverImageUrl}
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-stone-100 text-stone-400">
            <ChefHat aria-hidden="true" className="h-10 w-10" />
          </div>
        )}
      </div>
      <div className="min-w-0 space-y-2 p-3 sm:space-y-4 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="hidden flex-wrap gap-1.5 sm:flex">
              {recipeCategories.slice(0, 2).map((category) => (
                <CategoryPill
                  className="min-h-8 px-3 py-1 text-xs"
                  key={category}
                  name={category}
                />
              ))}
              {recipeCategories.length > 2 ? (
                <span className="inline-flex min-h-8 items-center rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600 ring-1 ring-stone-200">
                  +{recipeCategories.length - 2}
                </span>
              ) : null}
            </div>
            <h3 className="line-clamp-2 font-serif text-lg leading-tight text-stone-950 sm:text-xl">
              {recipe.title}
            </h3>
            <p className="truncate text-xs font-bold uppercase tracking-[0.12em] text-stone-400 sm:hidden">
              {recipeCategories.slice(0, 2).join(", ") || recipe.cuisine || "Recipe"}
            </p>
          </div>
          <div className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 ring-1 ring-amber-200 sm:px-2.5 sm:py-1">
            <StarRating size="sm" value={rating} />
          </div>
        </div>
        <p className="hidden line-clamp-2 text-sm leading-6 text-stone-600 sm:block">
          {recipe.description}
        </p>
        {recipe.createdByDisplayName || recipe.collaborators?.length ? (
          <p className="hidden text-xs font-bold uppercase tracking-[0.12em] text-stone-400 sm:block">
            {recipe.createdByDisplayName ? `By ${recipe.createdByDisplayName}` : "Shared"}
            {recipe.collaborators?.length
              ? ` · ${recipe.collaborators.length} collaborator${
                  recipe.collaborators.length === 1 ? "" : "s"
                }`
              : ""}
          </p>
        ) : null}
        {typeof recipe.aaravRating === "number" || typeof recipe.sophieRating === "number" ? (
          <div className="hidden flex-wrap gap-2 text-xs font-bold text-stone-600 sm:flex">
            {typeof recipe.aaravRating === "number" ? (
              <span className="rounded-full bg-stone-100 px-2.5 py-1">
                Aarav {formatRating(recipe.aaravRating)}
              </span>
            ) : null}
            {typeof recipe.sophieRating === "number" ? (
              <span className="rounded-full bg-stone-100 px-2.5 py-1">
                Sophie {formatRating(recipe.sophieRating)}
              </span>
            ) : null}
          </div>
        ) : null}
        <div className="hidden flex-wrap gap-2 sm:flex">
          {(recipe.tags ?? []).map((tag) => (
            <span
              className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600"
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 text-xs font-medium text-stone-500 sm:border-t sm:border-stone-100 sm:pt-3">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays aria-hidden="true" className="h-4 w-4" />
            {formatRecipeDate(recipe.lastMadeDate)}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[var(--tomato)]">
            <Flame aria-hidden="true" className="h-4 w-4" />
            {recipe.timesMade}x
          </span>
        </div>
      </div>
    </Link>
  );
}
