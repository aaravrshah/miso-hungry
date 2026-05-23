"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import {
  getRecipeCategoryNames,
  recipeMatchesCategory,
  type CategoryName,
  type Recipe,
} from "@/lib/recipes";
import { CategoryManager } from "@/components/CategoryManager";
import { RecipeGrid } from "@/components/RecipeGrid";
import { useRecipes } from "@/components/RecipeStore";

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

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--tomato)]">
            All Recipes
          </p>
          <h1 className="mt-2 font-serif text-4xl leading-tight text-stone-950 sm:text-5xl">
            Everything worth making again
          </h1>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <label className="relative block">
            <span className="sr-only">Search recipes</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400"
            />
            <input
              className="h-12 w-full rounded-lg border border-stone-200 bg-white/82 pl-12 pr-4 text-base text-stone-950 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-[var(--tomato)] focus:ring-4 focus:ring-red-100"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search recipes"
              type="search"
              value={query}
            />
          </label>

          <div className="flex min-h-12 items-center gap-2 rounded-lg border border-stone-200 bg-white/70 px-4 text-sm font-semibold text-stone-600 shadow-sm">
            <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
            <span>
              {isLoading ? "Loading..." : `${filteredRecipes.length} recipes`}
            </span>
          </div>
        </div>
      </section>

      <CategoryManager onSelectCategory={selectCategory} selectedCategory={category} />

      {error ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}

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
    </div>
  );
}
