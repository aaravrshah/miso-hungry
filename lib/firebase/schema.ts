import type { Category, Recipe, RecipeVisibility } from "@/lib/recipes";

export type SupportedDisplayName = "Aarav" | "Sophie";
export type CookedBy = SupportedDisplayName | "Both" | string;
export type AccountVisibility = "private" | "public";

export type UserProfile = {
  id: string;
  displayName: SupportedDisplayName | string;
  email: string | null;
  username?: string;
  photoURL?: string | null;
  photoPath?: string;
  accountVisibility?: AccountVisibility;
  defaultRecipeVisibility?: RecipeVisibility;
  bio?: string;
  favoriteCuisines?: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type UserSummary = {
  id: string;
  displayName: string;
  email?: string | null;
  username?: string;
  photoURL?: string | null;
};

export type FriendRequestStatus = "pending" | "accepted" | "declined";

export type FriendRequest = {
  id: string;
  fromUser: UserSummary;
  fromUserId: string;
  status: FriendRequestStatus;
  toUser: UserSummary;
  toUserId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type Friendship = {
  id: string;
  userIds: string[];
  users: Record<string, UserSummary>;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type CollaborationInviteStatus = "pending" | "accepted" | "declined";

export type CollaborationInvite = {
  id: string;
  fromUser: UserSummary;
  fromUserId: string;
  recipeId: string;
  recipeTitle: string;
  status: CollaborationInviteStatus;
  toUser: UserSummary;
  toUserId: string;
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
  rating?: number;
  ratedByUserId?: string;
  ratedByDisplayName?: string;
  taggedUserIds?: string[];
  taggedUsers?: UserSummary[];
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

export type DrinkCabinet = {
  id: string;
  userId: string;
  displayName: string;
  ingredients: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
};
