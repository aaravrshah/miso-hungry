"use client";

import { BookOpen, ChefHat, Search, SlidersHorizontal } from "lucide-react";
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
type RecipeScope = "mine" | "friends" | "public";

const recipeScopes: Array<{ description: string; label: string; value: RecipeScope }> = [
  {
    description: "Recipes you own or collaborate on",
    label: "My cookbook",
    value: "mine",
  },
  {
    description: "Recipes friends shared with friends",
    label: "Friends",
    value: "friends",
  },
  {
    description: "Public recipes from the app",
    label: "Explore",
    value: "public",
  },
];

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
  const { categories, error, friendRecipes, isLoading, publicRecipes, recipes } = useRecipes();
  const [scope, setScope] = useState<RecipeScope>("mine");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FilterValue>(initialCategory);
  const scopedRecipes =
    scope === "friends" ? friendRecipes : scope === "public" ? publicRecipes : recipes;

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
        ? scopedRecipes
        : scopedRecipes.filter((recipe) =>
            recipeMatchesCategory(recipe, selectedCategory.id, selectedCategory.name),
          );

    return recipesForCategory.filter((recipe) => matchesRecipe(recipe, query));
  }, [category, query, scopedRecipes, selectedCategory]);
  const categoryCounts = useMemo(
    () =>
      new Map(
        categories.map((item) => [
          item.id,
          scopedRecipes.filter((recipe) => recipeMatchesCategory(recipe, item.id, item.name)).length,
        ]),
      ),
    [categories, scopedRecipes],
  );
  const activeCategoryLabel = selectedCategory?.name ?? "All recipes";
  const activeScope = recipeScopes.find((item) => item.value === scope) ?? recipeScopes[0];

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
            {activeScope.description}.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-lg border border-stone-200 bg-white/60 p-1 shadow-sm sm:flex sm:w-fit">
          {recipeScopes.map((item) => (
            <button
              className={`min-h-10 rounded-md px-3 text-xs font-bold transition sm:text-sm ${
                scope === item.value
                  ? "bg-stone-950 text-white shadow-sm"
                  : "text-stone-600 hover:bg-white"
              }`}
              key={item.value}
              onClick={() => {
                setScope(item.value);
                setCategory("All");
              }}
              type="button"
            >
              {item.label}
            </button>
          ))}
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
        recipesCount={scopedRecipes.length}
        selectedCategory={category}
      />

      <div className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
        <DesktopCategorySidebar
          categoryCounts={categoryCounts}
          categories={categories}
          isLoading={isLoading}
          onSelectCategory={selectCategory}
          recipesCount={scopedRecipes.length}
          selectedCategory={category}
        />

        <div className="space-y-5">
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
                    : scope === "mine"
                      ? "Add your first recipe to start filling the cookbook."
                      : scope === "friends"
                        ? "Add friends or ask them to share recipes with friends."
                        : "Public recipes will appear here when people choose to share them."
                }
                emptyTitle={query || category !== "All" ? "No recipes found" : "No recipes yet"}
                recipes={filteredRecipes}
              />
            )}
          </section>

          {scope === "mine" ? (
            <details className="group hidden rounded-lg border border-stone-200 bg-white/65 shadow-sm lg:block">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-bold text-stone-700">
                Manage recipe albums
                <span className="text-[var(--tomato)] group-open:hidden">Open</span>
                <span className="hidden text-[var(--tomato)] group-open:inline">Close</span>
              </summary>
              <div className="border-t border-stone-200 p-3">
                <CategoryManager onSelectCategory={selectCategory} selectedCategory={category} />
              </div>
            </details>
          ) : null}
        </div>
      </div>

      {scope === "mine" ? (
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
      ) : null}
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

type DesktopCategorySidebarProps = {
  categories: ReturnType<typeof useRecipes>["categories"];
  categoryCounts: Map<string, number>;
  isLoading: boolean;
  onSelectCategory: (category: FilterValue) => void;
  recipesCount: number;
  selectedCategory: FilterValue;
};

function DesktopCategorySidebar({
  categories,
  categoryCounts,
  isLoading,
  onSelectCategory,
  recipesCount,
  selectedCategory,
}: DesktopCategorySidebarProps) {
  return (
    <aside className="sticky top-8 hidden max-h-[calc(100vh-4rem)] overflow-y-auto rounded-lg border border-stone-200 bg-white/72 p-3 shadow-sm lg:block">
      <div className="mb-3 px-2">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--tomato)]">
          Albums
        </p>
        <p className="mt-1 text-sm font-semibold text-stone-500">
          {isLoading ? "Loading..." : `${recipesCount} recipe${recipesCount === 1 ? "" : "s"}`}
        </p>
      </div>
      <div className="space-y-1.5">
        <DesktopCategoryButton
          active={selectedCategory === "All"}
          count={recipesCount}
          icon={BookOpen}
          name="All recipes"
          onSelect={() => onSelectCategory("All")}
        />
        {categories.map((item) => (
          <DesktopCategoryButton
            active={
              selectedCategory === item.id ||
              selectedCategory === item.slug ||
              selectedCategory === item.name
            }
            count={categoryCounts.get(item.id) ?? 0}
            icon={ChefHat}
            key={item.id}
            name={item.name}
            onSelect={() => onSelectCategory(item.id)}
          />
        ))}
      </div>
      {!isLoading && categories.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-stone-300 bg-white/65 p-3 text-sm font-semibold text-stone-500">
          No categories yet.
        </p>
      ) : null}
    </aside>
  );
}

type DesktopCategoryButtonProps = {
  active: boolean;
  count: number;
  icon: typeof ChefHat;
  name: string;
  onSelect: () => void;
};

function DesktopCategoryButton({
  active,
  count,
  icon: Icon,
  name,
  onSelect,
}: DesktopCategoryButtonProps) {
  return (
    <button
      className={`flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left transition ${
        active
          ? "bg-stone-950 text-white shadow-sm"
          : "text-stone-700 hover:bg-white"
      }`}
      onClick={onSelect}
      type="button"
    >
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${
          active ? "bg-white/15 text-white" : "bg-[#fff4e4] text-[var(--tomato)]"
        }`}
      >
        <Icon aria-hidden="true" className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold">{name}</span>
        <span
          className={`block text-xs font-semibold ${
            active ? "text-white/70" : "text-stone-500"
          }`}
        >
          {count} recipe{count === 1 ? "" : "s"}
        </span>
      </span>
    </button>
  );
}
