"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  canViewRecipe,
  isFriendVisibleRecipe,
  isPublicVisibleRecipe,
  isRecipeInMyCookbook,
  uncategorizedCategoryName,
  type Category,
  type Recipe,
} from "@/lib/recipes";
import type { CookLog, CookLogInput, CookedBy } from "@/lib/firebase/schema";
import type { CollaborationInvite, UserSummary } from "@/lib/firebase/schema";
import {
  acceptCollaborationInvite as acceptCollaborationInviteService,
  createCategory as createFirestoreCategory,
  createCollaborationInvite,
  createCookLog,
  createRecipe as createFirestoreRecipe,
  deleteCategory as deleteFirestoreCategory,
  deleteCookLog as deleteFirestoreCookLog,
  deleteRecipe as deleteFirestoreRecipe,
  declineCollaborationInvite as declineCollaborationInviteService,
  duplicateRecipeToCookbook,
  fetchCategories,
  fetchCollaborationInvites,
  fetchCookLogs,
  fetchRecipes,
  reorderCategories as reorderFirestoreCategories,
  updateCategory as updateFirestoreCategory,
  updateCookLog as updateFirestoreCookLog,
  updateRecipe as updateFirestoreRecipe,
} from "@/lib/services/recipeService";
import { todayString } from "@/lib/services/helpers";
import { useAuth } from "@/components/AuthProvider";
import { useSocial } from "@/components/SocialProvider";

export type RecipeCreateInput = Omit<Recipe, "id"> & {
  id?: string;
};

export type RecipeStoreValue = {
  categories: Category[];
  collaborationInvites: {
    incoming: CollaborationInvite[];
    outgoing: CollaborationInvite[];
  };
  error?: string;
  isLoading: boolean;
  cookLogsByRecipe: Record<string, CookLog[]>;
  friendRecipes: Recipe[];
  publicRecipes: Recipe[];
  recipes: Recipe[];
  visibleRecipes: Recipe[];
  addCategory: (
    input: { coverImageFile?: File; coverImageUrl?: string; description: string; name: string },
  ) => Promise<Category>;
  addCookLog: (recipeId: string, input: CookLogInput) => Promise<CookLog | undefined>;
  addRecipe: (recipe: RecipeCreateInput, coverImageFile?: File) => Promise<Recipe>;
  deleteCategory: (categoryId: string) => Promise<void>;
  deleteCookLog: (recipeId: string, cookLogId: string) => Promise<void>;
  deleteRecipe: (recipeId: string) => Promise<void>;
  duplicateRecipe: (recipeId: string) => Promise<Recipe | undefined>;
  getRecipe: (recipeId: string) => Recipe | undefined;
  loadCookLogs: (recipeId: string) => Promise<CookLog[]>;
  markRecipeMade: (recipeId: string, notes?: string) => Promise<Recipe | undefined>;
  refreshCategories: () => Promise<void>;
  refreshRecipes: () => Promise<void>;
  reorderCategories: (categoryIds: string[]) => Promise<void>;
  updateCategory: (
    categoryId: string,
    input: {
      coverImageFile?: File;
      coverImageUrl?: string;
      description: string;
      name: string;
      sortOrder?: number;
    },
  ) => Promise<Category>;
  acceptCollaborationInvite: (inviteId: string) => Promise<void>;
  declineCollaborationInvite: (inviteId: string) => Promise<void>;
  refreshCollaborationInvites: () => Promise<void>;
  sendCollaborationInvite: (recipeId: string, toUser: UserSummary) => Promise<void>;
  updateCookLog: (
    recipeId: string,
    cookLogId: string,
    input: CookLogInput,
  ) => Promise<CookLog | undefined>;
  updateRecipe: (
    recipeId: string,
    updates: RecipeCreateInput | Recipe,
    coverImageFile?: File,
  ) => Promise<Recipe | undefined>;
};

