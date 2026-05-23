"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { type CategoryName, type Recipe } from "@/lib/recipes";
import { CategoryPill } from "@/components/CategoryPill";
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
  const { categories, error, isLoading, loadRecipesByCategory, recipes } = useRecipes();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FilterValue>(initialCategory);
  const [categoryRecipes, setCategoryRecipes] = useState<Recipe[] | undefined>();
  const [filterError, setFilterError] = useState<string | undefined>();
  const [isFiltering, setIsFiltering] = useState(false);

  async function selectCategory(nextCategory: FilterValue) {
    setCategory(nextCategory);
    setFilterError(undefined);

    if (nextCategory === "All") {
      setCategoryRecipes(undefined);
      return;
    }

    const selectedCategory = categories.find(
      (item) =>
        item.id === nextCategory || item.slug === nextCategory || item.name === nextCategory,
    );

    if (!selectedCategory) {
      setCategoryRecipes(undefined);
      return;
    }

    setIsFiltering(true);

    try {
      setCategoryRecipes(await loadRecipesByCategory(selectedCategory.id));
    } catch (categoryError) {
      setFilterError(
        categoryError instanceof Error
          ? categoryError.message
          : "Unable to load this category.",
      );
    } finally {
      setIsFiltering(false);
    }
  }

  useEffect(() => {
    if (initialCategory !== "All" && categories.length > 0) {
      window.queueMicrotask(() => {
        selectCategory(initialCategory);
      });
    }
    // Run once when categories arrive so URLs like /recipes?category=pasta hydrate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories.length, initialCategory]);

  const filteredRecipes = useMemo(
    () => (categoryRecipes ?? recipes).filter((recipe) => matchesRecipe(recipe, query)),
    [categoryRecipes, query, recipes],
  );

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
              {isLoading || isFiltering ? "Loading..." : `${filteredRecipes.length} recipes`}
            </span>
          </div>
        </div>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          <CategoryPill
            active={category === "All"}
            count={recipes.length}
            name="All"
            onClick={() => selectCategory("All")}
          />
          {categories.map((item) => (
            <CategoryPill
              active={
                category === item.id || category === item.slug || category === item.name
              }
              count={
                recipes.filter(
                  (recipe) => recipe.categoryId === item.id || recipe.category === item.name,
                ).length
              }
              key={item.id}
              name={item.name}
              onClick={() => selectCategory(item.id)}
            />
          ))}
        </div>
      </section>

      {error || filterError ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
          {filterError ?? error}
        </p>
      ) : null}

      {(isLoading || isFiltering) && filteredRecipes.length === 0 ? (
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
