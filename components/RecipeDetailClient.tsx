"use client";

import {
  ArrowLeft,
  ExternalLink,
  Pencil,
  Plus,
  Save,
  Timer,
  Trash2,
  Utensils,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { AddRecipeForm } from "@/components/AddRecipeForm";
import { CategoryPill } from "@/components/CategoryPill";
import {
  CookingMode,
  createCookingProgress,
  reconcileCookingProgress,
} from "@/components/CookingMode";
import { RecipeGrid } from "@/components/RecipeGrid";
import { useRecipes } from "@/components/RecipeStore";
import { StarRating } from "@/components/StarRating";
import type { CookedBy, CookLog, CookLogInput } from "@/lib/firebase/schema";
import {
  averageRating,
  formatRecipeDate,
  formatRating,
  formatTimerMinutes,
  getRecipeCategoryNames,
  type Recipe,
} from "@/lib/recipes";
import { todayString } from "@/lib/services/helpers";

type RecipeDetailClientProps = {
  recipeId: string;
};

const tabs = ["Overview", "Ingredients", "Directions", "Notes", "Cook History"] as const;
type DetailTab = (typeof tabs)[number];
const cookedByOptions: CookedBy[] = ["Aarav", "Sophie", "Both"];

export function RecipeDetailClient({ recipeId }: RecipeDetailClientProps) {
  const router = useRouter();
  const { deleteRecipe, error: storeError, isLoading, markRecipeMade, recipes } = useRecipes();
  const [activeTab, setActiveTab] = useState<DetailTab>("Overview");
  const [actionError, setActionError] = useState<string | undefined>();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoggingCook, setIsLoggingCook] = useState(false);
  const [isCookingMode, setIsCookingMode] = useState(false);
  const [cookingProgress, setCookingProgress] = useState(() => createCookingProgress());
  const [editing, setEditing] = useState(false);
  const recipe = recipes.find((item) => item.id === recipeId);
  const recipeCategories = recipe ? getRecipeCategoryNames(recipe) : [];
  const cookingRecipeId = recipe?.id ?? "";
  const cookingIngredientCount = recipe?.ingredients.length ?? 0;
  const cookingDirectionCount = recipe?.directions.length ?? 0;
  const rating = recipe ? averageRating(recipe) : undefined;
  const relatedRecipes = recipe
    ? recipes
        .filter(
          (item) =>
            item.id !== recipe.id &&
            getRecipeCategoryNames(item).some((category) =>
              recipeCategories.includes(category),
            ),
        )
        .slice(0, 3)
    : [];

  useEffect(() => {
    if (!cookingRecipeId) {
      return;
    }

    window.queueMicrotask(() => {
      setCookingProgress((current) =>
        reconcileCookingProgress(current, {
          directionCount: cookingDirectionCount,
          ingredientCount: cookingIngredientCount,
          recipeId: cookingRecipeId,
        }),
      );
    });
  }, [cookingDirectionCount, cookingIngredientCount, cookingRecipeId]);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-stone-200 bg-white/72 p-6 text-stone-600 shadow-sm">
        Loading recipe...
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="space-y-4 rounded-lg border border-stone-200 bg-white/72 p-6 shadow-sm">
        <h1 className="font-serif text-3xl text-stone-950">Recipe not found</h1>
        <p className="text-sm leading-6 text-stone-600">
          This recipe may have been deleted from your local cookbook.
        </p>
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--tomato)] px-4 text-sm font-bold text-white"
          href="/recipes"
        >
          Back to recipes
        </Link>
      </div>
    );
  }

  if (isCookingMode) {
    return (
      <CookingMode
        onExit={() => setIsCookingMode(false)}
        progress={cookingProgress}
        recipe={recipe}
        setProgress={setCookingProgress}
      />
    );
  }

  if (editing) {
    return (
      <div className="space-y-6">
        <button
          className="inline-flex items-center gap-2 text-sm font-bold text-[var(--tomato)]"
          onClick={() => setEditing(false)}
          type="button"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Recipe detail
        </button>
        <AddRecipeForm
          mode="edit"
          onSaved={() => {
            setEditing(false);
            setActiveTab("Overview");
          }}
          recipe={recipe}
        />
      </div>
    );
  }

  return (
    <article className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          className="inline-flex items-center gap-2 text-sm font-bold text-[var(--tomato)]"
          href="/recipes"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          All recipes
        </Link>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--tomato)] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#a94e3a]"
            onClick={() => setIsCookingMode(true)}
            type="button"
          >
            <Utensils aria-hidden="true" className="h-4 w-4" />
            Cook This
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 shadow-sm transition hover:bg-stone-50"
            disabled={isLoggingCook}
            onClick={async () => {
              setIsLoggingCook(true);
              setActionError(undefined);

              try {
                await markRecipeMade(recipe.id);
              } catch (markError) {
                setActionError(
                  markError instanceof Error ? markError.message : "Unable to log this cook.",
                );
              } finally {
                setIsLoggingCook(false);
              }
            }}
            type="button"
          >
            <Utensils aria-hidden="true" className="h-4 w-4" />
            {isLoggingCook ? "Logging..." : "Mark made"}
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 shadow-sm transition hover:bg-stone-50"
            onClick={() => setEditing(true)}
            type="button"
          >
            <Pencil aria-hidden="true" className="h-4 w-4" />
            Edit
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-700 shadow-sm transition hover:bg-red-100"
            disabled={isDeleting}
            onClick={async () => {
              if (window.confirm(`Delete "${recipe.title}" from your cookbook?`)) {
                setIsDeleting(true);
                setActionError(undefined);

                try {
                  await deleteRecipe(recipe.id);
                  router.push("/recipes");
                } catch (deleteError) {
                  setActionError(
                    deleteError instanceof Error
                      ? deleteError.message
                      : "Unable to delete this recipe.",
                  );
                  setIsDeleting(false);
                }
              }
            }}
            type="button"
          >
            <Trash2 aria-hidden="true" className="h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      {actionError || storeError ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
          {actionError ?? storeError}
        </p>
      ) : null}

      <section className="rounded-lg border border-stone-200 bg-white/76 p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 md:grid-cols-[9rem_1fr]">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-stone-200">
            {recipe.coverImageUrl ? (
              <Image
                alt={recipe.title}
                className="h-full w-full object-cover"
                fill
                priority
                sizes="9rem"
                src={recipe.coverImageUrl}
              />
            ) : (
              <div className="grid h-full place-items-center bg-stone-100 text-stone-400">
                <Utensils aria-hidden="true" className="h-12 w-12" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="font-serif text-4xl leading-tight text-stone-950 sm:text-5xl">
              {recipe.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <StarRating size="lg" value={rating} />
              <div className="flex flex-wrap gap-2">
                {recipeCategories.map((category) => (
                  <CategoryPill className="min-h-8 px-3 py-1 text-xs" key={category} name={category} />
                ))}
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              {recipe.description || recipe.notes}
            </p>
            <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2 text-sm text-stone-700">
              <strong>Prep</strong> {recipe.prepTime || "Not set"}
              <span aria-hidden="true">&bull;</span>
              <strong>Cook</strong> {recipe.cookTime || "Not set"}
              <span aria-hidden="true">&bull;</span>
              <strong>Servings</strong> {recipe.servings ? `${recipe.servings}` : "Not set"}
              <span aria-hidden="true">&bull;</span>
              <strong>Difficulty</strong> {recipe.difficulty ?? "Not set"}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(recipe.tags ?? []).map((tag) => (
                <span
                  className="rounded-full bg-stone-100 px-3 py-1.5 text-sm font-semibold text-stone-600"
                  key={tag}
                >
                  {tag}
                </span>
              ))}
              <span className="rounded-full bg-stone-100 px-3 py-1.5 text-sm font-semibold text-stone-600">
                {recipe.cuisine || "Cuisine TBD"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <nav
        aria-label="Recipe detail sections"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
      >
        {tabs.map((tab) => (
          <button
            className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-bold ring-1 transition ${
              activeTab === tab
                ? "bg-stone-950 text-white ring-stone-950"
                : "bg-white/70 text-stone-600 ring-stone-200 hover:bg-white"
            }`}
            key={tab}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {tab}
          </button>
        ))}
      </nav>

      <section className="rounded-lg border border-stone-200 bg-white/76 p-5 shadow-sm sm:p-6">
        {activeTab === "Overview" ? <OverviewSection recipe={recipe} /> : null}
        {activeTab === "Ingredients" ? <IngredientsSection recipe={recipe} /> : null}
        {activeTab === "Directions" ? <DirectionsSection recipe={recipe} /> : null}
        {activeTab === "Notes" ? <NotesSection recipe={recipe} /> : null}
        {activeTab === "Cook History" ? <CookHistorySection recipe={recipe} /> : null}
      </section>

      {relatedRecipes.length > 0 ? (
        <section className="space-y-4">
          <h2 className="font-serif text-3xl text-stone-950">Same shelf</h2>
          <RecipeGrid recipes={relatedRecipes} />
        </section>
      ) : null}
    </article>
  );
}

function OverviewSection({ recipe }: { recipe: Recipe }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <InfoTile label="Cuisine" value={recipe.cuisine || "Not set"} />
      <InfoTile label="Difficulty" value={recipe.difficulty ?? "Not set"} />
      <InfoTile label="Cook time" value={recipe.cookTime || "Not set"} />
      <InfoTile label="Times made" value={`${recipe.timesMade}`} />
      <InfoTile label="Aarav rating" value={formatRating(recipe.aaravRating)} />
      <InfoTile label="Sophie rating" value={formatRating(recipe.sophieRating)} />
      <InfoTile label="Date added" value={formatRecipeDate(recipe.dateAdded)} />
      <div className="rounded-lg bg-stone-50 p-4 ring-1 ring-stone-200">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-400">
          Source
        </p>
        {recipe.sourceUrl ? (
          <a
            className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-[var(--tomato)]"
            href={recipe.sourceUrl}
            rel="noreferrer"
            target="_blank"
          >
            Open source
            <ExternalLink aria-hidden="true" className="h-4 w-4" />
          </a>
        ) : (
          <p className="mt-1 font-semibold text-stone-950">Personal note</p>
        )}
      </div>
    </div>
  );
}

function IngredientsSection({ recipe }: { recipe: Recipe }) {
  return (
    <div>
      <h2 className="font-serif text-3xl text-stone-950">Ingredients</h2>
      <ul className="mt-5 divide-y divide-stone-200 border-y border-stone-200">
        {recipe.ingredients.map((ingredient, index) => (
          <li
            className="grid gap-2 py-3 text-lg leading-7 text-stone-800 sm:grid-cols-[8rem_1fr]"
            key={`${ingredient.item}-${index}`}
          >
            <span className="font-bold text-stone-950">
              {[ingredient.quantity, ingredient.unit].filter(Boolean).join(" ") || "As needed"}
            </span>
            <span>
              {ingredient.item || ingredient.productName || "Ingredient"}
              {ingredient.productName && ingredient.productName !== ingredient.item ? (
                <span className="text-stone-500">, {ingredient.productName}</span>
              ) : null}
              {ingredient.brand ? (
                <span className="text-stone-500">, {ingredient.brand}</span>
              ) : null}
              {ingredient.note ? (
                <span className="text-stone-500">, {ingredient.note}</span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DirectionsSection({ recipe }: { recipe: Recipe }) {
  return (
    <div>
      <h2 className="font-serif text-3xl text-stone-950">Directions</h2>
      <ol className="mt-5 space-y-5">
        {recipe.directions.map((direction, index) => (
          <li className="flex gap-4 text-lg leading-8 text-stone-800" key={`${index}-${direction.instruction}`}>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-stone-950 text-sm font-bold text-white">
              {index + 1}
            </span>
            <div className="pt-1">
              {direction.section ? (
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--tomato)]">
                  {direction.section}
                </p>
              ) : null}
              <p>{direction.instruction}</p>
              {direction.timerMinutes ? (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-200">
                  <Timer aria-hidden="true" className="h-3.5 w-3.5" />
                  {formatTimerMinutes(direction.timerMinutes)}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function NotesSection({ recipe }: { recipe: Recipe }) {
  return (
    <div>
      <h2 className="font-serif text-3xl text-stone-950">Notes</h2>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-stone-700">
        {recipe.notes || "No notes yet."}
      </p>
    </div>
  );
}

function emptyCookLogInput(): CookLogInput {
  return {
    dateMade: todayString(),
    cookedBy: "Both",
    occasion: "",
    aaravRating: undefined,
    sophieRating: undefined,
    notes: "",
    changesNextTime: "",
    imageUrl: "",
  };
}

function cookLogToInput(cookLog: CookLog): CookLogInput {
  return {
    dateMade: cookLog.dateMade,
    cookedBy: cookLog.cookedBy,
    occasion: cookLog.occasion ?? "",
    aaravRating: cookLog.aaravRating,
    sophieRating: cookLog.sophieRating,
    notes: cookLog.notes ?? "",
    changesNextTime: cookLog.changesNextTime ?? "",
    imageUrl: cookLog.imageUrl ?? "",
  };
}

function CookHistorySection({ recipe }: { recipe: Recipe }) {
  const {
    addCookLog,
    cookLogsByRecipe,
    deleteCookLog,
    error: storeError,
    loadCookLogs,
    updateCookLog,
  } = useRecipes();
  const cookLogs = cookLogsByRecipe[recipe.id] ?? [];
  const [formInput, setFormInput] = useState<CookLogInput>(emptyCookLogInput);
  const [editingLogId, setEditingLogId] = useState<string | undefined>();
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isSavingLog, setIsSavingLog] = useState(false);
  const [localError, setLocalError] = useState<string | undefined>();

  useEffect(() => {
    let active = true;

    async function loadLogs() {
      setIsLoadingLogs(true);
      setLocalError(undefined);

      try {
        await loadCookLogs(recipe.id);
      } catch (loadError) {
        if (active) {
          setLocalError(
            loadError instanceof Error ? loadError.message : "Unable to load cook history.",
          );
        }
      } finally {
        if (active) {
          setIsLoadingLogs(false);
        }
      }
    }

    window.queueMicrotask(() => {
      loadLogs();
    });

    return () => {
      active = false;
    };
  }, [loadCookLogs, recipe.id]);

  function updateFormField<Key extends keyof CookLogInput>(
    key: Key,
    value: CookLogInput[Key],
  ) {
    setFormInput((currentInput) => ({
      ...currentInput,
      [key]: value,
    }));
  }

  function resetForm() {
    setEditingLogId(undefined);
    setFormInput(emptyCookLogInput());
    setLocalError(undefined);
  }

  async function submitCookLog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formInput.dateMade) {
      setLocalError("Date made is required.");
      return;
    }

    setIsSavingLog(true);
    setLocalError(undefined);

    try {
      if (editingLogId) {
        await updateCookLog(recipe.id, editingLogId, formInput);
      } else {
        await addCookLog(recipe.id, formInput);
      }

      resetForm();
    } catch (saveError) {
      setLocalError(
        saveError instanceof Error ? saveError.message : "Unable to save cook log.",
      );
    } finally {
      setIsSavingLog(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-3xl text-stone-950">Cook History</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Track when this recipe was made, who cooked, ratings, and tweaks for next time.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <InfoTile label="Times made" value={`${recipe.timesMade}`} />
        <InfoTile label="Last made" value={formatRecipeDate(recipe.lastMadeDate)} />
        <InfoTile
          label="Average rating"
          value={
            averageRating(recipe) ? `${averageRating(recipe)?.toFixed(1)}/5` : "Not rated"
          }
        />
      </div>

      <form
        className="space-y-4 rounded-lg border border-stone-200 bg-stone-50/80 p-4"
        onSubmit={submitCookLog}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-serif text-2xl text-stone-950">
            {editingLogId ? "Edit cook log" : "Add cook log"}
          </h3>
          {editingLogId ? (
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-stone-200 bg-white px-3 text-sm font-bold text-stone-600"
              onClick={resetForm}
              type="button"
            >
              Cancel
            </button>
          ) : null}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2">
            <span className="text-sm font-bold text-stone-700">Date made</span>
            <input
              className={historyInputClassName}
              onChange={(event) => updateFormField("dateMade", event.target.value)}
              required
              type="date"
              value={formInput.dateMade}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-stone-700">Cooked by</span>
            <select
              className={historyInputClassName}
              onChange={(event) =>
                updateFormField("cookedBy", event.target.value as CookedBy)
              }
              value={formInput.cookedBy}
            >
              {cookedByOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <div className="space-y-2">
            <span className="text-sm font-bold text-stone-700">Aarav rating</span>
            <div className="flex h-12 items-center rounded-lg border border-stone-200 bg-white px-3">
              <StarRating
                label="Aarav rating"
                onChange={(value) => updateFormField("aaravRating", value)}
                value={formInput.aaravRating}
              />
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-sm font-bold text-stone-700">Sophie rating</span>
            <div className="flex h-12 items-center rounded-lg border border-stone-200 bg-white px-3">
              <StarRating
                label="Sophie rating"
                onChange={(value) => updateFormField("sophieRating", value)}
                value={formInput.sophieRating}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-bold text-stone-700">Occasion</span>
            <input
              className={historyInputClassName}
              onChange={(event) => updateFormField("occasion", event.target.value)}
              placeholder="Date night"
              value={formInput.occasion ?? ""}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-stone-700">Image URL</span>
            <input
              className={historyInputClassName}
              onChange={(event) => updateFormField("imageUrl", event.target.value)}
              placeholder="https://..."
              type="url"
              value={formInput.imageUrl ?? ""}
            />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-bold text-stone-700">Notes</span>
            <textarea
              className={`${historyTextareaClassName} min-h-28`}
              onChange={(event) => updateFormField("notes", event.target.value)}
              placeholder="How did it go?"
              value={formInput.notes ?? ""}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-stone-700">Changes next time</span>
            <textarea
              className={`${historyTextareaClassName} min-h-28`}
              onChange={(event) => updateFormField("changesNextTime", event.target.value)}
              placeholder="More lemon, less heat, double the sauce..."
              value={formInput.changesNextTime ?? ""}
            />
          </label>
        </div>

        {localError || storeError ? (
          <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
            {localError ?? storeError}
          </p>
        ) : null}

        <button
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--tomato)] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#a94e3a] sm:w-auto"
          disabled={isSavingLog}
          type="submit"
        >
          {editingLogId ? (
            <Save aria-hidden="true" className="h-4 w-4" />
          ) : (
            <Plus aria-hidden="true" className="h-4 w-4" />
          )}
          {isSavingLog ? "Saving..." : editingLogId ? "Save log" : "Add log"}
        </button>
      </form>

      <div className="space-y-3">
        {isLoadingLogs ? (
          <p className="rounded-lg border border-stone-200 bg-white p-4 text-sm font-semibold text-stone-600">
            Loading cook history...
          </p>
        ) : null}

        {!isLoadingLogs && cookLogs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone-300 bg-white/70 p-4 text-sm leading-6 text-stone-600">
            No cook logs yet. Add the first one after you make this recipe.
          </p>
        ) : null}

        {cookLogs.map((cookLog) => (
          <article
            className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
            key={cookLog.id}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-serif text-2xl text-stone-950">
                  {formatRecipeDate(cookLog.dateMade)}
                </p>
                <p className="mt-1 text-sm font-semibold text-stone-500">
                  {cookLog.cookedBy}
                  {cookLog.occasion ? `, ${cookLog.occasion}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm font-bold text-stone-600"
                  onClick={() => {
                    setEditingLogId(cookLog.id);
                    setFormInput(cookLogToInput(cookLog));
                    setLocalError(undefined);
                  }}
                  type="button"
                >
                  <Pencil aria-hidden="true" className="h-4 w-4" />
                  Edit
                </button>
                <button
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 text-sm font-bold text-red-700"
                  onClick={async () => {
                    if (!window.confirm("Delete this cook log?")) {
                      return;
                    }

                    try {
                      setLocalError(undefined);
                      await deleteCookLog(recipe.id, cookLog.id);
                    } catch (deleteError) {
                      setLocalError(
                        deleteError instanceof Error
                          ? deleteError.message
                          : "Unable to delete cook log.",
                      );
                    }
                  }}
                  type="button"
                >
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <InfoTile label="Aarav rating" value={formatRating(cookLog.aaravRating)} />
              <InfoTile label="Sophie rating" value={formatRating(cookLog.sophieRating)} />
            </div>

            {cookLog.imageUrl ? (
              <div className="mt-4 overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt=""
                  className="max-h-80 w-full object-cover"
                  src={cookLog.imageUrl}
                />
              </div>
            ) : null}

            {cookLog.notes ? (
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-stone-700">
                {cookLog.notes}
              </p>
            ) : null}

            {cookLog.changesNextTime ? (
              <div className="mt-4 rounded-lg bg-stone-50 p-3 ring-1 ring-stone-200">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-400">
                  Changes next time
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-stone-700">
                  {cookLog.changesNextTime}
                </p>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}

const historyInputClassName =
  "h-12 w-full rounded-lg border border-stone-200 bg-white px-4 text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-[var(--tomato)] focus:ring-4 focus:ring-red-100";

const historyTextareaClassName =
  "w-full resize-y rounded-lg border border-stone-200 bg-white p-4 text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-[var(--tomato)] focus:ring-4 focus:ring-red-100";

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-stone-50 p-4 ring-1 ring-stone-200">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-400">
        {label}
      </p>
      <p className="mt-1 font-semibold text-stone-950">{value}</p>
    </div>
  );
}
