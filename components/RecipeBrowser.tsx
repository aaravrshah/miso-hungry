"use client";

import {
  BookOpen,
  Check,
  ChefHat,
  Loader2,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import { CategoryPill } from "@/components/CategoryPill";
import { RecipeGrid } from "@/components/RecipeGrid";
import { useRecipes } from "@/components/RecipeStore";
import {
  getRecipeCategoryIds,
  getRecipeCategoryNames,
  recipeMatchesCategory,
  type Category,
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
          canManage={scope === "mine"}
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
        </div>
      </div>
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
  canManage: boolean;
  categoryCounts: Map<string, number>;
  isLoading: boolean;
  onSelectCategory: (category: FilterValue) => void;
  recipesCount: number;
  selectedCategory: FilterValue;
};

function DesktopCategorySidebar({
  categories,
  canManage,
  categoryCounts,
  isLoading,
  onSelectCategory,
  recipesCount,
  selectedCategory,
}: DesktopCategorySidebarProps) {
  const {
    addCategory,
    deleteCategory,
    error,
    recipes,
    updateCategory,
    updateRecipe,
  } = useRecipes();
  const [draftNames, setDraftNames] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [recipeSearch, setRecipeSearch] = useState("");
  const [savingCategoryId, setSavingCategoryId] = useState<string | undefined>();
  const [savingRecipePicker, setSavingRecipePicker] = useState(false);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>([]);
  const [recipePickerCategory, setRecipePickerCategory] = useState<Category | undefined>();
  const activePickerCategory = recipePickerCategory;
  const recipeOptions = useMemo(() => {
    const normalizedQuery = recipeSearch.trim().toLowerCase();
    const candidateRecipes = activePickerCategory
      ? recipes.filter(
          (recipe) =>
            !recipeMatchesCategory(recipe, activePickerCategory.id, activePickerCategory.name),
        )
      : recipes;
    const sortedRecipes = [...candidateRecipes].sort((first, second) =>
      (second.lastMadeDate ?? second.dateAdded).localeCompare(
        first.lastMadeDate ?? first.dateAdded,
      ),
    );

    if (!normalizedQuery) {
      return sortedRecipes.slice(0, 8);
    }

    return sortedRecipes
      .filter((recipe) =>
        [
          recipe.title,
          recipe.description,
          recipe.cuisine,
          ...(recipe.tags ?? []),
          ...getRecipeCategoryNames(recipe),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery),
      )
      .slice(0, 8);
  }, [activePickerCategory, recipeSearch, recipes]);

  function openEditMode() {
    setFormError(undefined);
    setDraftNames(
      Object.fromEntries(categories.map((category) => [category.id, category.name])),
    );
    setIsEditMode(true);
  }

  async function closeEditMode() {
    for (const category of categories) {
      await saveDraftName(category);
    }

    setIsEditMode(false);
  }

  function openAddDialog() {
    setFormError(undefined);
    setIsAddOpen(true);
    setRecipePickerCategory(undefined);
    setNewCategoryName("");
    setRecipeSearch("");
    setSelectedRecipeIds([]);
  }

  function closeRecipeDialog() {
    setIsAddOpen(false);
    setRecipePickerCategory(undefined);
    setNewCategoryName("");
    setRecipeSearch("");
    setSelectedRecipeIds([]);
  }

  function openRecipePicker(category: Category) {
    setFormError(undefined);
    setIsAddOpen(false);
    setRecipePickerCategory(category);
    setRecipeSearch("");
    setSelectedRecipeIds([]);
  }

  function updateDraftName(categoryId: string, value: string) {
    setDraftNames((currentNames) => ({
      ...currentNames,
      [categoryId]: value,
    }));
  }

  async function saveDraftName(category: Category) {
    const nextName = (draftNames[category.id] ?? category.name).trim();

    if (!nextName || nextName === category.name) {
      return;
    }

    setSavingCategoryId(category.id);
    setFormError(undefined);

    try {
      await updateCategory(category.id, {
        description: category.description ?? "",
        name: nextName,
      });
    } catch (categoryError) {
      setFormError(
        categoryError instanceof Error ? categoryError.message : "Unable to rename category.",
      );
      setDraftNames((currentNames) => ({
        ...currentNames,
        [category.id]: category.name,
      }));
    } finally {
      setSavingCategoryId(undefined);
    }
  }

  async function removeCategory(categoryId: string) {
    const category = categories.find((item) => item.id === categoryId);
    const usedByCount = recipes.filter((recipe) =>
      recipeMatchesCategory(recipe, categoryId, category?.name),
    ).length;
    const message = usedByCount
      ? `Delete "${category?.name ?? "this category"}" and remove it from ${usedByCount} recipe${
          usedByCount === 1 ? "" : "s"
        }?`
      : `Delete "${category?.name ?? "this category"}"?`;

    if (!window.confirm(message)) {
      return;
    }

    setSavingCategoryId(categoryId);
    setFormError(undefined);

    try {
      await deleteCategory(categoryId);
      if (selectedCategory === categoryId || selectedCategory === category?.name) {
        onSelectCategory("All");
      }
    } catch (deleteError) {
      setFormError(
        deleteError instanceof Error ? deleteError.message : "Unable to delete category.",
      );
    } finally {
      setSavingCategoryId(undefined);
    }
  }

  function toggleRecipeSelection(recipeId: string) {
    setSelectedRecipeIds((currentIds) =>
      currentIds.includes(recipeId)
        ? currentIds.filter((currentId) => currentId !== recipeId)
        : [...currentIds, recipeId],
    );
  }

  async function addRecipeToCategory(recipe: Recipe, category: Category) {
    const currentCategoryIds = getRecipeCategoryIds(recipe);
    const currentCategoryNames = getRecipeCategoryNames(recipe);

    if (
      currentCategoryIds.includes(category.id) ||
      currentCategoryNames.includes(category.name)
    ) {
      return;
    }

    const nextCategoryIds = [...currentCategoryIds, category.id];
    const nextCategoryNames = [...currentCategoryNames, category.name];

    await updateRecipe(recipe.id, {
      ...recipe,
      category: nextCategoryNames[0] ?? category.name,
      categoryId: nextCategoryIds[0] ?? category.id,
      categories: nextCategoryNames,
      categoryIds: nextCategoryIds,
    });
  }

  async function submitNewCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(undefined);

    const trimmedName = newCategoryName.trim();

    if (!trimmedName) {
      setFormError("Category name is required.");
      return;
    }

    setSavingRecipePicker(true);

    try {
      const savedCategory = await addCategory({
        description: "",
        name: trimmedName,
      });

      await Promise.all(
        selectedRecipeIds.map((recipeId) => {
          const recipe = recipes.find((item) => item.id === recipeId);
          return recipe ? addRecipeToCategory(recipe, savedCategory) : undefined;
        }),
      );

      closeRecipeDialog();
      onSelectCategory(savedCategory.id);
    } catch (categoryError) {
      setFormError(
        categoryError instanceof Error ? categoryError.message : "Unable to add category.",
      );
    } finally {
      setSavingRecipePicker(false);
    }
  }

  async function submitExistingCategoryRecipes(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activePickerCategory) {
      return;
    }

    setSavingRecipePicker(true);
    setFormError(undefined);

    try {
      await Promise.all(
        selectedRecipeIds.map((recipeId) => {
          const recipe = recipes.find((item) => item.id === recipeId);
          return recipe ? addRecipeToCategory(recipe, activePickerCategory) : undefined;
        }),
      );
      closeRecipeDialog();
      onSelectCategory(activePickerCategory.id);
    } catch (recipeError) {
      setFormError(
        recipeError instanceof Error ? recipeError.message : "Unable to add recipes.",
      );
    } finally {
      setSavingRecipePicker(false);
    }
  }

  function handleNameKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    }
  }

  return (
    <aside className="sticky top-8 hidden max-h-[calc(100vh-4rem)] overflow-y-auto rounded-lg border border-stone-200 bg-white/72 p-3 shadow-sm lg:block">
      <div className="mb-3 flex items-start justify-between gap-3 px-2">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--tomato)]">
            Albums
          </p>
          <p className="mt-1 text-sm font-semibold text-stone-500">
            {isLoading ? "Loading..." : `${recipesCount} recipe${recipesCount === 1 ? "" : "s"}`}
          </p>
        </div>
        {canManage ? (
          <div className="flex gap-1.5">
            <button
              aria-label={isEditMode ? "Done editing albums" : "Edit albums"}
              className={`grid h-9 w-9 place-items-center rounded-lg border text-sm font-bold shadow-sm transition ${
                isEditMode
                  ? "border-[var(--tomato)] bg-[var(--tomato)] text-white"
                  : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
              }`}
              onClick={() => {
                if (isEditMode) {
                  void closeEditMode();
                } else {
                  openEditMode();
                }
              }}
              title={isEditMode ? "Done editing" : "Edit albums"}
              type="button"
            >
              {isEditMode ? (
                <Check aria-hidden="true" className="h-4 w-4" />
              ) : (
                <Pencil aria-hidden="true" className="h-4 w-4" />
              )}
            </button>
            <button
              aria-label="Add album"
              className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--tomato)] text-white shadow-sm transition hover:bg-[#a94e3a]"
              onClick={openAddDialog}
              title="Add album"
              type="button"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>
      {formError || error ? (
        <p className="mb-3 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700">
          {formError ?? error}
        </p>
      ) : null}
      <div className="space-y-1.5">
        <DesktopCategoryButton
          active={selectedCategory === "All"}
          count={recipesCount}
          icon={BookOpen}
          name="All recipes"
          onSelect={() => onSelectCategory("All")}
        />
        {categories.map((item) =>
          isEditMode && canManage ? (
            <DesktopEditableCategoryButton
              count={categoryCounts.get(item.id) ?? 0}
              draftName={draftNames[item.id] ?? item.name}
              isSaving={savingCategoryId === item.id}
              key={item.id}
              onAddRecipes={() => openRecipePicker(item)}
              onDelete={() => removeCategory(item.id)}
              onNameBlur={() => saveDraftName(item)}
              onNameChange={(value) => updateDraftName(item.id, value)}
              onNameKeyDown={handleNameKeyDown}
            />
          ) : (
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
          ),
        )}
      </div>
      {!isLoading && categories.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-stone-300 bg-white/65 p-3 text-sm font-semibold text-stone-500">
          No categories yet.
        </p>
      ) : null}
      {isAddOpen ? (
        <AlbumRecipePickerDialog
          formError={formError}
          isSaving={savingRecipePicker}
          name={newCategoryName}
          onClose={closeRecipeDialog}
          onNameChange={setNewCategoryName}
          onRecipeSearchChange={setRecipeSearch}
          onSubmit={submitNewCategory}
          onToggleRecipe={toggleRecipeSelection}
          recipeOptions={recipeOptions}
          recipeSearch={recipeSearch}
          selectedRecipeIds={selectedRecipeIds}
          submitLabel="Add album"
          title="New album"
        />
      ) : null}
      {activePickerCategory ? (
        <AlbumRecipePickerDialog
          formError={formError}
          isSaving={savingRecipePicker}
          onClose={closeRecipeDialog}
          onRecipeSearchChange={setRecipeSearch}
          onSubmit={submitExistingCategoryRecipes}
          onToggleRecipe={toggleRecipeSelection}
          recipeOptions={recipeOptions}
          recipeSearch={recipeSearch}
          selectedRecipeIds={selectedRecipeIds}
          submitLabel="Add recipes"
          title={`Add to ${activePickerCategory.name}`}
        />
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

type DesktopEditableCategoryButtonProps = {
  count: number;
  draftName: string;
  isSaving: boolean;
  onAddRecipes: () => void;
  onDelete: () => void;
  onNameBlur: () => void;
  onNameChange: (value: string) => void;
  onNameKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
};

function DesktopEditableCategoryButton({
  count,
  draftName,
  isSaving,
  onAddRecipes,
  onDelete,
  onNameBlur,
  onNameChange,
  onNameKeyDown,
}: DesktopEditableCategoryButtonProps) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-2 shadow-sm">
      <label className="block">
        <span className="sr-only">Album name</span>
        <input
          className="h-10 w-full rounded-md border border-stone-200 bg-[#fffaf1] px-3 text-sm font-bold text-stone-950 outline-none transition focus:border-[var(--tomato)] focus:ring-4 focus:ring-red-100"
          onBlur={onNameBlur}
          onChange={(event) => onNameChange(event.target.value)}
          onKeyDown={onNameKeyDown}
          value={draftName}
        />
      </label>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="truncate text-xs font-semibold text-stone-500">
          {count} recipe{count === 1 ? "" : "s"}
        </span>
        <div className="flex gap-1">
          <button
            aria-label={`Add recipes to ${draftName}`}
            className="grid h-8 w-8 place-items-center rounded-md border border-stone-200 bg-white text-stone-600 transition hover:bg-stone-50"
            disabled={isSaving}
            onClick={onAddRecipes}
            title="Add recipes"
            type="button"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
          </button>
          <button
            aria-label={`Delete ${draftName}`}
            className="grid h-8 w-8 place-items-center rounded-md border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving}
            onClick={onDelete}
            title="Delete album"
            type="button"
          >
            {isSaving ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 aria-hidden="true" className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

type AlbumRecipePickerDialogProps = {
  formError?: string;
  isSaving: boolean;
  name?: string;
  onClose: () => void;
  onNameChange?: (value: string) => void;
  onRecipeSearchChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onToggleRecipe: (recipeId: string) => void;
  recipeOptions: Recipe[];
  recipeSearch: string;
  selectedRecipeIds: string[];
  submitLabel: string;
  title: string;
};

function AlbumRecipePickerDialog({
  formError,
  isSaving,
  name,
  onClose,
  onNameChange,
  onRecipeSearchChange,
  onSubmit,
  onToggleRecipe,
  recipeOptions,
  recipeSearch,
  selectedRecipeIds,
  submitLabel,
  title,
}: AlbumRecipePickerDialogProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-stone-950/35 p-0 backdrop-blur-sm sm:place-items-center sm:p-4">
      <form
        className="max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl border border-stone-200 bg-[#fffaf1] p-5 shadow-xl sm:max-w-2xl sm:rounded-lg sm:p-6"
        onSubmit={onSubmit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--tomato)]">
              Albums
            </p>
            <h3 className="mt-2 font-serif text-3xl leading-tight text-stone-950">
              {title}
            </h3>
          </div>
          <button
            aria-label="Close album dialog"
            className="grid min-h-10 min-w-10 place-items-center rounded-lg border border-stone-200 bg-white text-stone-500"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        {onNameChange ? (
          <label className="mt-5 block space-y-2">
            <span className="text-sm font-bold text-stone-700">Album name</span>
            <input
              autoFocus
              className="h-12 w-full rounded-lg border border-stone-200 bg-white px-4 text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-[var(--tomato)] focus:ring-4 focus:ring-red-100"
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="Desserts"
              required
              value={name ?? ""}
            />
          </label>
        ) : null}

        <div className="mt-5 space-y-3">
          <div>
            <h4 className="font-serif text-2xl text-stone-950">Add recipes</h4>
            <p className="mt-1 text-sm leading-6 text-stone-600">
              Pick recent recipes or search your cookbook.
            </p>
          </div>
          <label className="relative block">
            <span className="sr-only">Search recipes to add to album</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400"
            />
            <input
              className="h-12 w-full rounded-lg border border-stone-200 bg-white pl-12 pr-4 text-base text-stone-950 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-[var(--tomato)] focus:ring-4 focus:ring-red-100"
              onChange={(event) => onRecipeSearchChange(event.target.value)}
              placeholder="Search recipes"
              type="search"
              value={recipeSearch}
            />
          </label>

          <div className="grid gap-2">
            {recipeOptions.map((recipe) => (
              <label
                className="flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border border-stone-200 bg-white/80 px-3 py-2 shadow-sm"
                key={recipe.id}
              >
                <input
                  checked={selectedRecipeIds.includes(recipe.id)}
                  className="h-6 w-6 rounded border-stone-300 accent-[var(--tomato)]"
                  onChange={() => onToggleRecipe(recipe.id)}
                  type="checkbox"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-stone-800">
                    {recipe.title}
                  </span>
                  <span className="block truncate text-xs font-semibold text-stone-500">
                    {getRecipeCategoryNames(recipe).join(", ") || "No category yet"}
                  </span>
                </span>
              </label>
            ))}
          </div>

          {recipeOptions.length === 0 ? (
            <p className="rounded-lg border border-dashed border-stone-300 bg-white/60 p-4 text-sm font-semibold text-stone-500">
              No recipes found.
            </p>
          ) : null}
        </div>

        {formError ? (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
            {formError}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-stone-200 bg-white px-4 text-sm font-bold text-stone-600"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--tomato)] px-4 text-sm font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <Plus aria-hidden="true" className="h-4 w-4" />
            )}
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
