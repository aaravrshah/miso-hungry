import { CalendarDays, ChefHat, Flame, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { averageRating, formatRecipeDate, type Recipe } from "@/lib/recipes";
import { CategoryPill } from "@/components/CategoryPill";

type RecipeCardProps = {
  recipe: Recipe;
};

export function RecipeCard({ recipe }: RecipeCardProps) {
  const rating = averageRating(recipe);

  return (
    <Link
      className="group block overflow-hidden rounded-lg border border-stone-200 bg-white/78 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      href={`/recipes/${recipe.id}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-200">
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
      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <CategoryPill className="min-h-8 px-3 py-1 text-xs" name={recipe.category} />
            <h3 className="line-clamp-2 font-serif text-xl leading-tight text-stone-950">
              {recipe.title}
            </h3>
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-sm font-bold text-amber-700 ring-1 ring-amber-200">
            <Star aria-hidden="true" className="h-4 w-4 fill-current" />
            <span>{rating ? `${rating.toFixed(1)}/10` : "New"}</span>
          </div>
        </div>
        <p className="line-clamp-2 text-sm leading-6 text-stone-600">{recipe.description}</p>
        {typeof recipe.aaravRating === "number" || typeof recipe.sophieRating === "number" ? (
          <div className="flex flex-wrap gap-2 text-xs font-bold text-stone-600">
            {typeof recipe.aaravRating === "number" ? (
              <span className="rounded-full bg-stone-100 px-2.5 py-1">
                Aarav {recipe.aaravRating.toFixed(1)}
              </span>
            ) : null}
            {typeof recipe.sophieRating === "number" ? (
              <span className="rounded-full bg-stone-100 px-2.5 py-1">
                Sophie {recipe.sophieRating.toFixed(1)}
              </span>
            ) : null}
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {(recipe.tags ?? []).map((tag) => (
            <span
              className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600"
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-stone-100 pt-3 text-xs font-medium text-stone-500">
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
