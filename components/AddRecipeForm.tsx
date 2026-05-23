"use client";

import { ClipboardCheck, ImagePlus, Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import {
  type CategoryName,
  type Difficulty,
  type Direction,
  type Ingredient,
  type Recipe,
} from "@/lib/recipes";
import { useRecipes } from "@/components/RecipeStore";

type AddRecipeFormProps = {
  mode?: "create" | "edit";
  recipe?: Recipe;
  onSaved?: (recipe: Recipe) => void;
};

const difficulties: Difficulty[] = ["Easy", "Medium", "Hard"];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function emptyIngredient(): Ingredient {
  return {
    quantity: "",
    unit: "",
    item: "",
    brand: "",
    productName: "",
    note: "",
  };
}

function emptyDirection(): Direction {
  return {
    section: "",
    instruction: "",
    timerMinutes: undefined,
  };
}

function createBlankRecipe(): Recipe {
  return {
    id: "",
    title: "",
    description: "",
    categoryId: "date-night",
    category: "Date Night",
    tags: [],
    cuisine: "",
    prepTime: "",
    cookTime: "",
    servings: undefined,
    difficulty: undefined,
    sourceUrl: "",
    coverImageUrl: "",
    ingredients: [emptyIngredient()],
    directions: [emptyDirection()],
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

function cleanRecipe(recipe: Recipe): Recipe {
  return {
    ...recipe,
    title: recipe.title.trim(),
    description: recipe.description.trim(),
    cuisine: recipe.cuisine?.trim() || undefined,
    tags: recipe.tags?.map((tag) => tag.trim()).filter(Boolean) ?? [],
    sourceUrl: recipe.sourceUrl?.trim() || undefined,
    coverImageUrl: recipe.coverImageUrl?.trim() || undefined,
    prepTime: recipe.prepTime?.trim() || undefined,
    cookTime: recipe.cookTime?.trim() || undefined,
    ingredients: recipe.ingredients
      .map((ingredient) => ({
        quantity: ingredient.quantity.trim(),
        unit: ingredient.unit.trim(),
        item: ingredient.item.trim(),
        brand: ingredient.brand?.trim() || undefined,
        productName: ingredient.productName?.trim() || undefined,
        note: ingredient.note?.trim() || undefined,
      }))
      .filter(hasIngredientInput),
    directions: recipe.directions
      .map((direction) => ({
        section: direction.section?.trim() || undefined,
        instruction: direction.instruction.trim(),
        timerMinutes: direction.timerMinutes,
      }))
      .filter((direction) => direction.instruction),
    notes: recipe.notes?.trim() ?? "",
  };
}

function hasIngredientInput(ingredient: Ingredient) {
  return Boolean(
    ingredient.quantity.trim() ||
      ingredient.unit.trim() ||
      ingredient.item.trim() ||
      ingredient.brand?.trim() ||
      ingredient.productName?.trim() ||
      ingredient.note?.trim(),
  );
}

function hasDirectionInput(direction: Direction) {
  return Boolean(
    direction.section?.trim() || direction.instruction.trim() || direction.timerMinutes,
  );
}

export function AddRecipeForm({
  mode = "create",
  recipe,
  onSaved,
}: AddRecipeFormProps) {
  const router = useRouter();
  const { addRecipe, categories, updateRecipe } = useRecipes();
  const initialRecipe = recipe ?? createBlankRecipe();
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [warning, setWarning] = useState<string | undefined>();
  const [emptyStructureAcknowledged, setEmptyStructureAcknowledged] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState<File | undefined>();
  const [formRecipe, setFormRecipe] = useState<Recipe>(initialRecipe);
  const [tagsText, setTagsText] = useState(initialRecipe.tags?.join(", ") ?? "");
  const isEditing = mode === "edit";

  function updateField<Key extends keyof Recipe>(key: Key, value: Recipe[Key]) {
    if (key === "ingredients" || key === "directions") {
      setEmptyStructureAcknowledged(false);
      setWarning(undefined);
    }

    setFormRecipe((currentRecipe) => ({
      ...currentRecipe,
      [key]: value,
    }));
  }

  function updateIngredient<Key extends keyof Ingredient>(
    index: number,
    key: Key,
    value: Ingredient[Key],
  ) {
    updateField(
      "ingredients",
      formRecipe.ingredients.map((ingredient, ingredientIndex) =>
        ingredientIndex === index ? { ...ingredient, [key]: value } : ingredient,
      ),
    );
  }

  function updateDirection<Key extends keyof Direction>(
    index: number,
    key: Key,
    value: Direction[Key],
  ) {
    updateField(
      "directions",
      formRecipe.directions.map((direction, directionIndex) =>
        directionIndex === index ? { ...direction, [key]: value } : direction,
      ),
    );
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
      ingredients: formRecipe.ingredients.length ? formRecipe.ingredients : [emptyIngredient()],
      directions: formRecipe.directions.length ? formRecipe.directions : [emptyDirection()],
    });

    const incompleteIngredient = cleanedRecipe.ingredients.find((ingredient) => !ingredient.item);
    const incompleteDirection = formRecipe.directions.find(
      (direction) => hasDirectionInput(direction) && !direction.instruction.trim(),
    );
    const hasRecipeStructure =
      cleanedRecipe.ingredients.length > 0 || cleanedRecipe.directions.length > 0;

    if (!cleanedRecipe.title) {
      setError("Recipe title is required.");
      setIsSaving(false);
      return;
    }

    if (incompleteIngredient) {
      setError("Ingredient item is required for any ingredient row you keep.");
      setIsSaving(false);
      return;
    }

    if (incompleteDirection) {
      setError("Direction instruction is required for any direction row you keep.");
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
                {saved ? "Saved in your cookbook" : "Ready to save"}
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
            <label className="space-y-2">
              <span className="text-sm font-bold text-stone-700">Category</span>
              <select
                className={inputClassName}
                disabled={categories.length === 0}
                onChange={(event) => {
                  const selectedCategory = categories.find(
                    (category) => category.id === event.target.value,
                  );
                  updateField("categoryId", event.target.value);
                  updateField(
                    "category",
                    (selectedCategory?.name ?? event.target.value) as CategoryName,
                  );
                }}
                value={formRecipe.categoryId}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-bold text-stone-700">Description</span>
            <textarea
              className={`${textareaClassName} min-h-28`}
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

          <div className="grid gap-4 md:grid-cols-3">
            <NumberField
              label="Servings"
              min={1}
              onChange={(value) => updateField("servings", value)}
              value={formRecipe.servings}
            />
            <NumberField
              label="Aarav rating"
              max={10}
              min={1}
              onChange={(value) => updateField("aaravRating", value)}
              step={0.1}
              value={formRecipe.aaravRating}
            />
            <NumberField
              label="Sophie rating"
              max={10}
              min={1}
              onChange={(value) => updateField("sophieRating", value)}
              step={0.1}
              value={formRecipe.sophieRating}
            />
          </div>

          <TextField
            label="Tags"
            onChange={setTagsText}
            placeholder="cozy, spicy, date-night"
            value={tagsText}
          />

          <FormSectionTitle title="Ingredients" />
          <div className="space-y-3">
            {formRecipe.ingredients.map((ingredient, index) => (
              <div
                className="rounded-lg border border-stone-200 bg-stone-50/70 p-3"
                key={`ingredient-${index}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-stone-700">Ingredient {index + 1}</p>
                  <button
                    aria-label={`Remove ingredient ${index + 1}`}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm font-bold text-stone-500 transition hover:text-red-700"
                    onClick={() =>
                      updateField(
                        "ingredients",
                        formRecipe.ingredients.filter(
                          (_, ingredientIndex) => ingredientIndex !== index,
                        ),
                      )
                    }
                    type="button"
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                    Remove
                  </button>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <TextField
                    label="Item"
                    onChange={(value) => updateIngredient(index, "item", value)}
                    placeholder="rice"
                    value={ingredient.item}
                  />
                  <TextField
                    label="Quantity"
                    onChange={(value) => updateIngredient(index, "quantity", value)}
                    placeholder="1"
                    value={ingredient.quantity}
                  />
                  <TextField
                    label="Unit"
                    onChange={(value) => updateIngredient(index, "unit", value)}
                    placeholder="cup"
                    value={ingredient.unit}
                  />
                  <TextField
                    label="Brand"
                    onChange={(value) => updateIngredient(index, "brand", value)}
                    placeholder="Kikkoman"
                    value={ingredient.brand ?? ""}
                  />
                  <TextField
                    label="Product name"
                    onChange={(value) => updateIngredient(index, "productName", value)}
                    placeholder="low sodium soy sauce"
                    value={ingredient.productName ?? ""}
                  />
                  <TextField
                    label="Note"
                    onChange={(value) => updateIngredient(index, "note", value)}
                    placeholder="rinsed"
                    value={ingredient.note ?? ""}
                  />
                </div>
              </div>
            ))}
            <AddRowButton
              label="Add ingredient"
              onClick={() => updateField("ingredients", [...formRecipe.ingredients, emptyIngredient()])}
            />
          </div>

          <FormSectionTitle title="Directions" />
          <div className="space-y-3">
            {formRecipe.directions.map((direction, index) => (
              <div
                className="rounded-lg border border-stone-200 bg-stone-50/70 p-3"
                key={`direction-${index}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-stone-700">Direction {index + 1}</p>
                  <button
                    aria-label={`Remove direction ${index + 1}`}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm font-bold text-stone-500 transition hover:text-red-700"
                    onClick={() =>
                      updateField(
                        "directions",
                        formRecipe.directions.filter(
                          (_, directionIndex) => directionIndex !== index,
                        ),
                      )
                    }
                    type="button"
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                    Remove
                  </button>
                </div>
                <div className="mt-3 grid gap-3 lg:grid-cols-[0.9fr_1.8fr_0.7fr]">
                  <TextField
                    label="Section"
                    onChange={(value) => updateDirection(index, "section", value)}
                    placeholder="Sauce"
                    value={direction.section ?? ""}
                  />
                  <label className="space-y-2">
                    <span className="text-sm font-bold text-stone-700">Instruction</span>
                    <textarea
                      className={`${textareaClassName} min-h-24`}
                      onChange={(event) =>
                        updateDirection(index, "instruction", event.target.value)
                      }
                      placeholder="Simmer gently until glossy"
                      value={direction.instruction}
                    />
                  </label>
                  <NumberField
                    label="Timer"
                    min={0}
                    onChange={(value) => updateDirection(index, "timerMinutes", value)}
                    value={direction.timerMinutes}
                  />
                </div>
              </div>
            ))}
            <AddRowButton
              label="Add direction"
              onClick={() => updateField("directions", [...formRecipe.directions, emptyDirection()])}
            />
          </div>

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

function AddRowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 shadow-sm transition hover:bg-stone-50"
      onClick={onClick}
      type="button"
    >
      <Plus aria-hidden="true" className="h-4 w-4" />
      {label}
    </button>
  );
}
