export type CategoryName = string;

export type Difficulty = "Easy" | "Medium" | "Hard";

export type RecipeUserSummary = {
  id: string;
  displayName: string;
  email?: string | null;
  photoURL?: string | null;
};

export type RecipeUserRating = RecipeUserSummary & {
  rating: number;
  dateMade?: string;
};

export type Category = {
  id: string;
  name: CategoryName;
  slug: string;
  description: string;
  accent: string;
  coverImageUrl?: string;
  coverImagePath?: string;
  sortOrder?: number;
  isDefault?: boolean;
  createdBy?: string;
  createdByDisplayName?: string;
  updatedBy?: string;
  updatedByDisplayName?: string;
};

export type Ingredient = {
  quantity: string;
  unit: string;
  item: string;
  brand?: string;
  productName?: string;
  note?: string;
};

export type Direction = {
  section?: string;
  instruction: string;
  timerMinutes?: number;
};

export type Recipe = {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  category: CategoryName;
  categoryIds?: string[];
  categories?: CategoryName[];
  tags?: string[];
  cuisine?: string;
  prepTime?: string;
  cookTime?: string;
  servings?: number;
  difficulty?: Difficulty;
  sourceUrl?: string;
  coverImageUrl?: string;
  coverImagePath?: string;
  ingredients: Ingredient[];
  directions: Direction[];
  notes?: string;
  aaravRating?: number;
  sophieRating?: number;
  dateAdded: string;
  lastMadeDate?: string;
  timesMade: number;
  createdBy?: string;
  createdByDisplayName?: string;
  collaboratorIds?: string[];
  collaborators?: RecipeUserSummary[];
  averageUserRating?: number;
  ratingCount?: number;
  ratingTotal?: number;
  latestUserRatings?: RecipeUserRating[];
  updatedBy?: string;
  updatedByDisplayName?: string;
};

export const uncategorizedCategoryName = "Uncategorized";

export const categoryTonePresets: Category[] = [
  {
    accent: "bg-rose-100 text-rose-800 ring-rose-200",
    description: "Soft cakes, spoonable sweets, and late-night treats.",
    id: "desserts",
    name: "Desserts",
    slug: "desserts",
  },
  {
    accent: "bg-orange-100 text-orange-900 ring-orange-200",
    description: "Comforting curries, spiced rice, chutneys, and breads.",
    id: "indian-food",
    name: "Indian Food",
    slug: "indian-food",
  },
  {
    accent: "bg-red-100 text-red-800 ring-red-200",
    description: "Bowls, noodles, snacks, and clean cozy flavors.",
    id: "japanese-food",
    name: "Japanese Food",
    slug: "japanese-food",
  },
  {
    accent: "bg-amber-100 text-amber-900 ring-amber-200",
    description: "Bright, savory dishes with plenty of crunch and heat.",
    id: "korean-food",
    name: "Korean Food",
    slug: "korean-food",
  },
  {
    accent: "bg-yellow-100 text-yellow-900 ring-yellow-200",
    description: "Weeknight noodles, silky sauces, and baked favorites.",
    id: "pasta",
    name: "Pasta",
    slug: "pasta",
  },
  {
    accent: "bg-sky-100 text-sky-900 ring-sky-200",
    description: "Slow mornings, crisp edges, fruit, coffee, and eggs.",
    id: "breakfast",
    name: "Breakfast",
    slug: "breakfast",
  },
  {
    accent: "bg-lime-100 text-lime-900 ring-lime-200",
    description: "Mocktails, coffee things, teas, and tiny celebrations.",
    id: "drinks",
    name: "Drinks",
    slug: "drinks",
  },
  {
    accent: "bg-fuchsia-100 text-fuchsia-900 ring-fuchsia-200",
    description: "The recipes that make dinner feel like an occasion.",
    id: "date-night",
    name: "Date Night",
    slug: "date-night",
  },
];

export function getCategoryByName(name: CategoryName) {
  return categoryTonePresets.find((category) => category.name === name);
}

export function getRecipeCategoryIds(recipe: Recipe) {
  const ids = recipe.categoryIds?.length ? recipe.categoryIds : [recipe.categoryId];
  return ids.filter(Boolean);
}

export function getRecipeCategoryNames(recipe: Recipe) {
  const names = recipe.categories?.length ? recipe.categories : [recipe.category];
  return names.filter(Boolean);
}

export function recipeMatchesCategory(recipe: Recipe, categoryId: string, categoryName?: string) {
  const categoryIds = getRecipeCategoryIds(recipe);
  const categoryNames = getRecipeCategoryNames(recipe);

  return (
    categoryIds.includes(categoryId) ||
    Boolean(categoryName && categoryNames.includes(categoryName))
  );
}

export function normalizeRatingToFive(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return undefined;
  }

  const fivePointValue = value > 5 ? value / 2 : value;
  const clampedRating = Math.min(5, Math.max(0.5, fivePointValue));
  return Math.round(clampedRating * 2) / 2;
}

export function averageRating(recipe: Recipe) {
  if (typeof recipe.averageUserRating === "number") {
    return normalizeRatingToFive(recipe.averageUserRating);
  }

  const ratings = [recipe.aaravRating, recipe.sophieRating]
    .map((rating) => normalizeRatingToFive(rating))
    .filter(
      (rating): rating is number => typeof rating === "number",
    );

  if (ratings.length === 0) {
    return undefined;
  }

  return ratings.reduce((total, rating) => total + rating, 0) / ratings.length;
}

export function formatRating(value?: number) {
  const rating = normalizeRatingToFive(value);
  return typeof rating === "number" ? `${rating.toFixed(1)}/5` : "Not rated";
}

export function formatTimerMinutes(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value) || value <= 0) {
    return "";
  }

  if (value < 1) {
    return `${Math.max(1, Math.round(value * 60))} sec`;
  }

  if (value >= 60) {
    const hours = Math.floor(value / 60);
    const minutes = Math.round(value % 60);
    return minutes ? `${hours} hr ${minutes} min` : `${hours} hr`;
  }

  return `${Math.round(value)} min`;
}

export function formatRecipeDate(value?: string) {
  if (!value) {
    return "Not made yet";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

export function canEditRecipe(recipe: Recipe, userId?: string) {
  return Boolean(
    userId && (recipe.createdBy === userId || recipe.collaboratorIds?.includes(userId)),
  );
}

export function canDeleteRecipe(recipe: Recipe, userId?: string) {
  return Boolean(userId && recipe.createdBy === userId);
}
