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
  defaultRecipeVisibility,
  type Category,
  type CategoryName,
  type Difficulty,
  type Direction,
  type Ingredient,
  type Recipe,
  type RecipeVisibility,
  uncategorizedCategoryName,
} from "@/lib/recipes";

type AddRecipeFormProps = {
  mode?: "create" | "edit";
  recipe?: Recipe;
  onSaved?: (recipe: Recipe) => void;
};

const difficulties: Difficulty[] = ["Easy", "Medium", "Hard"];
const visibilityOptions: Array<{
  description: string;
  label: string;
  value: RecipeVisibility;
}> = [
  {
    description: "Only you and collaborators can see it.",
    label: "Private",
    value: "private",
  },
  {
    description: "Friends can view it. Collaborators can edit.",
    label: "Friends",
    value: "friends",
  },
  {
    description: "Anyone signed in can find it in Explore.",
    label: "Public",
    value: "public",
  },
];

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
    visibility: defaultRecipeVisibility,
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
  const initialRecipe = recipe
    ? {
        ...recipeWithCategoryArrays(recipe),
        visibility: recipe.visibility ?? profile?.defaultRecipeVisibility ?? defaultRecipeVisibility,
      }
    : {
        ...createBlankRecipe(),
        visibility: profile?.defaultRecipeVisibility ?? defaultRecipeVisibility,
      };
  const [coverImageFile, setCoverImageFile] = useState<File | undefined>();
  const [emptyStructureAcknowledged, setEmptyStructureAcknowledged] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [formRecipe, setFormRecipe] = useState<Recipe>(initialRecipe);
  const [ingredientsText, setIngredientsText] = useState(ingredientTextFromRecipe(initialRecipe));
  const [directionsText, setDirectionsText] = useState(directionTextFromRecipe(initialRecipe));
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tagsText, setTagsText] = useState(initialRecipe.tags?.join(", ") ?? "");
  const [uploadedImagePreviewUrl, setUploadedImagePreviewUrl] = useState<string | undefined>();
  const [warning, setWarning] = useState<string | undefined>();
  const isEditing = mode === "edit";
  const selectedCategoryIds = formRecipe.categoryIds?.length
    ? formRecipe.categoryIds
    : formRecipe.categoryId
      ? [formRecipe.categoryId]
      : [];
  const parsedDirections = parseDirections(directionsText);
  const detectedTimers = parsedDirections.filter((direction) => direction.timerMinutes);
  const coverPreviewUrl = uploadedImagePreviewUrl ?? formRecipe.coverImageUrl;
  const currentRating =
    profile?.displayName === "Sophie"
      ? formRecipe.sophieRating
      : profile?.displayName === "Aarav"
        ? formRecipe.aaravRating
        : formRecipe.averageUserRating;

  useEffect(() => {
    return () => {
      if (uploadedImagePreviewUrl) {
        URL.revokeObjectURL(uploadedImagePreviewUrl);
      }
    };
  }, [uploadedImagePreviewUrl]);

  function handleCoverImageFileChange(file?: File) {
    setCoverImageFile(file);

    if (!file) {
      setUploadedImagePreviewUrl(undefined);
      return;
    }

    setUploadedImagePreviewUrl(URL.createObjectURL(file));
  }

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
      visibility: formRecipe.visibility ?? profile?.defaultRecipeVisibility ?? defaultRecipeVisibility,
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
    <form className="space-y-4 sm:space-y-6" onSubmit={submitRecipe}>
      <section className="grid gap-3 lg:grid-cols-[1fr_18rem]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--tomato)] sm:text-sm">
            {isEditing ? "Edit Recipe" : "Add Recipe"}
          </p>
          <h1 className="mt-1 font-serif text-2xl leading-tight text-stone-950 sm:mt-2 sm:text-5xl">
            {isEditing ? "Tune the keeper" : "Save the next keeper"}
          </h1>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white/72 p-3 shadow-sm sm:p-4">
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

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-4">
          <div className="space-y-4 rounded-lg border border-stone-200 bg-white/76 p-3 shadow-sm sm:p-5">
            <FormSectionTitle eyebrow="Start here" title="Name and organize" />
            <TextField
              label="Recipe title"
              onChange={(value) => updateField("title", value)}
              placeholder="Sophie-style dumplings"
              required
              value={formRecipe.title}
            />
            <CategoryPicker
              categories={categories}
              onToggleCategory={toggleCategory}
              selectedCategoryIds={selectedCategoryIds}
            />
            <VisibilityPicker
              onChange={(value) => updateField("visibility", value)}
              value={formRecipe.visibility ?? profile?.defaultRecipeVisibility ?? defaultRecipeVisibility}
            />
          </div>

          <div className="space-y-3 rounded-lg border border-stone-200 bg-white/76 p-3 shadow-sm sm:p-5">
            <FormSectionTitle eyebrow="Core recipe" title="Ingredients" />
            <label className="space-y-2">
              <span className="text-sm font-bold text-stone-700">One ingredient per line</span>
              <textarea
                className={`${textareaClassName} min-h-56 font-mono text-[0.95rem] leading-7 sm:min-h-72`}
                onChange={(event) => {
                  setIngredientsText(event.target.value);
                  setEmptyStructureAcknowledged(false);
                  setWarning(undefined);
                }}
                placeholder={"2 cups all-purpose flour\n1 tsp baking powder\n1/2 cup sugar\nUnsalted butter, for the pan"}
                value={ingredientsText}
              />
            </label>
          </div>

          <div className="space-y-3 rounded-lg border border-stone-200 bg-white/76 p-3 shadow-sm sm:p-5">
            <FormSectionTitle eyebrow="Core recipe" title="Directions" />
            <label className="space-y-2">
              <span className="text-sm font-bold text-stone-700">
                Paste or type the method
              </span>
              <textarea
                className={`${textareaClassName} min-h-64 text-base leading-7 sm:min-h-80`}
                onChange={(event) => {
                  setDirectionsText(event.target.value);
                  setEmptyStructureAcknowledged(false);
                  setWarning(undefined);
                }}
                placeholder={"1. Preheat oven to 350 degrees F.\n2. Mix the dry ingredients.\n3. Bake for 40 minutes, then cool for 15 minutes."}
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
          </div>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <div className="space-y-4 rounded-lg border border-stone-200 bg-white/72 p-4 shadow-sm">
            <FormSectionTitle eyebrow="Optional details" title="Details" />
            <label className="space-y-2">
              <span className="text-sm font-bold text-stone-700">Description</span>
              <textarea
                className={`${textareaClassName} min-h-24`}
                onChange={(event) => updateField("description", event.target.value)}
                placeholder="What makes this recipe worth saving?"
                value={formRecipe.description}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
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
              <NumberField
                label="Servings"
                min={1}
                onChange={(value) => updateField("servings", value)}
                value={formRecipe.servings}
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
            <RatingField
              label="Your rating"
              onChange={updateCurrentUserRating}
              value={currentRating}
            />
            <TextField
              label="Tags"
              onChange={setTagsText}
              placeholder="cozy, spicy, date-night"
              value={tagsText}
            />
          </div>

          <div className="rounded-lg border border-stone-200 bg-white/72 p-4 shadow-sm">
            <FormSectionTitle eyebrow="Cover" title="Media" />
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
                onChange={(event) => handleCoverImageFileChange(event.target.files?.[0])}
                type="file"
              />
              {coverImageFile ? (
                <span className="block text-xs font-semibold text-stone-500">
                  {coverImageFile.name} will upload to Firebase Storage on save.
                </span>
              ) : null}
            </label>
            <div className="mt-4 overflow-hidden rounded-lg border border-dashed border-stone-300 bg-stone-100">
              {coverPreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt=""
                  className="aspect-[4/3] w-full object-cover"
                  src={coverPreviewUrl}
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
            <FormSectionTitle eyebrow="Reference" title="Source and notes" />
            <TextField
              label="Source URL"
              onChange={(value) => updateField("sourceUrl", value)}
              placeholder="https://..."
              type="url"
              value={formRecipe.sourceUrl ?? ""}
            />
            <label className="space-y-2">
              <span className="text-sm font-bold text-stone-700">Private notes</span>
              <textarea
                className={`${textareaClassName} min-h-32`}
                onChange={(event) => updateField("notes", event.target.value)}
                placeholder="What made this one ours?"
                value={formRecipe.notes ?? ""}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
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

function FormSectionTitle({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div>
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--tomato)]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-1 font-serif text-2xl leading-tight text-stone-950 sm:text-3xl">
        {title}
      </h2>
    </div>
  );
}

