import type { Category, Recipe } from "@/lib/recipes";

export type SupportedDisplayName = "Aarav" | "Sophie";
export type CookedBy = SupportedDisplayName | "Both";

export type UserProfile = {
  id: string;
  displayName: SupportedDisplayName | string;
  email: string | null;
  photoURL?: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type FirestoreRecipe = Recipe & {
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type FirestoreCategory = Category & {
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type CookLog = {
  id: string;
  recipeId: string;
  dateMade: string;
  cookedBy: CookedBy;
  occasion?: string;
  aaravRating?: number;
  sophieRating?: number;
  notes?: string;
  changesNextTime?: string;
  imageUrl?: string;
  createdBy?: string;
  createdByDisplayName?: string;
  updatedBy?: string;
  updatedByDisplayName?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type CookLogInput = Omit<
  CookLog,
  | "id"
  | "recipeId"
  | "createdAt"
  | "updatedAt"
  | "createdBy"
  | "createdByDisplayName"
  | "updatedBy"
  | "updatedByDisplayName"
>;

export type PantryIngredientCategory =
  | "Produce"
  | "Dairy"
  | "Protein"
  | "Pantry"
  | "Spices"
  | "Sauces"
  | "Baking"
  | "Frozen"
  | "Other";

export type PantryIngredient = {
  id: string;
  name: string;
  normalizedName: string;
  category?: PantryIngredientCategory;
  preferredBrand?: string;
  preferredProductName?: string;
  store?: string;
  notes?: string;
  similarBrands?: string[];
  tags?: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type PantryIngredientInput = Omit<
  PantryIngredient,
  "id" | "normalizedName" | "createdAt" | "updatedAt"
>;

export type GroceryItem = {
  id: string;
  name: string;
  quantity?: string;
  unit?: string;
  category?: PantryIngredientCategory;
  checked: boolean;
  recipeIds?: string[];
  preferredBrand?: string;
  productName?: string;
  notes?: string;
  createdAt: string;
};

export type GroceryList = {
  id: string;
  userId: string;
  displayName: string;
  items: GroceryItem[];
  createdAt?: unknown;
  updatedAt?: unknown;
};