export const RecipeStoreContext = createContext<RecipeStoreValue | undefined>(undefined);

function displayNameToCookedBy(displayName?: string): CookedBy {
  return displayName?.trim() || "Both";
}

export function RecipeProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const { friends } = useSocial();
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collaborationInvites, setCollaborationInvites] = useState<{
    incoming: CollaborationInvite[];
    outgoing: CollaborationInvite[];
  }>({
    incoming: [],
    outgoing: [],
  });
  const [cookLogsByRecipe, setCookLogsByRecipe] = useState<Record<string, CookLog[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const friendIds = useMemo(
    () => new Set(friends.map((friend) => friend.id)),
    [friends],
  );
  const visibleRecipes = useMemo(
    () =>
      profile
        ? allRecipes.filter((recipe) => canViewRecipe(recipe, profile.id, friendIds))
        : [],
    [allRecipes, friendIds, profile],
  );
  const recipes = useMemo(
    () =>
      profile
        ? visibleRecipes.filter((recipe) => isRecipeInMyCookbook(recipe, profile.id))
        : [],
    [profile, visibleRecipes],
  );
  const friendRecipes = useMemo(
    () =>
      profile
        ? visibleRecipes.filter((recipe) =>
            isFriendVisibleRecipe(recipe, profile.id, friendIds),
          )
        : [],
    [friendIds, profile, visibleRecipes],
  );
  const publicRecipes = useMemo(
    () =>
      profile
        ? visibleRecipes.filter((recipe) => isPublicVisibleRecipe(recipe, profile.id))
        : [],
    [profile, visibleRecipes],
  );

  const updateRecipeInState = useCallback((savedRecipe: Recipe) => {
    setAllRecipes((currentRecipes) =>
      currentRecipes.map((recipe) => (recipe.id === savedRecipe.id ? savedRecipe : recipe)),
    );
  }, []);

  const refreshRecipes = useCallback(async () => {
    const currentProfile = profile;

    if (!currentProfile) {
      return;
    }

    setIsLoading(true);
    setError(undefined);

    try {
      setAllRecipes(
        await fetchRecipes({
          friendIds: Array.from(friendIds),
          userId: currentProfile.id,
        }),
      );
    } catch (recipeError) {
      setError(recipeError instanceof Error ? recipeError.message : "Unable to load recipes.");
    } finally {
      setIsLoading(false);
    }
  }, [friendIds, profile]);

  const refreshCategories = useCallback(async () => {
    if (!profile) {
      return;
    }

    setError(undefined);

    try {
      setCategories(await fetchCategories());
    } catch (categoryError) {
      setError(
        categoryError instanceof Error ? categoryError.message : "Unable to load categories.",
      );
    }
  }, [profile]);

  const refreshCollaborationInvites = useCallback(async () => {
    if (!profile) {
      return;
    }

    setError(undefined);

    try {
      setCollaborationInvites(await fetchCollaborationInvites(profile.id));
    } catch (inviteError) {
      setError(
        inviteError instanceof Error
          ? inviteError.message
          : "Unable to load collaboration invites.",
      );
    }
  }, [profile]);

  useEffect(() => {
    const currentProfile = profile;

    if (!currentProfile) {
      window.queueMicrotask(() => {
        setAllRecipes([]);
        setCategories([]);
        setCollaborationInvites({ incoming: [], outgoing: [] });
        setCookLogsByRecipe({});
        setIsLoading(false);
      });
      return;
    }

    const currentUserId = currentProfile.id;
    let active = true;

    async function loadCookbookData() {
      setIsLoading(true);
      setError(undefined);

      try {
        const [nextCategories, nextRecipes, nextInvites] = await Promise.all([
          fetchCategories(),
          fetchRecipes({
            friendIds: Array.from(friendIds),
            userId: currentUserId,
          }),
          fetchCollaborationInvites(currentUserId),
        ]);

        if (active) {
          setCategories(nextCategories);
          setAllRecipes(nextRecipes);
          setCollaborationInvites(nextInvites);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load cookbook.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    window.queueMicrotask(() => {
      loadCookbookData();
    });

    return () => {
      active = false;
    };
  }, [friendIds, profile]);

  const addRecipe = useCallback(
    async (recipe: RecipeCreateInput, coverImageFile?: File) => {
      if (!profile) {
        throw new Error("You must be signed in to add a recipe.");
      }

      setError(undefined);
      const savedRecipe = await createFirestoreRecipe({
        coverImageFile,
        recipe: recipe as Recipe,
        user: profile,
      });
      setAllRecipes((currentRecipes) => [savedRecipe, ...currentRecipes]);
      return savedRecipe;
    },
    [profile],
  );

  const updateRecipe = useCallback(
    async (recipeId: string, updates: RecipeCreateInput | Recipe, coverImageFile?: File) => {
      if (!profile) {
        throw new Error("You must be signed in to edit a recipe.");
      }

      setError(undefined);
      const savedRecipe = await updateFirestoreRecipe({
        coverImageFile,
        recipe: updates as Recipe,
        recipeId,
        user: profile,
      });

      setAllRecipes((currentRecipes) =>
        currentRecipes.map((recipe) => (recipe.id === recipeId ? savedRecipe : recipe)),
      );

      return savedRecipe;
    },
    [profile],
  );

  const deleteRecipe = useCallback(async (recipeId: string) => {
    setError(undefined);
    await deleteFirestoreRecipe(recipeId);
    setAllRecipes((currentRecipes) =>
      currentRecipes.filter((recipe) => recipe.id !== recipeId),
    );
    setCookLogsByRecipe((currentLogs) => {
      const remainingLogs = { ...currentLogs };
      delete remainingLogs[recipeId];
      return remainingLogs;
    });
  }, []);

  const getRecipe = useCallback(
    (recipeId: string) => visibleRecipes.find((recipe) => recipe.id === recipeId),
    [visibleRecipes],
  );

  const duplicateRecipe = useCallback(
    async (recipeId: string) => {
      if (!profile) {
        throw new Error("You must be signed in to duplicate a recipe.");
      }

      const recipe = visibleRecipes.find((item) => item.id === recipeId);

      if (!recipe) {
        return undefined;
      }

      setError(undefined);
      const savedRecipe = await duplicateRecipeToCookbook({ recipe, user: profile });
      setAllRecipes((currentRecipes) => [savedRecipe, ...currentRecipes]);
      return savedRecipe;
    },
    [profile, visibleRecipes],
  );

  const sendCollaborationInvite = useCallback(
    async (recipeId: string, toUser: UserSummary) => {
      if (!profile) {
        throw new Error("You must be signed in to invite collaborators.");
      }

      const recipe = visibleRecipes.find((item) => item.id === recipeId);

      if (!recipe) {
        throw new Error("Recipe not found.");
      }

      setError(undefined);
      const invite = await createCollaborationInvite({ recipe, toUser, user: profile });
      setCollaborationInvites((currentInvites) => ({
        incoming: currentInvites.incoming,
        outgoing: [
          invite,
          ...currentInvites.outgoing.filter((item) => item.id !== invite.id),
        ],
      }));
      setAllRecipes((currentRecipes) =>
        currentRecipes.map((item) =>
          item.id === recipe.id
            ? {
                ...item,
                pendingCollaboratorIds: Array.from(
                  new Set([...(item.pendingCollaboratorIds ?? []), toUser.id]),
                ),
                pendingCollaborators: [
                  ...(item.pendingCollaborators ?? []).filter(
                    (collaborator) => collaborator.id !== toUser.id,
                  ),
                  toUser,
                ],
              }
            : item,
        ),
      );
    },
    [profile, visibleRecipes],
  );

  const acceptCollaborationInvite = useCallback(
    async (inviteId: string) => {
      if (!profile) {
        throw new Error("You must be signed in to accept collaboration invites.");
      }

      const invite = collaborationInvites.incoming.find((item) => item.id === inviteId);

      if (!invite) {
        throw new Error("Collaboration invite not found.");
      }

      setError(undefined);
      const savedRecipe = await acceptCollaborationInviteService({ invite, user: profile });
      setAllRecipes((currentRecipes) => {
        const existing = currentRecipes.some((recipe) => recipe.id === savedRecipe.id);

        return existing
          ? currentRecipes.map((recipe) =>
              recipe.id === savedRecipe.id ? savedRecipe : recipe,
            )
          : [savedRecipe, ...currentRecipes];
      });
      setCollaborationInvites((currentInvites) => ({
        incoming: currentInvites.incoming.filter((item) => item.id !== inviteId),
        outgoing: currentInvites.outgoing,
      }));
    },
    [collaborationInvites.incoming, profile],
  );

  const declineCollaborationInvite = useCallback(
    async (inviteId: string) => {
      if (!profile) {
        throw new Error("You must be signed in to decline collaboration invites.");
      }

      const invite =
        collaborationInvites.incoming.find((item) => item.id === inviteId) ??
        collaborationInvites.outgoing.find((item) => item.id === inviteId);

      if (!invite) {
        throw new Error("Collaboration invite not found.");
      }

      setError(undefined);
      await declineCollaborationInviteService({ invite, user: profile });
      setCollaborationInvites((currentInvites) => ({
        incoming: currentInvites.incoming.filter((item) => item.id !== inviteId),
        outgoing: currentInvites.outgoing.filter((item) => item.id !== inviteId),
      }));
      setAllRecipes((currentRecipes) =>
        currentRecipes.map((recipe) =>
          recipe.id === invite.recipeId
            ? {
                ...recipe,
                pendingCollaboratorIds: (recipe.pendingCollaboratorIds ?? []).filter(
                  (userId) => userId !== invite.toUserId,
                ),
                pendingCollaborators: (recipe.pendingCollaborators ?? []).filter(
                  (collaborator) => collaborator.id !== invite.toUserId,
                ),
              }
            : recipe,
        ),
      );
    },
    [collaborationInvites.incoming, collaborationInvites.outgoing, profile],
  );

  const loadCookLogs = useCallback(async (recipeId: string) => {
    setError(undefined);
    const cookLogs = await fetchCookLogs(recipeId);
    setCookLogsByRecipe((currentLogs) => ({
      ...currentLogs,
      [recipeId]: cookLogs,
    }));
    return cookLogs;
  }, []);

  const addCookLog = useCallback(
    async (recipeId: string, input: CookLogInput) => {
      if (!profile) {
        throw new Error("You must be signed in to log a cook.");
      }

      const recipe = recipes.find((item) => item.id === recipeId);

      if (!recipe) {
        return undefined;
      }

      setError(undefined);
      const result = await createCookLog({ input, recipe, user: profile });
      setCookLogsByRecipe((currentLogs) => ({
        ...currentLogs,
        [recipeId]: result.cookLogs,
      }));
      updateRecipeInState(result.recipe);
      return result.cookLog;
    },
    [profile, recipes, updateRecipeInState],
  );

  const updateCookLog = useCallback(
    async (recipeId: string, cookLogId: string, input: CookLogInput) => {
      if (!profile) {
        throw new Error("You must be signed in to edit a cook log.");
      }

      setError(undefined);
      const result = await updateFirestoreCookLog({
        cookLogId,
        input,
        recipeId,
        user: profile,
      });
      setCookLogsByRecipe((currentLogs) => ({
        ...currentLogs,
        [recipeId]: result.cookLogs,
      }));
      updateRecipeInState(result.recipe);
      return result.cookLog;
    },
    [profile, updateRecipeInState],
  );

  const deleteCookLog = useCallback(
    async (recipeId: string, cookLogId: string) => {
      if (!profile) {
        throw new Error("You must be signed in to delete a cook log.");
      }

      setError(undefined);
      const result = await deleteFirestoreCookLog({ cookLogId, recipeId, user: profile });
      setCookLogsByRecipe((currentLogs) => ({
        ...currentLogs,
        [recipeId]: result.cookLogs,
      }));
      updateRecipeInState(result.recipe);
    },
    [profile, updateRecipeInState],
  );

  const markRecipeMade = useCallback(
    async (recipeId: string, notes?: string) => {
      if (!profile) {
        throw new Error("You must be signed in to log a cook.");
      }

      const recipe = recipes.find((item) => item.id === recipeId);

      if (!recipe) {
        return undefined;
      }

      const result = await createCookLog({
        input: {
          cookedBy: displayNameToCookedBy(profile.displayName),
          dateMade: todayString(),
          notes,
        },
        recipe,
        user: profile,
      });
      setCookLogsByRecipe((currentLogs) => ({
        ...currentLogs,
        [recipeId]: result.cookLogs,
      }));
      updateRecipeInState(result.recipe);

      return result.recipe;
    },
    [profile, recipes, updateRecipeInState],
  );

  const addCategory = useCallback(
    async (input: {
      coverImageFile?: File;
      coverImageUrl?: string;
      description: string;
      name: string;
    }) => {
      if (!profile) {
        throw new Error("You must be signed in to add a category.");
      }

      setError(undefined);
      const savedCategory = await createFirestoreCategory({
        coverImageFile: input.coverImageFile,
        coverImageUrl: input.coverImageUrl,
        description: input.description,
        name: input.name,
        user: profile,
      });
      setCategories((currentCategories) =>
        [...currentCategories, savedCategory].sort((first, second) => {
          const orderSort =
            (first.sortOrder ?? Number.MAX_SAFE_INTEGER) -
            (second.sortOrder ?? Number.MAX_SAFE_INTEGER);
          return orderSort || first.name.localeCompare(second.name);
        }),
      );
      return savedCategory;
    },
    [profile],
  );

  const updateCategory = useCallback(
    async (
      categoryId: string,
      input: {
        coverImageFile?: File;
        coverImageUrl?: string;
        description: string;
        name: string;
        sortOrder?: number;
      },
    ) => {
      if (!profile) {
        throw new Error("You must be signed in to edit a category.");
      }

      const previousCategory = categories.find((category) => category.id === categoryId);
      setError(undefined);
      const savedCategory = await updateFirestoreCategory({
        categoryId,
        coverImageFile: input.coverImageFile,
        coverImageUrl: input.coverImageUrl,
        description: input.description,
        name: input.name,
        sortOrder: input.sortOrder,
        user: profile,
      });
      setCategories((currentCategories) =>
        currentCategories.map((category) =>
          category.id === categoryId ? savedCategory : category,
        ),
      );
      setAllRecipes((currentRecipes) =>
        currentRecipes.map((recipe) => {
          const categoryIds = recipe.categoryIds?.length
            ? recipe.categoryIds
            : recipe.categoryId
              ? [recipe.categoryId]
              : [];
          const recipeCategories = recipe.categories?.length
            ? recipe.categories
            : recipe.category
              ? [recipe.category]
              : [];
          const usesCategory =
            categoryIds.includes(categoryId) ||
            recipe.categoryId === categoryId ||
            Boolean(previousCategory && recipeCategories.includes(previousCategory.name));

          if (!usesCategory) {
            return recipe;
          }

          const nextCategories = recipeCategories.map((categoryName, index) =>
            categoryIds[index] === categoryId || categoryName === previousCategory?.name
              ? savedCategory.name
              : categoryName,
          );

          return {
            ...recipe,
            categories: nextCategories,
            category: nextCategories[0] ?? uncategorizedCategoryName,
          };
        }),
      );
      return savedCategory;
    },
    [categories, profile],
  );

  const reorderCategories = useCallback(
    async (categoryIds: string[]) => {
      if (!profile) {
        throw new Error("You must be signed in to reorder categories.");
      }

      setError(undefined);
      await reorderFirestoreCategories({ categoryIds, user: profile });
      setCategories((currentCategories) => {
        const orderLookup = new Map(
          categoryIds.map((categoryId, sortOrder) => [categoryId, sortOrder]),
        );

        return [...currentCategories]
          .map((category) => ({
            ...category,
            sortOrder: orderLookup.get(category.id) ?? category.sortOrder,
          }))
          .sort((first, second) => {
            const orderSort =
              (first.sortOrder ?? Number.MAX_SAFE_INTEGER) -
              (second.sortOrder ?? Number.MAX_SAFE_INTEGER);
            return orderSort || first.name.localeCompare(second.name);
          });
      });
    },
    [profile],
  );

  const deleteCategory = useCallback(
    async (categoryId: string) => {
      if (!profile) {
        throw new Error("You must be signed in to delete a category.");
      }

      const category = categories.find((item) => item.id === categoryId);

      if (!category) {
        return;
      }

      setError(undefined);
      await deleteFirestoreCategory({ categoryId, user: profile });
      setCategories((currentCategories) =>
        currentCategories.filter((currentCategory) => currentCategory.id !== categoryId),
      );
      setAllRecipes((currentRecipes) =>
        currentRecipes.map((recipe) => {
          const categoryIds = (recipe.categoryIds?.length
            ? recipe.categoryIds
            : [recipe.categoryId]
          ).filter((id) => id && id !== categoryId);
          const recipeCategories = (recipe.categories?.length
            ? recipe.categories
            : [recipe.category]
          ).filter((name) => name && name !== category.name);

          return {
            ...recipe,
            category: recipeCategories[0] ?? uncategorizedCategoryName,
            categoryId: categoryIds[0] ?? "",
            categories: recipeCategories,
            categoryIds,
          };
        }),
      );
    },
    [categories, profile],
  );

  const value = useMemo(
    () => ({
      acceptCollaborationInvite,
      categories,
      collaborationInvites,
      cookLogsByRecipe,
      declineCollaborationInvite,
      error,
      friendRecipes,
      isLoading,
      publicRecipes,
      recipes,
      visibleRecipes,
      addCategory,
      addCookLog,
      addRecipe,
      deleteCategory,
      deleteCookLog,
      deleteRecipe,
      duplicateRecipe,
      getRecipe,
      loadCookLogs,
      markRecipeMade,
      refreshCategories,
      refreshCollaborationInvites,
      refreshRecipes,
      reorderCategories,
      sendCollaborationInvite,
      updateCategory,
      updateCookLog,
      updateRecipe,
    }),
    [
      acceptCollaborationInvite,
      addCategory,
      addCookLog,
      addRecipe,
      categories,
      collaborationInvites,
      cookLogsByRecipe,
      deleteCategory,
      deleteCookLog,
      deleteRecipe,
      declineCollaborationInvite,
      duplicateRecipe,
      error,
      friendRecipes,
      getRecipe,
      isLoading,
      loadCookLogs,
      markRecipeMade,
      publicRecipes,
      recipes,
      refreshCategories,
      refreshCollaborationInvites,
      refreshRecipes,
      reorderCategories,
      sendCollaborationInvite,
      updateCategory,
      updateCookLog,
      updateRecipe,
      visibleRecipes,
    ],
  );

  return (
    <RecipeStoreContext.Provider value={value}>{children}</RecipeStoreContext.Provider>
  );
}

export function useRecipes() {
  const context = useContext(RecipeStoreContext);

  if (!context) {
    throw new Error("useRecipes must be used inside RecipeProvider");
  }

  return context;
}