function CategoryPicker({
  categories,
  onToggleCategory,
  selectedCategoryIds,
}: {
  categories: Category[];
  onToggleCategory: (categoryId: string) => void;
  selectedCategoryIds: string[];
}) {
  const [categoryQuery, setCategoryQuery] = useState("");
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const selectedCategories = categories.filter((category) =>
    selectedCategoryIds.includes(category.id),
  );
  const filteredCategories = useMemo(() => {
    const normalizedQuery = categoryQuery.trim().toLowerCase();
    const visibleCategories = normalizedQuery
      ? categories.filter((category) =>
          [category.name, category.description]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery),
        )
      : categories;

    return visibleCategories.slice(0, 8);
  }, [categories, categoryQuery]);

  return (
    <div className="relative space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-stone-700">Categories</span>
        <span className="text-xs font-semibold text-stone-500">Albums</span>
      </div>
      <div className="rounded-lg border border-stone-200 bg-white p-3 shadow-sm">
        {selectedCategories.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {selectedCategories.map((category) => (
              <button
                className="inline-flex min-h-8 items-center gap-2 rounded-full bg-stone-950 px-3 text-xs font-bold text-white"
                key={category.id}
                onClick={() => onToggleCategory(category.id)}
                type="button"
              >
                {category.name}
                <X aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        ) : null}

        <label className="relative block">
          <span className="sr-only">Search categories</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
          />
          <input
            className="h-10 w-full rounded-lg border border-stone-200 bg-stone-50 pl-9 pr-3 text-sm font-semibold text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-[var(--tomato)] focus:bg-white focus:ring-4 focus:ring-red-100"
            onFocus={() => setIsCategoryMenuOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setIsCategoryMenuOpen(false);
              }
            }}
            onChange={(event) => setCategoryQuery(event.target.value)}
            placeholder="Search or choose categories"
            value={categoryQuery}
          />
        </label>

        {categories.length === 0 ? (
          <p className="mt-3 text-sm font-semibold text-stone-500">
            Create categories from the Recipes page.
          </p>
        ) : null}

        {isCategoryMenuOpen && categories.length > 0 ? (
          <div className="absolute left-0 right-0 top-full z-30 mt-2 rounded-lg border border-stone-200 bg-white p-2 shadow-xl">
            <div className="max-h-56 space-y-1 overflow-y-auto">
              {filteredCategories.map((category) => {
                const selected = selectedCategoryIds.includes(category.id);

                return (
                  <button
                    className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-lg px-3 text-left text-sm font-bold transition ${
                      selected
                        ? "bg-[#fff4e4] text-[var(--tomato)]"
                        : "text-stone-700 hover:bg-stone-50"
                    }`}
                    key={category.id}
                    onClick={() => onToggleCategory(category.id)}
                    type="button"
                  >
                    <span className="truncate">{category.name}</span>
                    {selected ? <Check aria-hidden="true" className="h-4 w-4" /> : null}
                  </button>
                );
              })}
            </div>

            {filteredCategories.length === 0 ? (
              <p className="px-3 py-2 text-sm font-semibold text-stone-500">
                No categories match that search.
              </p>
            ) : null}

            <button
              className="mt-2 min-h-9 w-full rounded-lg bg-stone-100 px-3 text-sm font-bold text-stone-700"
              onClick={() => setIsCategoryMenuOpen(false)}
              type="button"
            >
              Done
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function VisibilityPicker({
  onChange,
  value,
}: {
  onChange: (value: RecipeVisibility) => void;
  value: RecipeVisibility;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-bold text-stone-700">Who can see this?</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {visibilityOptions.map((option) => (
          <button
            className={`min-h-20 rounded-lg border p-3 text-left transition ${
              value === option.value
                ? "border-[var(--tomato)] bg-[#fff4e4] text-stone-950 ring-2 ring-orange-100"
                : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
            }`}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            <span className="block text-sm font-bold">{option.label}</span>
            <span className="mt-1 block text-xs font-medium leading-5 text-stone-500">
              {option.description}
            </span>
          </button>
        ))}
      </div>
    </fieldset>
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
