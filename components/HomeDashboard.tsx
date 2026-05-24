"use client";

import {
  ArrowRight,
  CalendarDays,
  ChefHat,
  Clock3,
  CookingPot,
  Heart,
  PlusCircle,
  Sparkles,
  Star,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CategoryPill } from "@/components/CategoryPill";
import { RecipeGrid } from "@/components/RecipeGrid";
import { useRecipes } from "@/components/RecipeStore";
import {
  averageRating,
  getRecipeCategoryNames,
  type Recipe,
} from "@/lib/recipes";

function recipeSortDate(recipe: Recipe) {
  return recipe.lastMadeDate ?? recipe.dateAdded;
}

function parseRecipeDate(value?: string) {
  if (!value) {
    return undefined;
  }

  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function daysSince(value?: string) {
  const date = parseRecipeDate(value);

  if (!date) {
    return undefined;
  }

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.max(
    0,
    Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

function madeAgoLabel(recipe: Recipe) {
  const days = daysSince(recipe.lastMadeDate);

  if (typeof days !== "number") {
    return "Never made";
  }

  if (days === 0) {
    return "Made today";
  }

  if (days === 1) {
    return "Made yesterday";
  }

  return `${days} days ago`;
}

function recommendationScore(recipe: Recipe) {
  const rating = averageRating(recipe) ?? 3.25;
  const daysAway = daysSince(recipe.lastMadeDate) ?? 60;
  return rating * 24 + Math.min(daysAway, 90) * 0.75 + recipe.timesMade * 1.5;
}

function recommendationReason(recipe: Recipe) {
  const rating = averageRating(recipe);
  const days = daysSince(recipe.lastMadeDate);

  if (typeof rating === "number" && typeof days === "number" && days >= 14) {
    return `${rating.toFixed(1)}/5 and ${days} days since last time`;
  }

  if (typeof rating === "number") {
    return `${rating.toFixed(1)}/5 favorite`;
  }

  if (typeof days === "number") {
    return `${days} days since last time`;
  }

  return "Waiting for its first cook";
}

export function HomeDashboard() {
  const { categories, error, isLoading, recipes } = useRecipes();
  const recentRecipes = [...recipes]
    .sort((first, second) => recipeSortDate(second).localeCompare(recipeSortDate(first)))
    .slice(0, 3);
  const ratedRecipes = recipes
    .map((recipe) => averageRating(recipe))
    .filter((rating): rating is number => typeof rating === "number");
  const averageScore = ratedRecipes.length
    ? ratedRecipes.reduce((total, rating) => total + rating, 0) / ratedRecipes.length
    : undefined;
  const topRatedCount = recipes.filter((recipe) => (averageRating(recipe) ?? 0) >= 4).length;
  const recommendations = [...recipes]
    .filter((recipe) => {
      const days = daysSince(recipe.lastMadeDate);
      return typeof days !== "number" || days >= 10;
    })
    .sort((first, second) => recommendationScore(second) - recommendationScore(first))
    .slice(0, 4);
  const fallbackTopRated = [...recipes]
    .sort((first, second) => (averageRating(second) ?? 0) - (averageRating(first) ?? 0))
    .slice(0, 4);
  const cookAgainSoon = recommendations.length ? recommendations : fallbackTopRated;
  const tonightPick = cookAgainSoon[0] ?? recipes[0];
  const planSlots = [
    { label: "Tonight", recipe: cookAgainSoon[0] },
    { label: "Low effort", recipe: cookAgainSoon.find((recipe) => recipe.difficulty === "Easy") },
    { label: "Weekend", recipe: cookAgainSoon[1] },
    {
      label: "Sweet thing",
      recipe: cookAgainSoon.find((recipe) =>
        getRecipeCategoryNames(recipe).some((category) =>
          category.toLowerCase().includes("dessert"),
        ),
      ),
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-8">
      {isLoading && recipes.length === 0 ? (
        <p className="rounded-lg border border-stone-200 bg-white/72 p-4 text-sm font-semibold text-stone-600 shadow-sm">
          Loading your cookbook...
        </p>
      ) : null}

      <section className="grid gap-4 sm:gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-lg border border-stone-200 bg-[#fff8ee]/82 p-4 shadow-sm sm:p-7">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--tomato)]">
            Miso Hungry
          </p>
          <h1 className="mt-2 max-w-3xl font-serif text-3xl leading-tight text-stone-950 sm:mt-3 sm:text-5xl">
            What should we cook next?
          </h1>
          <p className="mt-3 hidden max-w-2xl text-base leading-7 text-stone-600 sm:block">
            A calmer command center for saved recipes, repeat favorites, and the dishes
            that have been sitting on the shelf a little too long.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-6 sm:gap-3">
            <DashboardStat
              icon={CookingPot}
              label="recipes saved"
              tone="text-[var(--tomato)]"
              value={`${recipes.length}`}
            />
            <DashboardStat
              icon={Heart}
              label="top-rated picks"
              tone="text-[var(--plum)]"
              value={`${topRatedCount}`}
            />
            <DashboardStat
              icon={Sparkles}
              label="average rating"
              tone="text-[var(--butter)]"
              value={averageScore ? averageScore.toFixed(1) : "New"}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2 sm:mt-6 sm:gap-3">
            <Link
              className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--tomato)] px-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#a94e3a] sm:min-h-11 sm:flex-none sm:px-4"
              href="/recipes"
            >
              Browse recipes
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <Link
              className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm font-bold text-stone-700 shadow-sm transition hover:bg-stone-50 sm:min-h-11 sm:flex-none sm:px-4"
              href="/add-recipe"
            >
              <PlusCircle aria-hidden="true" className="h-4 w-4" />
              Add recipe
            </Link>
          </div>
        </div>

        <TonightPickCard recipe={tonightPick} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-serif text-3xl text-stone-950">Cook again soon</h2>
              <p className="mt-1 text-sm font-medium text-stone-500">
                High-rated recipes that have been away from the table for a bit.
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

          <div className="grid gap-3 lg:grid-cols-2">
            {cookAgainSoon.slice(0, 4).map((recipe) => (
              <RecommendationCard key={recipe.id} recipe={recipe} />
            ))}
          </div>

          {!isLoading && cookAgainSoon.length === 0 ? (
            <EmptyPanel
              text="Add recipes and cook logs, then this space will start suggesting what deserves a comeback."
              title="No suggestions yet"
            />
          ) : null}
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-stone-200 bg-white/72 p-5 shadow-sm">
            <h2 className="font-serif text-2xl text-stone-950">This week</h2>
            <div className="mt-4 space-y-2">
              {planSlots.map((slot) => (
                <MealPlanSlot
                  key={slot.label}
                  label={slot.label}
                  recipe={slot.recipe}
                />
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-stone-200 bg-white/72 p-5 shadow-sm">
            <h2 className="font-serif text-2xl text-stone-950">Recipe albums</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {categories.slice(0, 6).map((category) => (
                <CategoryPill
                  href={`/recipes?category=${category.id}`}
                  key={category.id}
                  name={category.name}
                />
              ))}
              {!isLoading && categories.length === 0 ? (
                <p className="text-sm font-semibold text-stone-500">
                  Create albums from the Recipes page.
                </p>
              ) : null}
            </div>
          </section>
        </aside>
      </section>

      <section className="space-y-4">
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
    <div className="rounded-lg bg-white/75 p-3 ring-1 ring-stone-200 sm:p-4">
      <Icon aria-hidden="true" className={`h-4 w-4 sm:h-5 sm:w-5 ${tone}`} />
      <p className="mt-2 text-2xl font-bold text-stone-950 sm:mt-3 sm:text-3xl">{value}</p>
      <p className="text-xs font-medium leading-4 text-stone-500 sm:text-sm">{label}</p>
    </div>
  );
}

function TonightPickCard({ recipe }: { recipe?: Recipe }) {
  if (!recipe) {
    return (
      <EmptyPanel
        text="Add a few recipes and this card will become your first dinner suggestion."
        title="Tonight's pick"
      />
    );
  }

  return (
    <Link
      className="group relative min-h-[13rem] overflow-hidden rounded-lg border border-stone-200 bg-stone-900 shadow-sm sm:min-h-[18rem] xl:min-h-[22rem]"
      href={`/recipes/${recipe.id}`}
    >
      {recipe.coverImageUrl ? (
        <Image
          alt={recipe.title}
          className="absolute inset-0 h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105"
          fill
          priority
          sizes="(min-width: 1280px) 42vw, 92vw"
          src={recipe.coverImageUrl}
        />
      ) : (
        <div className="grid h-full min-h-[13rem] place-items-center bg-stone-800 text-stone-500 sm:min-h-[18rem] xl:min-h-[22rem]">
          <ChefHat aria-hidden="true" className="h-12 w-12" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/82 via-stone-950/28 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-7">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/14 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white/85 ring-1 ring-white/20">
          <Sparkles aria-hidden="true" className="h-4 w-4" />
          Tonight&apos;s pick
        </p>
        <h2 className="mt-3 font-serif text-2xl leading-tight sm:mt-4 sm:text-4xl">
          {recipe.title}
        </h2>
        <p className="mt-2 line-clamp-1 max-w-xl text-sm leading-6 text-white/82 sm:mt-3 sm:line-clamp-2">
          {recipe.description || recommendationReason(recipe)}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-semibold text-white/85">
          <span className="inline-flex items-center gap-2">
            <Star aria-hidden="true" className="h-4 w-4 fill-current" />
            {averageRating(recipe)?.toFixed(1) ?? "New"}/5
          </span>
          <span className="inline-flex items-center gap-2">
            <Clock3 aria-hidden="true" className="h-4 w-4" />
            {madeAgoLabel(recipe)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function RecommendationCard({ recipe }: { recipe: Recipe }) {
  const categories = getRecipeCategoryNames(recipe);

  return (
    <Link
      className="grid grid-cols-[5.75rem_1fr] gap-3 rounded-lg border border-stone-200 bg-white/75 p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:grid-cols-[8.5rem_1fr] sm:gap-4"
      href={`/recipes/${recipe.id}`}
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-stone-100">
        {recipe.coverImageUrl ? (
          <Image
            alt={recipe.title}
            className="h-full w-full object-cover"
            fill
            sizes="(min-width: 1024px) 9rem, 92vw"
            src={recipe.coverImageUrl}
          />
        ) : (
          <div className="grid h-full place-items-center text-stone-400">
            <ChefHat aria-hidden="true" className="h-8 w-8" />
          </div>
        )}
      </div>
      <div className="min-w-0 py-1">
        <div className="flex flex-wrap gap-1.5">
          {categories.slice(0, 2).map((category) => (
            <CategoryPill className="min-h-8 px-3 py-1 text-xs" key={category} name={category} />
          ))}
        </div>
        <h3 className="mt-2 line-clamp-2 font-serif text-xl leading-tight text-stone-950 sm:mt-3 sm:text-2xl">
          {recipe.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs font-semibold text-[var(--tomato)] sm:mt-2 sm:text-sm">
          {recommendationReason(recipe)}
        </p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-stone-500 sm:mt-3 sm:gap-3">
          <span>{recipe.prepTime || "Prep time open"}</span>
          <span className="hidden sm:inline">{recipe.cookTime || "Cook time open"}</span>
          <span>{recipe.timesMade}x made</span>
        </div>
      </div>
    </Link>
  );
}

function MealPlanSlot({ label, recipe }: { label: string; recipe?: Recipe }) {
  return (
    <Link
      className={`flex min-h-14 items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition ${
        recipe
          ? "bg-stone-50 text-stone-700 hover:bg-stone-100"
          : "bg-stone-50/65 text-stone-400"
      }`}
      href={recipe ? `/recipes/${recipe.id}` : "/recipes"}
    >
      <span className="min-w-20 text-xs font-bold uppercase tracking-[0.14em] text-stone-400">
        {label}
      </span>
      <span className="min-w-0 flex-1 truncate text-right">
        {recipe?.title ?? "Pick a recipe"}
      </span>
      <CalendarDays aria-hidden="true" className="h-4 w-4 shrink-0" />
    </Link>
  );
}

function EmptyPanel({ text, title }: { text: string; title: string }) {
  return (
    <div className="rounded-lg border border-dashed border-stone-300 bg-white/60 p-6 shadow-sm">
      <h2 className="font-serif text-2xl text-stone-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-stone-600">{text}</p>
      <Link
        className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--tomato)] px-4 text-sm font-bold text-white shadow-sm"
        href="/add-recipe"
      >
        <PlusCircle aria-hidden="true" className="h-4 w-4" />
        Add recipe
      </Link>
    </div>
  );
}
