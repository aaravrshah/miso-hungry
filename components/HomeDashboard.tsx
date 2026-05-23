"use client";

import {
  ArrowRight,
  CalendarDays,
  ChefHat,
  CookingPot,
  Heart,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CategoryPill } from "@/components/CategoryPill";
import { RecipeGrid } from "@/components/RecipeGrid";
import { useRecipes } from "@/components/RecipeStore";
import { averageRating, formatRecipeDate, type Recipe } from "@/lib/recipes";

function recipeSortDate(recipe: Recipe) {
  return recipe.lastMadeDate ?? recipe.dateAdded;
}

export function HomeDashboard() {
  const { categories, error, isLoading, recipes } = useRecipes();
  const recentRecipes = [...recipes]
    .sort((first, second) => recipeSortDate(second).localeCompare(recipeSortDate(first)))
    .slice(0, 3);
  const featuredRecipe = recipes[0];
  const ratedRecipes = recipes
    .map((recipe) => averageRating(recipe))
    .filter((rating): rating is number => typeof rating === "number");
  const averageScore = ratedRecipes.length
    ? ratedRecipes.reduce((total, rating) => total + rating, 0) / ratedRecipes.length
    : undefined;
  const bothLoveCount = recipes.filter(
    (recipe) =>
      typeof recipe.aaravRating === "number" &&
      typeof recipe.sophieRating === "number" &&
      recipe.aaravRating >= 8 &&
      recipe.sophieRating >= 8,
  ).length;

  return (
    <div className="space-y-8">
      {isLoading && recipes.length === 0 ? (
        <p className="rounded-lg border border-stone-200 bg-white/72 p-4 text-sm font-semibold text-stone-600 shadow-sm">
          Loading your cookbook...
        </p>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
        <div className="flex flex-col justify-between gap-8 rounded-lg border border-stone-200 bg-[#fff8ee]/80 p-5 shadow-sm sm:p-7">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--tomato)]">
              Miso Hungry
            </p>
            <h1 className="mt-3 max-w-3xl font-serif text-4xl leading-tight text-stone-950 sm:text-6xl">
              The recipes Sophie and I keep coming back to.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600 sm:text-lg">
              A soft little home for date-night dinners, weekend breakfasts, favorite
              noodles, and the desserts that disappear too fast.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <DashboardStat
              icon={CookingPot}
              label="recipes"
              tone="text-[var(--tomato)]"
              value={`${recipes.length}`}
            />
            <DashboardStat
              icon={Heart}
              label="both-love picks"
              tone="text-[var(--plum)]"
              value={`${bothLoveCount}`}
            />
            <DashboardStat
              icon={Sparkles}
              label="avg rating"
              tone="text-[var(--butter)]"
              value={averageScore ? averageScore.toFixed(1) : "New"}
            />
          </div>
        </div>

        {featuredRecipe ? (
          <Link
            className="group relative min-h-[25rem] overflow-hidden rounded-lg border border-stone-200 bg-stone-900 shadow-sm"
            href={`/recipes/${featuredRecipe.id}`}
          >
            {featuredRecipe.coverImageUrl ? (
              <Image
                alt={featuredRecipe.title}
                className="absolute inset-0 h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105"
                fill
                priority
                sizes="(min-width: 1024px) 46vw, 92vw"
                src={featuredRecipe.coverImageUrl}
              />
            ) : (
              <div className="grid h-full min-h-[25rem] place-items-center bg-stone-800 text-stone-500">
                <ChefHat aria-hidden="true" className="h-12 w-12" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/78 via-stone-950/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-7">
              <CategoryPill className="bg-white/90" name={featuredRecipe.category} />
              <h2 className="mt-4 font-serif text-3xl leading-tight sm:text-4xl">
                {featuredRecipe.title}
              </h2>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-semibold text-white/85">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays aria-hidden="true" className="h-4 w-4" />
                  {formatRecipeDate(featuredRecipe.lastMadeDate)}
                </span>
                <span>{featuredRecipe.prepTime || "No prep time"}</span>
                <span>{featuredRecipe.cookTime || "No cook time"}</span>
              </div>
            </div>
          </Link>
        ) : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-serif text-3xl text-stone-950">Recently made</h2>
              <p className="mt-1 text-sm font-medium text-stone-500">
                The current rotation on the kitchen counter.
              </p>
            </div>
            <Link
              className="hidden items-center gap-2 text-sm font-bold text-[var(--tomato)] sm:inline-flex"
              href="/recipes"
            >
              See all
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
          <RecipeGrid
            emptyText="Add a recipe, then come back here to see the current rotation."
            emptyTitle="No recent recipes yet"
            recipes={recentRecipes}
          />
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-stone-200 bg-white/72 p-5 shadow-sm">
            <h2 className="font-serif text-2xl text-stone-950">Categories</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {categories.slice(0, 6).map((category) => (
                <CategoryPill
                  href={`/categories#${category.id}`}
                  key={category.id}
                  name={category.name}
                />
              ))}
              {!isLoading && categories.length === 0 ? (
                <p className="text-sm font-semibold text-stone-500">
                  Create a category to organize your recipes.
                </p>
              ) : null}
            </div>
          </section>

          <section className="rounded-lg border border-stone-200 bg-white/72 p-5 shadow-sm">
            <h2 className="font-serif text-2xl text-stone-950">Next up</h2>
            <div className="mt-4 space-y-3">
              {isLoading ? (
                <p className="text-sm font-semibold text-stone-500">Loading recipes...</p>
              ) : null}
              {recipes.slice(0, 3).map((recipe) => (
                <Link
                  className="flex items-center justify-between gap-4 rounded-lg bg-stone-50 px-3 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
                  href={`/recipes/${recipe.id}`}
                  key={recipe.id}
                >
                  <span>{recipe.title}</span>
                  <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--tomato)]" />
                </Link>
              ))}
              {!isLoading && recipes.length === 0 ? (
                <p className="text-sm font-semibold text-stone-500">
                  Add the first recipe to start the rotation.
                </p>
              ) : null}
            </div>
          </section>
        </aside>
      </section>

      {error ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type DashboardStatProps = {
  icon: LucideIcon;
  label: string;
  tone: string;
  value: string;
};

function DashboardStat({ icon: Icon, label, tone, value }: DashboardStatProps) {
  return (
    <div className="rounded-lg bg-white/75 p-4 ring-1 ring-stone-200">
      <Icon aria-hidden="true" className={`h-5 w-5 ${tone}`} />
      <p className="mt-3 text-3xl font-bold text-stone-950">{value}</p>
      <p className="text-sm font-medium text-stone-500">{label}</p>
    </div>
  );
}
