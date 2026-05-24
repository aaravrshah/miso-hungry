"use client";

import { Check, ClipboardCheck, ImagePlus, Save, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "@/components/AuthProvider";
import { StarRating } from "@/components/StarRating";
import { useRecipes } from "@/components/RecipeStore";
import { parseIngredients } from "@/lib/ingredientRecognition";
import {
  formatTimerMinutes,
  type Category,
  type CategoryName,
  type Difficulty,
  type Direction,
  type Ingredient,
  type Recipe,
  uncategorizedCategoryName,
} from "@/lib/recipes";

type AddRecipeFormProps = {
  mode?: "create" | "edit";
  recipe?: Recipe;
  onSaved?: (recipe: Recipe) => void;
};

const difficulties: Difficulty[] = ["Easy", "Medium", "Hard"];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function createBlankRecipe(): Recipe {
  return {
    id: "",
    title: "",
    description: "",
    categoryId: "",
    category: uncategorizedCategoryName,
    categoryIds: [],
    categories: [],
    tags: [],
    cuisine: "",
    prepTime: "",
    cookTime: "",
    servings: undefined,
    difficulty: undefined,
    sourceUrl: "",
    coverImageUrl: "",
    ingredients: [],
    directions: [],
    notes: "",
    aaravRating: undefined,
    sophieRating: undefined,
    dateAdded: today(),
    lastMadeDate: undefined,
    timesMade: 0,
  };
}

function numberFromInput(value: string) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function recipeWithCategoryArrays(recipe: Recipe): Recipe {
  const categoryIds = recipe.categoryIds?.length
    ? recipe.categoryIds.filter(Boolean)
    : recipe.categoryId
      ? [recipe.categoryId]
      : [];
  const categories = recipe.categories?.length
    ? recipe.categories.filter(Boolean)
    : recipe.category
      ? [recipe.category]
      : [];

  return {
    ...recipe,
    category: categories[0] ?? uncategorizedCategoryName,
    categoryId: categoryIds[0] ?? "",
    categories,
    categoryIds,
  };
}

function ingredientToLine(ingredient: Ingredient) {
  const base = [ingredient.quantity, ingredient.unit, ingredient.item || ingredient.productName]
    .filter(Boolean)
    .join(" ");
  const details = [ingredient.brand, ingredient.note].filter(Boolean).join(", ");

  return [base || ingredient.productName || ingredient.item, details ? `(${details})` : ""]
    .filter(Boolean)
    .join(" ");
}

function directionToText(direction: Direction, index: number) {
  const prefix = `${index + 1}. `;
  return `${prefix}${direction.section ? `${direction.section}: ` : ""}${direction.instruction}`;
}

function ingredientTextFromRecipe(recipe: Recipe) {
  return recipe.ingredients.map(ingredientToLine).join("\n");
}

function directionTextFromRecipe(recipe: Recipe) {
  return recipe.directions.map(directionToText).join("\n");
}

function cleanDirectionLine(line: string) {
  return line
    .trim()
    .replace(/^\s*(?:\d+[\).:-]|\-|\*|\u2022)\s*/, "")
    .trim();
}

function detectTimerMinutes(instruction: string) {
  const matches = Array.from(
    instruction.matchAll(
      /(\d+(?:\.\d+)?)\s*(hours?|hrs?|hr|h|minutes?|mins?|min|seconds?|secs?|sec)\b/gi,
    ),
  );

  if (matches.length === 0) {
    return undefined;
  }

  const [firstMatch] = matches;
  let totalMinutes = durationMatchToMinutes(firstMatch);
  const secondMatch = matches[1];

  if (
    secondMatch &&
    firstMatch.index !== undefined &&
    secondMatch.index !== undefined &&
    secondMatch.index - (firstMatch.index + firstMatch[0].length) <= 3
  ) {
    totalMinutes += durationMatchToMinutes(secondMatch);
  }

  return totalMinutes > 0 ? totalMinutes : undefined;
}

