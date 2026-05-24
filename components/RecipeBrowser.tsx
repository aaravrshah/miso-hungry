"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { CategoryPill } from "@/components/CategoryPill";
import { CategoryManager } from "@/components/CategoryManager";
import { RecipeGrid } from "@/components/RecipeGrid";
import { useRecipes } from "@/components/RecipeStore";
import {
  getRecipeCategoryNames,
  recipeMatchesCategory,
  type CategoryName,
  type Recipe,
} from "@/lib/recipes";

type FilterValue = CategoryName | "All";

type RecipeBrowserProps = {
  initialCategory?: FilterValue;
};

function matchesRecipe(recipe: Recipe, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  const inSearch =
    normalizedQuery.length === 0 ||
    [
      recipe.title,
      recipe.description,
      recipe.category,
      ...getRecipeCategoryNames(recipe),
      recipe.cuisine,
      recipe.notes,
      ...(recipe.tags ?? []),
      ...recipe.ingredients.flatMap((ingredient) => [
        ingredient.item,
        ingredient.brand,
        ingredient.productName,
        ingredient.note,
      ]),
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);

  return inSearch;
}

export function RecipeBrowser({ initialCategory = "All" }: RecipeBrowserProps) {
  const { categories, error, isLoading, recipes } = useRecipes();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FilterValue>(initialCategory);

  function selectCategory(nextCategory: FilterValue) {
    setCategory(nextCategory);
  }

  const selectedCategory =
    category === "All"
      ? undefined
      : categories.find(
          (item) => item.id === category || item.slug === category || item.name === category,
        );
  const filteredRecipes = useMemo(() => {
    const recipesForCategory =
      category === "All" || !selectedCategory
        ? recipes
        : recipes.filter((recipe) =>
            recipeMatchesCategory(recipe, selectedCategory.id, selectedCategory.name),
          );

    return recipesForCategory.filter((recipe) => matchesRecipe(recipe, query));
  }, [category, query, recipes, selectedCategory]);
  const categoryCounts = useMemo(
    () =>
      new Map(
        categories.map((item) => [
          item.id,
          recipes.filter((recipe) => recipeMatchesCategory(recipe, item.id, item.name)).length,
        ]),
      ),
    [categories, recipes],
  );
  const activeCategoryLabel = selectedCategory?.name ?? "All recipes";

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="space-y-3 sm:space-y-4">
        <div>
          <p className="hidden text-sm font-bold uppercase tracking-[0.18em] text-[var(--tomato)] sm:block">
            All Recipes
          </p>
          <h1 className="font-serif text-3xl leading-tight text-stone-950 sm:mt-2 sm:text-5xl">
            Recipes
          </h1>
          <p className="mt-1 hidden text-sm font-medium text-stone-500 sm:block">
            Everything worth making again.
          </p>
        </div>

        <div className="grid gap-2 lg:grid-cols-[1fr_auto] lg:gap-3">
          <label className="relative block">
            <span className="sr-only">Search recipes</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400"
            />
            <input
              className="h-11 w-full rounded-lg border border-stone-200 bg-white/82 pl-12 pr-4 text-base text-stone-950 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-[var(--tomato)] focus:ring-4 focus:ring-red-100 sm:h-12"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search recipes"
              type="search"
              value={query}
            />
          </label>

          <div className="hidden min-h-12 items-center gap-2 rounded-lg border border-stone-200 bg-white/70 px-4 text-sm font-semibold text-stone-600 shadow-sm lg:flex">
            <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
            <span>
              {isLoading ? "Loading..." : `${filteredRecipes.length} recipes`}
            </span>
          </div>
        </div>
      </section>

      <MobileCategoryRail
        categoryCounts={categoryCounts}
        categories={categories}
        isLoading={isLoading}
        onSelectCategory={selectCategory}
        recipesCount={recipes.length}
        selectedCategory={category}
      />

      <div className="hidden lg:block">
        <CategoryManager onSelectCategory={selectCategory} selectedCategory={category} />
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate font-serif text-2xl leading-tight text-stone-950 sm:text-3xl">
              {activeCategoryLabel}
            </h2>
            <p className="mt-1 text-sm font-semibold text-stone-500">
              {isLoading ? "Loading..." : `${filteredRecipes.length} recipe${
                filteredRecipes.length === 1 ? "" : "s"
              }`}
            </p>
          </div>
          <div className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-stone-200 bg-white/70 px-3 text-xs font-bold text-stone-600 shadow-sm lg:hidden">
            <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
            {query ? "Filtered" : "Browse"}
          </div>
        </div>

      {isLoading && filteredRecipes.length === 0 ? (
        <p className="rounded-lg border border-stone-200 bg-white/72 p-4 text-sm font-semibold text-stone-600 shadow-sm">
          Loading recipes...
        </p>
      ) : (
        <RecipeGrid
          emptyText={
            query || category !== "All"
              ? "Try another search or category."
              : "Add your first recipe to start filling the cookbook."
          }
          emptyTitle={query || category !== "All" ? "No recipes found" : "No recipes yet"}
          recipes={filteredRecipes}
        />
      )}
      </section>

      <details className="group rounded-lg border border-stone-200 bg-white/65 shadow-sm lg:hidden">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-bold text-stone-700">
          Manage recipe albums
          <span className="text-[var(--tomato)] group-open:hidden">Open</span>
          <span className="hidden text-[var(--tomato)] group-open:inline">Close</span>
        </summary>
        <div className="border-t border-stone-200 p-3">
          <CategoryManager onSelectCategory={selectCategory} selectedCategory={category} />
        </div>
      </details>
    </div>
  );
}

type MobileCategoryRailProps = {
  categories: ReturnType<typeof useRecipes>["categories"];
  categoryCounts: Map<string, number>;
  isLoading: boolean;
  onSelectCategory: (category: FilterValue) => void;
  recipesCount: number;
  selectedCategory: FilterValue;
};

function MobileCategoryRail({
  categories,
  categoryCounts,
  isLoading,
  onSelectCategory,
  recipesCount,
  selectedCategory,
}: MobileCategoryRailProps) {
  if (isLoading && categories.length === 0) {
    return (
      <div className="lg:hidden">
        <p className="rounded-lg border border-stone-200 bg-white/72 p-3 text-sm font-semibold text-stone-600 shadow-sm">
          Loading categories...
        </p>
      </div>
    );
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-1 lg:hidden">
      <div className="flex gap-2">
        <CategoryPill
          active={selectedCategory === "All"}
          count={recipesCount}
          name="All"
          onClick={() => onSelectCategory("All")}
        />
        {categories.map((item) => (
          <CategoryPill
            active={
              selectedCategory === item.id ||
              selectedCategory === item.slug ||
              selectedCategory === item.name
            }
            count={categoryCounts.get(item.id) ?? 0}
            key={item.id}
            name={item.name}
            onClick={() => onSelectCategory(item.id)}
          />
        ))}
      </div>
    </div>
  );
}
