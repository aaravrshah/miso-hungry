"use client";

import {
  BookOpen,
  Check,
  ChefHat,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
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

type CategoryManagerProps = {
  onSelectCategory: (category: FilterValue) => void;
  selectedCategory: FilterValue;
};

export function CategoryManager({
  onSelectCategory,
  selectedCategory,
}: CategoryManagerProps) {
  const {
    addCategory,
    categories,
    deleteCategory,
    error,
    isLoading,
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
  const [savingNewCategory, setSavingNewCategory] = useState(false);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>([]);

  const recipesByCategory = useMemo(
    () =>
      new Map(
        categories.map((category) => [
          category.id,
          recipes.filter((recipe) => recipeMatchesCategory(recipe, category.id, category.name)),
        ]),
      ),
    [categories, recipes],
  );
  const allRecipesCover = recipes.find((recipe) => recipe.coverImageUrl)?.coverImageUrl;
  const recentRecipes = useMemo(
    () =>
      [...recipes]
        .sort((first, second) =>
          (second.lastMadeDate ?? second.dateAdded).localeCompare(
            first.lastMadeDate ?? first.dateAdded,
          ),
        )
        .slice(0, 6),
    [recipes],
  );
  const recipeOptions = useMemo(() => {
    const normalizedQuery = recipeSearch.trim().toLowerCase();

    if (!normalizedQuery) {
      return recentRecipes;
    }

    return recipes
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
  }, [recipeSearch, recipes, recentRecipes]);

  function openEditMode() {
    setFormError(undefined);
    setDraftNames(
      Object.fromEntries(categories.map((category) => [category.id, category.name])),
    );
    setIsEditMode(true);
  }

  async function closeEditMode() {
    await saveAllDraftNames();
    setIsEditMode(false);
  }

  function openAddDialog() {
    setFormError(undefined);
    setIsAddOpen(true);
    setIsEditMode(false);
    setNewCategoryName("");
    setRecipeSearch("");
    setSelectedRecipeIds([]);
  }

  function closeAddDialog() {
    setIsAddOpen(false);
    setNewCategoryName("");
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
        coverImageUrl: undefined,
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

  async function saveAllDraftNames() {
    for (const category of categories) {
      await saveDraftName(category);
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

  async function submitNewCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(undefined);

    const trimmedName = newCategoryName.trim();

    if (!trimmedName) {
      setFormError("Category name is required.");
      return;
    }

    setSavingNewCategory(true);

    try {
      const savedCategory = await addCategory({
        description: "",
        name: trimmedName,
      });

      await Promise.all(
        selectedRecipeIds.map((recipeId) => {
          const recipe = recipes.find((item) => item.id === recipeId);

          if (!recipe) {
            return undefined;
          }

          return addRecipeToCategory(recipe, savedCategory);
        }),
      );

      closeAddDialog();
      onSelectCategory(savedCategory.id);
    } catch (categoryError) {
      setFormError(
        categoryError instanceof Error ? categoryError.message : "Unable to add category.",
      );
    } finally {
      setSavingNewCategory(false);
    }
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

  function handleNameKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    }
  }

  return (
    <section className="rounded-lg border border-stone-200 bg-white/72 p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--tomato)]">
            Categories
          </p>
          <h2 className="mt-2 font-serif text-3xl leading-tight text-stone-950">
            Recipe albums
          </h2>
        </div>

        <div className="flex gap-2">
          <button
            aria-label={isEditMode ? "Done editing categories" : "Rename or delete categories"}
            className={`grid min-h-11 min-w-11 place-items-center rounded-lg border text-sm font-bold shadow-sm transition ${
              isEditMode
                ? "border-[var(--tomato)] bg-[var(--tomato)] text-white"
                : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
            }`}
            onClick={() => {
              if (isEditMode) {
                void closeEditMode();
              } else {
                openEditMode();
              }
            }}
            title={isEditMode ? "Done editing" : "Rename or delete categories"}
            type="button"
          >
            {isEditMode ? (
              <Check aria-hidden="true" className="h-5 w-5" />
            ) : (
              <Pencil aria-hidden="true" className="h-5 w-5" />
            )}
          </button>
          <button
            aria-label="Add category"
            className="grid min-h-11 min-w-11 place-items-center rounded-lg bg-[var(--tomato)] text-white shadow-sm transition hover:bg-[#a94e3a]"
            onClick={openAddDialog}
            title="Add category"
            type="button"
          >
            <Plus aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="mt-4 rounded-lg border border-stone-200 bg-white/72 p-4 text-sm font-semibold text-stone-600">
          Loading categories...
        </p>
      ) : null}

      {formError || error ? (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
          {formError ?? error}
        </p>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CategoryTile
          active={selectedCategory === "All"}
          count={recipes.length}
          coverImageUrl={allRecipesCover}
          icon={BookOpen}
          name="All recipes"
          onSelect={() => onSelectCategory("All")}
        />

        {categories.map((category) => {
          const categoryRecipes = recipesByCategory.get(category.id) ?? [];
          const fallbackCover = categoryRecipes.find((recipe) => recipe.coverImageUrl)
            ?.coverImageUrl;

          return isEditMode ? (
            <EditableCategoryTile
              category={category}
              count={categoryRecipes.length}
              draftName={draftNames[category.id] ?? category.name}
              isSaving={savingCategoryId === category.id}
              key={category.id}
              onDelete={() => removeCategory(category.id)}
              onNameBlur={() => saveDraftName(category)}
              onNameChange={(value) => updateDraftName(category.id, value)}
              onNameKeyDown={handleNameKeyDown}
            />
          ) : (
            <CategoryTile
              active={
                selectedCategory === category.id ||
                selectedCategory === category.slug ||
                selectedCategory === category.name
              }
              count={categoryRecipes.length}
              coverImageUrl={category.coverImageUrl ?? fallbackCover}
              icon={ChefHat}
              key={category.id}
              name={category.name || "Untitled category"}
              onSelect={() => onSelectCategory(category.id)}
            />
          );
        })}
      </div>

      {!isLoading && categories.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-stone-300 bg-white/55 px-6 py-8 text-center">
          <h3 className="font-serif text-2xl text-stone-950">No categories yet</h3>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Add your own categories when you are ready.
          </p>
        </div>
      ) : null}

      {isAddOpen ? (
        <AddCategoryDialog
          formError={formError}
          isSaving={savingNewCategory}
          name={newCategoryName}
          onClose={closeAddDialog}
          onNameChange={setNewCategoryName}
          onRecipeSearchChange={setRecipeSearch}
          onSubmit={submitNewCategory}
          onToggleRecipe={toggleRecipeSelection}
          recipeOptions={recipeOptions}
          recipeSearch={recipeSearch}
          selectedRecipeIds={selectedRecipeIds}
        />
      ) : null}
    </section>
  );
}

type CategoryTileProps = {
  active: boolean;
  count: number;
  coverImageUrl?: string;
  icon: typeof ChefHat;
  name: string;
  onSelect: () => void;
};

function CategoryTile({
  active,
  count,
  coverImageUrl,
  icon: Icon,
  name,
  onSelect,
}: CategoryTileProps) {
  const content = (
    <>
      {coverImageUrl ? (
        <Image
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
          fill
          sizes="(min-width: 1280px) 18rem, (min-width: 640px) 50vw, 92vw"
          src={coverImageUrl}
        />
      ) : (
        <div className="absolute inset-0 bg-[#f8efe1]" />
      )}
      <div
        className={`absolute inset-0 ${
          coverImageUrl
            ? "bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent"
            : "bg-gradient-to-br from-white/70 via-transparent to-stone-200/70"
        }`}
      />
      {!coverImageUrl ? (
        <Icon
          aria-hidden="true"
          className="absolute right-4 top-4 h-9 w-9 text-[var(--tomato)]/45"
        />
      ) : null}
      <span className={`absolute inset-x-0 bottom-0 p-4 ${coverImageUrl ? "text-white" : "text-stone-950"}`}>
        <span className="block font-serif text-2xl leading-tight">{name}</span>
        <span
          className={`mt-1 block text-sm font-bold ${
            coverImageUrl ? "text-white/82" : "text-stone-500"
          }`}
        >
          {count} recipe{count === 1 ? "" : "s"}
        </span>
      </span>
    </>
  );

  return (
    <button
      className={`group relative block min-h-40 w-full overflow-hidden rounded-lg text-left shadow-sm ring-1 transition ${
        active
          ? "ring-[var(--tomato)]"
          : "ring-stone-200 hover:-translate-y-0.5 hover:ring-stone-300"
      }`}
      onClick={onSelect}
      type="button"
    >
      {content}
    </button>
  );
}

type EditableCategoryTileProps = {
  category: Category;
  count: number;
  draftName: string;
  isSaving: boolean;
  onDelete: () => void;
  onNameBlur: () => void;
  onNameChange: (value: string) => void;
  onNameKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
};

function EditableCategoryTile({
  category,
  count,
  draftName,
  isSaving,
  onDelete,
  onNameBlur,
  onNameChange,
  onNameKeyDown,
}: EditableCategoryTileProps) {
  return (
    <article className="relative min-h-40 rounded-lg border border-stone-200 bg-[#f8efe1] p-4 shadow-sm">
      <ChefHat
        aria-hidden="true"
        className="absolute right-4 top-4 h-9 w-9 text-[var(--tomato)]/35"
      />
      <div className="relative flex h-full min-h-32 flex-col justify-end gap-3">
        <label className="space-y-2">
          <span className="sr-only">Category name for {category.name}</span>
          <input
            className="w-full rounded-lg border border-stone-200 bg-white/92 px-3 py-2 font-serif text-2xl leading-tight text-stone-950 shadow-sm outline-none transition focus:border-[var(--tomato)] focus:ring-4 focus:ring-red-100"
            onBlur={onNameBlur}
            onChange={(event) => onNameChange(event.target.value)}
            onKeyDown={onNameKeyDown}
            value={draftName}
          />
        </label>
        <div className="flex items-center justify-between gap-3 text-sm font-bold text-stone-500">
          <span>
            {count} recipe{count === 1 ? "" : "s"}
          </span>
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving}
            onClick={onDelete}
            type="button"
          >
            {isSaving ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 aria-hidden="true" className="h-4 w-4" />
            )}
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

type AddCategoryDialogProps = {
  formError?: string;
  isSaving: boolean;
  name: string;
  onClose: () => void;
  onNameChange: (value: string) => void;
  onRecipeSearchChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onToggleRecipe: (recipeId: string) => void;
  recipeOptions: Recipe[];
  recipeSearch: string;
  selectedRecipeIds: string[];
};

function AddCategoryDialog({
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
}: AddCategoryDialogProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-stone-950/35 p-0 backdrop-blur-sm sm:place-items-center sm:p-4">
      <form
        className="max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl border border-stone-200 bg-[#fffaf1] p-5 shadow-xl sm:max-w-2xl sm:rounded-lg sm:p-6"
        onSubmit={onSubmit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--tomato)]">
              New Category
            </p>
            <h3 className="mt-2 font-serif text-3xl leading-tight text-stone-950">
              Name the album
            </h3>
          </div>
          <button
            aria-label="Close add category dialog"
            className="grid min-h-10 min-w-10 place-items-center rounded-lg border border-stone-200 bg-white text-stone-500"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <label className="mt-5 block space-y-2">
          <span className="text-sm font-bold text-stone-700">Category name</span>
          <input
            autoFocus
            className={inputClassName}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Desserts"
            required
            value={name}
          />
        </label>

        <div className="mt-5 space-y-3">
          <div>
            <h4 className="font-serif text-2xl text-stone-950">Add recipes now</h4>
            <p className="mt-1 text-sm leading-6 text-stone-600">
              Optional. Pick recent recipes or search your cookbook.
            </p>
          </div>
          <label className="relative block">
            <span className="sr-only">Search recipes to add to category</span>
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
            Add category
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClassName =
  "h-12 w-full rounded-lg border border-stone-200 bg-white px-4 text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-[var(--tomato)] focus:ring-4 focus:ring-red-100";