function durationMatchToMinutes(match: RegExpMatchArray) {
  const value = Number(match[1]);
  const unit = match[2].toLowerCase();

  if (unit.startsWith("h")) {
    return value * 60;
  }

  if (unit.startsWith("sec")) {
    return value / 60;
  }

  return value;
}

function parseDirections(text: string) {
  return text
    .split(/\n\s*\n|\r?\n/)
    .map(cleanDirectionLine)
    .filter(Boolean)
    .map((line) => {
      const sectionMatch = line.match(/^([A-Za-z][A-Za-z\s]{1,28}):\s+(.+)$/);
      const instruction = sectionMatch?.[2]?.trim() ?? line;
      const section = sectionMatch?.[1]?.trim();

      return {
        section,
        instruction,
        timerMinutes: detectTimerMinutes(instruction),
      };
    });
}

function cleanRecipe(recipe: Recipe): Recipe {
  const categoryIds = Array.from(new Set(recipe.categoryIds?.filter(Boolean) ?? []));
  const categories = Array.from(new Set(recipe.categories?.filter(Boolean) ?? []));

  return {
    ...recipe,
    title: recipe.title.trim(),
    description: recipe.description.trim(),
    category: categories[0] ?? uncategorizedCategoryName,
    categoryId: categoryIds[0] ?? "",
    categories,
    categoryIds,
    cuisine: recipe.cuisine?.trim() || undefined,
    tags: recipe.tags?.map((tag) => tag.trim()).filter(Boolean) ?? [],
    sourceUrl: recipe.sourceUrl?.trim() || undefined,
    coverImageUrl: recipe.coverImageUrl?.trim() || undefined,
    prepTime: recipe.prepTime?.trim() || undefined,
    cookTime: recipe.cookTime?.trim() || undefined,
    ingredients: recipe.ingredients.filter((ingredient) => ingredient.item.trim()),
    directions: recipe.directions.filter((direction) => direction.instruction.trim()),
    notes: recipe.notes?.trim() ?? "",
  };
}

export function AddRecipeForm({
  mode = "create",
  recipe,
  onSaved,
}: AddRecipeFormProps) {
  const router = useRouter();
  const { profile } = useAuth();
  const { addRecipe, categories, updateRecipe } = useRecipes();
  const initialRecipe = recipe ? recipeWithCategoryArrays(recipe) : createBlankRecipe();
  const [coverImageFile, setCoverImageFile] = useState<File | undefined>();
  const [emptyStructureAcknowledged, setEmptyStructureAcknowledged] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [formRecipe, setFormRecipe] = useState<Recipe>(initialRecipe);
  const [ingredientsText, setIngredientsText] = useState(ingredientTextFromRecipe(initialRecipe));
  const [directionsText, setDirectionsText] = useState(directionTextFromRecipe(initialRecipe));
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tagsText, setTagsText] = useState(initialRecipe.tags?.join(", ") ?? "");
  const [warning, setWarning] = useState<string | undefined>();
  const isEditing = mode === "edit";
  const selectedCategoryIds = formRecipe.categoryIds?.length
    ? formRecipe.categoryIds
    : formRecipe.categoryId
      ? [formRecipe.categoryId]
      : [];
  const parsedDirections = parseDirections(directionsText);
  const detectedTimers = parsedDirections.filter((direction) => direction.timerMinutes);
  const currentRating =
    profile?.displayName === "Sophie"
      ? formRecipe.sophieRating
      : profile?.displayName === "Aarav"
        ? formRecipe.aaravRating
        : formRecipe.averageUserRating;

  function updateField<Key extends keyof Recipe>(key: Key, value: Recipe[Key]) {
    setFormRecipe((currentRecipe) => ({
      ...currentRecipe,
      [key]: value,
    }));
  }

  function updateCurrentUserRating(value: number | undefined) {
    if (profile?.displayName === "Sophie") {
      updateField("sophieRating", value);
      return;
    }

    if (profile?.displayName === "Aarav") {
      updateField("aaravRating", value);
      return;
    }

    updateField("averageUserRating", value);
    updateField("ratingCount", typeof value === "number" ? 1 : 0);
    updateField("ratingTotal", value ?? 0);
  }

  function toggleCategory(categoryId: string) {
    const selectedCategory = categories.find((category) => category.id === categoryId);

    if (!selectedCategory) {
      return;
    }

    const nextCategoryIds = selectedCategoryIds.includes(categoryId)
      ? selectedCategoryIds.filter((id) => id !== categoryId)
      : [...selectedCategoryIds, categoryId];
    const nextCategories = nextCategoryIds
      .map((id) => categories.find((category) => category.id === id)?.name)
      .filter((name): name is CategoryName => Boolean(name));

    setFormRecipe((currentRecipe) => ({
      ...currentRecipe,
      category: nextCategories[0] ?? uncategorizedCategoryName,
      categoryId: nextCategoryIds[0] ?? "",
      categories: nextCategories,
      categoryIds: nextCategoryIds,
    }));
  }

  async function submitRecipe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(undefined);
    setWarning(undefined);

    const cleanedRecipe = cleanRecipe({
      ...formRecipe,
      tags: tagsText
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      ingredients: parseIngredients(ingredientsText),
      directions: parseDirections(directionsText),
    });
    const hasRecipeStructure =
      cleanedRecipe.ingredients.length > 0 || cleanedRecipe.directions.length > 0;

    if (!cleanedRecipe.title) {
      setError("Recipe title is required.");
      setIsSaving(false);
      return;
    }

    if (!hasRecipeStructure && !emptyStructureAcknowledged) {
      setWarning(
        "Adding at least one ingredient or direction is recommended. Press Save again to continue without one.",
      );
      setEmptyStructureAcknowledged(true);
      setIsSaving(false);
      return;
    }

    try {
      const savedRecipe = isEditing
        ? await updateRecipe(formRecipe.id, cleanedRecipe, coverImageFile)
        : await addRecipe(cleanedRecipe, coverImageFile);

      if (!savedRecipe) {
        return;
      }

      setSaved(true);
      onSaved?.(savedRecipe);

      if (!isEditing) {
        router.push(`/recipes/${savedRecipe.id}`);
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save recipe.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={submitRecipe}>
      <section className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--tomato)]">
            {isEditing ? "Edit Recipe" : "Add Recipe"}
          </p>
          <h1 className="mt-2 font-serif text-4xl leading-tight text-stone-950 sm:text-5xl">
            {isEditing ? "Tune the keeper" : "Save the next keeper"}
          </h1>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white/72 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-rose-100 text-rose-700">
              <ClipboardCheck aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <p className="font-serif text-xl text-stone-950">Recipe draft</p>
              <p className="text-sm font-medium text-stone-500">
                {saved ? "Saved in your cookbook" : "Plain text, parsed on save"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-5 rounded-lg border border-stone-200 bg-white/76 p-4 shadow-sm sm:p-6">
          <FormSectionTitle title="Basics" />

          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Recipe title"
              onChange={(value) => updateField("title", value)}
              placeholder="Sophie-style dumplings"
              required
              value={formRecipe.title}
            />
            <div className="space-y-2">
              <span className="text-sm font-bold text-stone-700">Categories</span>
              <div className="flex min-h-12 flex-wrap gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2">
                {categories.length === 0 ? (
                  <p className="py-1 text-sm font-semibold text-stone-500">
                    Create categories from the Recipes page.
                  </p>
                ) : null}
                {categories.map((category) => {
                  const selected = selectedCategoryIds.includes(category.id);

                  return (
                    <button
                      className={`min-h-8 rounded-full px-3 text-sm font-bold ring-1 transition ${
                        selected
                          ? "bg-stone-950 text-white ring-stone-950"
                          : "bg-stone-50 text-stone-600 ring-stone-200 hover:bg-stone-100"
                      }`}
                      key={category.id}
                      onClick={() => toggleCategory(category.id)}
                      type="button"
                    >
                      {category.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-bold text-stone-700">Description</span>
            <textarea
              className={`${textareaClassName} min-h-24`}
              onChange={(event) => updateField("description", event.target.value)}
              placeholder="What makes this recipe worth saving?"
              value={formRecipe.description}
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <TextField
              label="Cuisine"
              onChange={(value) => updateField("cuisine", value)}
              placeholder="Korean"
              value={formRecipe.cuisine ?? ""}
            />
            <TextField
              label="Prep time"
              onChange={(value) => updateField("prepTime", value)}
              placeholder="15 min"
              value={formRecipe.prepTime ?? ""}
            />
            <TextField
              label="Cook time"
              onChange={(value) => updateField("cookTime", value)}
              placeholder="35 min"
              value={formRecipe.cookTime ?? ""}
            />
            <label className="space-y-2">
              <span className="text-sm font-bold text-stone-700">Difficulty</span>
              <select
                className={inputClassName}
                onChange={(event) =>
                  updateField(
                    "difficulty",
                    event.target.value ? (event.target.value as Difficulty) : undefined,
                  )
                }
                value={formRecipe.difficulty ?? ""}
              >
                <option value="">Not set</option>
                {difficulties.map((difficulty) => (
                  <option key={difficulty}>{difficulty}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr]">
            <NumberField
              label="Servings"
              min={1}
              onChange={(value) => updateField("servings", value)}
              value={formRecipe.servings}
            />
            <RatingField
              label="Your rating"
              onChange={updateCurrentUserRating}
              value={currentRating}
            />
          </div>

          <TextField
            label="Tags"
            onChange={setTagsText}
            placeholder="cozy, spicy, date-night"
            value={tagsText}
          />

          <FormSectionTitle title="Ingredients" />
          <label className="space-y-2">
            <span className="text-sm font-bold text-stone-700">One ingredient per line</span>
            <textarea
              className={`${textareaClassName} min-h-72 font-mono text-[0.95rem] leading-7`}
              onChange={(event) => {
                setIngredientsText(event.target.value);
                setEmptyStructureAcknowledged(false);
                setWarning(undefined);
              }}
              placeholder={"2 cups all-purpose flour\n1 tsp baking powder\n1/2 cup sugar\nUnsalted butter, for the pan"}
              value={ingredientsText}
            />
          </label>

          <FormSectionTitle title="Directions" />
          <label className="space-y-2">
            <span className="text-sm font-bold text-stone-700">
              Paste or type the method
            </span>
            <textarea
              className={`${textareaClassName} min-h-96 text-base leading-7`}
              onChange={(event) => {
                setDirectionsText(event.target.value);
                setEmptyStructureAcknowledged(false);
                setWarning(undefined);
              }}
              placeholder={"1. Preheat oven to 350 degrees F.\n\n2. Mix the dry ingredients.\n\n3. Bake for 40 minutes, then cool for 15 minutes."}
              value={directionsText}
            />
          </label>
          {detectedTimers.length > 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
              Detected timers:{" "}
              {detectedTimers
                .map((direction) => formatTimerMinutes(direction.timerMinutes))
                .filter(Boolean)
                .join(", ")}
            </div>
          ) : null}

          <FormSectionTitle title="Notes" />
          <label className="space-y-2">
            <span className="text-sm font-bold text-stone-700">Private notes</span>
            <textarea
              className={`${textareaClassName} min-h-36`}
              onChange={(event) => updateField("notes", event.target.value)}
              placeholder="What made this one ours?"
              value={formRecipe.notes ?? ""}
            />
          </label>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-stone-200 bg-white/72 p-4 shadow-sm">
            <FormSectionTitle title="Media" />
            <TextField
              label="Cover image URL"
              onChange={(value) => updateField("coverImageUrl", value)}
              placeholder="https://..."
              type="url"
              value={formRecipe.coverImageUrl ?? ""}
            />
            <label className="mt-4 block space-y-2">
              <span className="text-sm font-bold text-stone-700">Upload cover image</span>
              <input
                accept="image/*"
                className="block w-full rounded-lg border border-stone-200 bg-white px-3 py-3 text-sm text-stone-700 file:mr-4 file:rounded-md file:border-0 file:bg-stone-100 file:px-3 file:py-2 file:text-sm file:font-bold file:text-stone-700"
                onChange={(event) => setCoverImageFile(event.target.files?.[0])}
                type="file"
              />
              {coverImageFile ? (
                <span className="block text-xs font-semibold text-stone-500">
                  {coverImageFile.name} will upload to Firebase Storage on save.
                </span>
              ) : null}
            </label>
            <div className="mt-4 overflow-hidden rounded-lg border border-dashed border-stone-300 bg-stone-100">
              {formRecipe.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt=""
                  className="aspect-[4/3] w-full object-cover"
                  src={formRecipe.coverImageUrl}
                />
              ) : (
                <div className="grid aspect-[4/3] place-items-center text-center text-stone-500">
                  <div>
                    <ImagePlus aria-hidden="true" className="mx-auto h-8 w-8" />
                    <p className="mt-2 text-sm font-semibold">Preview</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-stone-200 bg-white/72 p-4 shadow-sm">
            <FormSectionTitle title="History" />
            <TextField
              label="Source URL"
              onChange={(value) => updateField("sourceUrl", value)}
              placeholder="https://..."
              type="url"
              value={formRecipe.sourceUrl ?? ""}
            />
            <TextField
              label="Date added"
              onChange={(value) => updateField("dateAdded", value)}
              type="date"
              value={formRecipe.dateAdded}
            />
            <TextField
              label="Last made"
              onChange={(value) => updateField("lastMadeDate", value || undefined)}
              type="date"
              value={formRecipe.lastMadeDate ?? ""}
            />
            <NumberField
              label="Times made"
              min={0}
              onChange={(value) => updateField("timesMade", value ?? 0)}
              value={formRecipe.timesMade}
            />
          </div>
        </aside>
      </section>

      {error ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}

      {warning ? (
        <p className="rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-800 ring-1 ring-amber-200">
          {warning}
        </p>
      ) : null}

      <div className="flex justify-end">
        <button
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--tomato)] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#a94e3a] sm:w-auto"
          disabled={isSaving}
          type="submit"
        >
          <Save aria-hidden="true" className="h-4 w-4" />
          {isSaving ? "Saving..." : isEditing ? "Save changes" : "Save recipe"}
        </button>
      </div>
    </form>
  );
}

const inputClassName =
  "h-12 w-full rounded-lg border border-stone-200 bg-white px-4 text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-[var(--tomato)] focus:ring-4 focus:ring-red-100";

const textareaClassName =
  "w-full resize-y rounded-lg border border-stone-200 bg-white p-4 text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-[var(--tomato)] focus:ring-4 focus:ring-red-100";

function FormSectionTitle({ title }: { title: string }) {
  return (
    <h2 className="font-serif text-2xl leading-tight text-stone-950 sm:text-3xl">
      {title}
    </h2>
  );
}

function TextField({
  label,
  onChange,
  placeholder,
  required = false,
  type = "text",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-bold text-stone-700">{label}</span>
      <input
        className={inputClassName}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
      />
    </label>
  );
}

function NumberField({
  label,
  max,
  min,
  onChange,
  step = 1,
  value,
}: {
  label: string;
  max?: number;
  min?: number;
  onChange: (value: number | undefined) => void;
  step?: number;
  value?: number;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-bold text-stone-700">{label}</span>
      <input
        className={inputClassName}
        max={max}
        min={min}
        onChange={(event) => onChange(numberFromInput(event.target.value))}
        step={step}
        type="number"
        value={value ?? ""}
      />
    </label>
  );
}

function RatingField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: number | undefined) => void;
  value?: number;
}) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-bold text-stone-700">{label}</span>
      <div className="flex h-12 items-center rounded-lg border border-stone-200 bg-white px-3">
        <StarRating label={label} onChange={onChange} value={value} />
      </div>
    </div>
  );
}
