"use client";

import { ChefHat } from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AuthContext, type AuthContextValue } from "@/components/AuthProvider";
import { Navigation } from "@/components/Navigation";
import { NotificationBell } from "@/components/NotificationBell";
import {
  NotificationContext,
  type NotificationContextValue,
} from "@/components/NotificationProvider";
import {
  RecipeStoreContext,
  type RecipeCreateInput,
  type RecipeStoreValue,
} from "@/components/RecipeStore";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import {
  SocialContext,
  type SocialContextValue,
  useSocial,
} from "@/components/SocialProvider";
import {
  demoCategories,
  demoCollaborationInvites,
  demoCookLogsByRecipe,
  demoCurrentUser,
  demoFriendRequests,
  demoFriends,
  demoNotifications,
  demoRecipes,
  demoUsers,
} from "@/lib/demoData";
import type {
  AppNotification,
  CollaborationInvite,
  CookLog,
  CookLogInput,
  FriendRequest,
  UserProfile,
  UserSummary,
} from "@/lib/firebase/schema";
import {
  canViewRecipe,
  defaultRecipeVisibility,
  isFriendVisibleRecipe,
  isPublicVisibleRecipe,
  isRecipeInMyCookbook,
  uncategorizedCategoryName,
  type Category,
  type Recipe,
} from "@/lib/recipes";
import { slugify, todayString } from "@/lib/services/helpers";

type DemoStateProviderProps = {
  children: ReactNode;
};

function createDemoId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function userSummary(user: UserProfile): UserSummary {
  return {
    displayName: String(user.displayName),
    email: user.email,
    id: user.id,
    photoURL: user.photoURL,
    username: user.username,
  };
}

function sortLogs(logs: CookLog[]) {
  return [...logs].sort((first, second) => second.dateMade.localeCompare(first.dateMade));
}

function recipeWithCookLogSummary(recipe: Recipe, logs: CookLog[]) {
  const sortedLogs = sortLogs(logs);
  const ratings = sortedLogs.flatMap((log) =>
    [log.rating, log.aaravRating, log.sophieRating].filter(
      (rating): rating is number => typeof rating === "number",
    ),
  );

  return {
    ...recipe,
    averageUserRating: ratings.length
      ? ratings.reduce((total, rating) => total + rating, 0) / ratings.length
      : recipe.averageUserRating,
    lastMadeDate: sortedLogs[0]?.dateMade,
    ratingCount: ratings.length || recipe.ratingCount,
    ratingTotal: ratings.length
      ? ratings.reduce((total, rating) => total + rating, 0)
      : recipe.ratingTotal,
    timesMade: sortedLogs.length,
  };
}

function DemoAuthProvider({ children }: DemoStateProviderProps) {
  const [profile, setProfile] = useState<UserProfile>(demoCurrentUser);
  const updateProfile = useCallback(async (input: {
    accountVisibility?: UserProfile["accountVisibility"];
    defaultRecipeVisibility?: Recipe["visibility"];
    displayName: string;
    notificationPreferences?: UserProfile["notificationPreferences"];
    username?: string;
  }) => {
    setProfile((currentProfile) => ({
      ...currentProfile,
      accountVisibility: input.accountVisibility,
      defaultRecipeVisibility: input.defaultRecipeVisibility,
      displayName: input.displayName,
      notificationPreferences: input.notificationPreferences,
      username: input.username,
    }));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      error: undefined,
      isConfigured: true,
      isLoading: false,
      missingConfig: [],
      profile,
      sendPasswordReset: async () => undefined,
      signIn: async () => undefined,
      signInWithGoogle: async () => undefined,
      signOut: async () => undefined,
      signUp: async () => undefined,
      updateDisplayName: async (displayName: string) => {
        setProfile((currentProfile) => ({ ...currentProfile, displayName }));
      },
      updateUserProfile: updateProfile,
    }),
    [profile, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function DemoSocialProvider({ children }: DemoStateProviderProps) {
  const [allUsers] = useState<UserProfile[]>(demoUsers);
  const [friends, setFriends] = useState<UserSummary[]>(demoFriends);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>(
    demoFriendRequests.incoming,
  );
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>(
    demoFriendRequests.outgoing,
  );

  const sendFriendRequest = useCallback(
    async (userId: string) => {
      const user = allUsers.find((item) => item.id === userId);

      if (!user) {
        throw new Error("Demo user not found.");
      }

      setOutgoingRequests((currentRequests) => [
        {
          fromUser: userSummary(demoCurrentUser),
          fromUserId: demoCurrentUser.id,
          id: createDemoId("demo-friend-request"),
          status: "pending",
          toUser: userSummary(user),
          toUserId: user.id,
        },
        ...currentRequests,
      ]);
    },
    [allUsers],
  );

  const acceptFriendRequest = useCallback(
    async (requestId: string) => {
      const request = incomingRequests.find((item) => item.id === requestId);

      if (!request) {
        return;
      }

      setFriends((currentFriends) =>
        currentFriends.some((friend) => friend.id === request.fromUserId)
          ? currentFriends
          : [request.fromUser, ...currentFriends],
      );
      setIncomingRequests((currentRequests) =>
        currentRequests.filter((item) => item.id !== requestId),
      );
    },
    [incomingRequests],
  );

  const declineFriendRequest = useCallback(async (requestId: string) => {
    setIncomingRequests((currentRequests) =>
      currentRequests.filter((item) => item.id !== requestId),
    );
    setOutgoingRequests((currentRequests) =>
      currentRequests.filter((item) => item.id !== requestId),
    );
  }, []);

  const removeFriend = useCallback(async (friendId: string) => {
    setFriends((currentFriends) => currentFriends.filter((friend) => friend.id !== friendId));
  }, []);

  const isFriend = useCallback(
    (userId?: string) => Boolean(userId && friends.some((friend) => friend.id === userId)),
    [friends],
  );

  const value = useMemo<SocialContextValue>(
    () => ({
      acceptFriendRequest,
      allUsers,
      declineFriendRequest,
      error: undefined,
      friends,
      incomingRequests,
      isFriend,
      isLoading: false,
      outgoingRequests,
      refreshSocialData: async () => undefined,
      removeFriend,
      sendFriendRequest,
    }),
    [
      acceptFriendRequest,
      allUsers,
      declineFriendRequest,
      friends,
      incomingRequests,
      isFriend,
      outgoingRequests,
      removeFriend,
      sendFriendRequest,
    ],
  );

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}

function DemoRecipeProvider({ children }: DemoStateProviderProps) {
  const { friends } = useSocial();
  const [allRecipes, setAllRecipes] = useState<Recipe[]>(demoRecipes);
  const [categories, setCategories] = useState<Category[]>(demoCategories);
  const [cookLogsByRecipe, setCookLogsByRecipe] = useState<Record<string, CookLog[]>>(
    demoCookLogsByRecipe,
  );
  const [collaborationInvites, setCollaborationInvites] = useState<{
    incoming: CollaborationInvite[];
    outgoing: CollaborationInvite[];
  }>(demoCollaborationInvites);
  const friendIds = useMemo(
    () => new Set(friends.map((friend) => friend.id)),
    [friends],
  );
  const visibleRecipes = useMemo(
    () => allRecipes.filter((recipe) => canViewRecipe(recipe, demoCurrentUser.id, friendIds)),
    [allRecipes, friendIds],
  );
  const recipes = useMemo(
    () => visibleRecipes.filter((recipe) => isRecipeInMyCookbook(recipe, demoCurrentUser.id)),
    [visibleRecipes],
  );
  const friendRecipes = useMemo(
    () =>
      visibleRecipes.filter((recipe) =>
        isFriendVisibleRecipe(recipe, demoCurrentUser.id, friendIds),
      ),
    [friendIds, visibleRecipes],
  );
  const publicRecipes = useMemo(
    () => visibleRecipes.filter((recipe) => isPublicVisibleRecipe(recipe, demoCurrentUser.id)),
    [visibleRecipes],
  );

  const getRecipe = useCallback(
    (recipeId: string) => visibleRecipes.find((recipe) => recipe.id === recipeId),
    [visibleRecipes],
  );

  const addRecipe = useCallback(async (recipe: RecipeCreateInput) => {
    const savedRecipe: Recipe = {
      ...recipe,
      category: recipe.category || uncategorizedCategoryName,
      categoryId: recipe.categoryId || "",
      createdBy: demoCurrentUser.id,
      createdByDisplayName: String(demoCurrentUser.displayName),
      dateAdded: recipe.dateAdded || todayString(),
      id: recipe.id || createDemoId("demo-recipe"),
      ingredients: recipe.ingredients ?? [],
      directions: recipe.directions ?? [],
      timesMade: recipe.timesMade ?? 0,
      visibility: recipe.visibility ?? demoCurrentUser.defaultRecipeVisibility ?? defaultRecipeVisibility,
    };

    setAllRecipes((currentRecipes) => [savedRecipe, ...currentRecipes]);
    return savedRecipe;
  }, []);

  const updateRecipe = useCallback(
    async (recipeId: string, updates: RecipeCreateInput | Recipe) => {
      const existingRecipe = allRecipes.find((recipe) => recipe.id === recipeId);

      if (!existingRecipe) {
        return undefined;
      }

      const savedRecipe: Recipe = {
        ...existingRecipe,
        ...updates,
        id: recipeId,
        updatedBy: demoCurrentUser.id,
        updatedByDisplayName: String(demoCurrentUser.displayName),
      };

      setAllRecipes((currentRecipes) =>
        currentRecipes.map((recipe) => (recipe.id === recipeId ? savedRecipe : recipe)),
      );
      return savedRecipe;
    },
    [allRecipes],
  );

  const deleteRecipe = useCallback(async (recipeId: string) => {
    setAllRecipes((currentRecipes) =>
      currentRecipes.filter((recipe) => recipe.id !== recipeId),
    );
  }, []);

  const duplicateRecipe = useCallback(
    async (recipeId: string) => {
      const recipe = visibleRecipes.find((item) => item.id === recipeId);

      if (!recipe) {
        return undefined;
      }

      const savedRecipe: Recipe = {
        ...recipe,
        collaboratorIds: [],
        collaborators: [],
        createdBy: demoCurrentUser.id,
        createdByDisplayName: String(demoCurrentUser.displayName),
        dateAdded: todayString(),
        id: createDemoId("demo-copy"),
        inspiredByDisplayName: recipe.createdByDisplayName,
        inspiredByRecipeId: recipe.id,
        inspiredByTitle: recipe.title,
        inspiredByUserId: recipe.createdBy,
        lastMadeDate: undefined,
        timesMade: 0,
        title: `${recipe.title} Copy`,
        visibility: demoCurrentUser.defaultRecipeVisibility ?? defaultRecipeVisibility,
      };

      setAllRecipes((currentRecipes) => [savedRecipe, ...currentRecipes]);
      return savedRecipe;
    },
    [visibleRecipes],
  );

  const loadCookLogs = useCallback(
    async (recipeId: string) => sortLogs(cookLogsByRecipe[recipeId] ?? []),
    [cookLogsByRecipe],
  );

  const addCookLog = useCallback(
    async (recipeId: string, input: CookLogInput) => {
      const recipe = visibleRecipes.find((item) => item.id === recipeId);

      if (!recipe) {
        return undefined;
      }

      const savedLog: CookLog = {
        ...input,
        createdBy: demoCurrentUser.id,
        createdByDisplayName: String(demoCurrentUser.displayName),
        dateMade: input.dateMade || todayString(),
        id: createDemoId("demo-cook-log"),
        recipeId,
      };

      const nextLogs = sortLogs([savedLog, ...(cookLogsByRecipe[recipeId] ?? [])]);
      setCookLogsByRecipe((currentLogs) => ({
        ...currentLogs,
        [recipeId]: nextLogs,
      }));
      setAllRecipes((currentRecipes) =>
        currentRecipes.map((item) =>
          item.id === recipeId ? recipeWithCookLogSummary(item, nextLogs) : item,
        ),
      );
      return savedLog;
    },
    [cookLogsByRecipe, visibleRecipes],
  );

  const updateCookLog = useCallback(
    async (recipeId: string, cookLogId: string, input: CookLogInput) => {
      const nextLogs = sortLogs(
        (cookLogsByRecipe[recipeId] ?? []).map((log) =>
          log.id === cookLogId
            ? {
                ...log,
                ...input,
                updatedBy: demoCurrentUser.id,
                updatedByDisplayName: String(demoCurrentUser.displayName),
              }
            : log,
        ),
      );
      const savedLog = nextLogs.find((log) => log.id === cookLogId);

      setCookLogsByRecipe((currentLogs) => ({
        ...currentLogs,
        [recipeId]: nextLogs,
      }));
      setAllRecipes((currentRecipes) =>
        currentRecipes.map((recipe) =>
          recipe.id === recipeId ? recipeWithCookLogSummary(recipe, nextLogs) : recipe,
        ),
      );
      return savedLog;
    },
    [cookLogsByRecipe],
  );

  const deleteCookLog = useCallback(
    async (recipeId: string, cookLogId: string) => {
      const nextLogs = sortLogs(
        (cookLogsByRecipe[recipeId] ?? []).filter((log) => log.id !== cookLogId),
      );

      setCookLogsByRecipe((currentLogs) => ({
        ...currentLogs,
        [recipeId]: nextLogs,
      }));
      setAllRecipes((currentRecipes) =>
        currentRecipes.map((recipe) =>
          recipe.id === recipeId ? recipeWithCookLogSummary(recipe, nextLogs) : recipe,
        ),
      );
    },
    [cookLogsByRecipe],
  );

  const markRecipeMade = useCallback(
    async (recipeId: string, notes?: string) => {
      await addCookLog(recipeId, {
        cookedBy: String(demoCurrentUser.displayName),
        dateMade: todayString(),
        notes,
      });
      return getRecipe(recipeId);
    },
    [addCookLog, getRecipe],
  );

  const addCategory = useCallback(
    async (input: {
      coverImageUrl?: string;
      description: string;
      name: string;
    }) => {
      const savedCategory: Category = {
        accent: "bg-stone-100 text-stone-800 ring-stone-200",
        coverImageUrl: input.coverImageUrl,
        createdBy: demoCurrentUser.id,
        createdByDisplayName: String(demoCurrentUser.displayName),
        description: input.description,
        id: createDemoId("demo-category"),
        name: input.name,
        slug: slugify(input.name),
        sortOrder: categories.length,
      };

      setCategories((currentCategories) => [...currentCategories, savedCategory]);
      return savedCategory;
    },
    [categories.length],
  );

  const updateCategory = useCallback(
    async (
      categoryId: string,
      input: {
        coverImageUrl?: string;
        description: string;
        name: string;
        sortOrder?: number;
      },
    ) => {
      const previousCategory = categories.find((category) => category.id === categoryId);
      const savedCategory: Category = {
        ...(previousCategory ?? {
          accent: "bg-stone-100 text-stone-800 ring-stone-200",
          id: categoryId,
          slug: slugify(input.name),
        }),
        coverImageUrl: input.coverImageUrl ?? previousCategory?.coverImageUrl,
        description: input.description,
        name: input.name,
        slug: slugify(input.name),
        sortOrder: input.sortOrder ?? previousCategory?.sortOrder,
        updatedBy: demoCurrentUser.id,
        updatedByDisplayName: String(demoCurrentUser.displayName),
      };

      setCategories((currentCategories) =>
        currentCategories.map((category) =>
          category.id === categoryId ? savedCategory : category,
        ),
      );
      setAllRecipes((currentRecipes) =>
        currentRecipes.map((recipe) => {
          const usesCategory =
            recipe.categoryId === categoryId ||
            recipe.categoryIds?.includes(categoryId) ||
            recipe.categories?.includes(previousCategory?.name ?? "");

          if (!usesCategory) {
            return recipe;
          }

          const categoriesForRecipe = (recipe.categories?.length
            ? recipe.categories
            : [recipe.category]
          ).map((name) => (name === previousCategory?.name ? savedCategory.name : name));

          return {
            ...recipe,
            categories: categoriesForRecipe,
            category: categoriesForRecipe[0] ?? savedCategory.name,
          };
        }),
      );
      return savedCategory;
    },
    [categories],
  );

  const deleteCategory = useCallback(
    async (categoryId: string) => {
      const category = categories.find((item) => item.id === categoryId);

      setCategories((currentCategories) =>
        currentCategories.filter((item) => item.id !== categoryId),
      );
      setAllRecipes((currentRecipes) =>
        currentRecipes.map((recipe) => ({
          ...recipe,
          categoryIds: (recipe.categoryIds ?? []).filter((id) => id !== categoryId),
          categories: (recipe.categories ?? []).filter((name) => name !== category?.name),
        })),
      );
    },
    [categories],
  );

  const reorderCategories = useCallback(async (categoryIds: string[]) => {
    const orderLookup = new Map(
      categoryIds.map((categoryId, sortOrder) => [categoryId, sortOrder]),
    );

    setCategories((currentCategories) =>
      [...currentCategories]
        .map((category) => ({
          ...category,
          sortOrder: orderLookup.get(category.id) ?? category.sortOrder,
        }))
        .sort((first, second) => (first.sortOrder ?? 0) - (second.sortOrder ?? 0)),
    );
  }, []);

  const sendCollaborationInvite = useCallback(
    async (recipeId: string, toUser: UserSummary) => {
      const recipe = visibleRecipes.find((item) => item.id === recipeId);

      if (!recipe) {
        return;
      }

      const invite: CollaborationInvite = {
        fromUser: userSummary(demoCurrentUser),
        fromUserId: demoCurrentUser.id,
        id: createDemoId("demo-collab"),
        recipeId,
        recipeTitle: recipe.title,
        status: "pending",
        toUser,
        toUserId: toUser.id,
      };

      setCollaborationInvites((currentInvites) => ({
        incoming: currentInvites.incoming,
        outgoing: [invite, ...currentInvites.outgoing],
      }));
    },
    [visibleRecipes],
  );

  const acceptCollaborationInvite = useCallback(
    async (inviteId: string) => {
      const invite = collaborationInvites.incoming.find((item) => item.id === inviteId);

      if (!invite) {
        return;
      }

      setAllRecipes((currentRecipes) =>
        currentRecipes.map((recipe) =>
          recipe.id === invite.recipeId
            ? {
                ...recipe,
                collaboratorIds: Array.from(
                  new Set([...(recipe.collaboratorIds ?? []), demoCurrentUser.id]),
                ),
                collaborators: [
                  ...(recipe.collaborators ?? []).filter(
                    (collaborator) => collaborator.id !== demoCurrentUser.id,
                  ),
                  userSummary(demoCurrentUser),
                ],
              }
            : recipe,
        ),
      );
      setCollaborationInvites((currentInvites) => ({
        incoming: currentInvites.incoming.filter((item) => item.id !== inviteId),
        outgoing: currentInvites.outgoing,
      }));
    },
    [collaborationInvites.incoming],
  );

  const declineCollaborationInvite = useCallback(async (inviteId: string) => {
    setCollaborationInvites((currentInvites) => ({
      incoming: currentInvites.incoming.filter((item) => item.id !== inviteId),
      outgoing: currentInvites.outgoing.filter((item) => item.id !== inviteId),
    }));
  }, []);

  const value = useMemo<RecipeStoreValue>(
    () => ({
      acceptCollaborationInvite,
      addCategory,
      addCookLog,
      addRecipe,
      categories,
      collaborationInvites,
      cookLogsByRecipe,
      declineCollaborationInvite,
      deleteCategory,
      deleteCookLog,
      deleteRecipe,
      duplicateRecipe,
      error: undefined,
      friendRecipes,
      getRecipe,
      isLoading: false,
      loadCookLogs,
      markRecipeMade,
      publicRecipes,
      recipes,
      refreshCategories: async () => undefined,
      refreshCollaborationInvites: async () => undefined,
      refreshRecipes: async () => undefined,
      reorderCategories,
      sendCollaborationInvite,
      updateCategory,
      updateCookLog,
      updateRecipe,
      visibleRecipes,
    }),
    [
      acceptCollaborationInvite,
      addCategory,
      addCookLog,
      addRecipe,
      categories,
      collaborationInvites,
      cookLogsByRecipe,
      declineCollaborationInvite,
      deleteCategory,
      deleteCookLog,
      deleteRecipe,
      duplicateRecipe,
      friendRecipes,
      getRecipe,
      loadCookLogs,
      markRecipeMade,
      publicRecipes,
      recipes,
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

function DemoNotificationProvider({ children }: DemoStateProviderProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>(demoNotifications);

  const markRead = useCallback(async (notificationId: string) => {
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) =>
        notification.id === notificationId ? { ...notification, isRead: true } : notification,
      ),
    );
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) => ({ ...notification, isRead: true })),
    );
  }, []);

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;
  const value = useMemo<NotificationContextValue>(
    () => ({
      error: undefined,
      isLoading: false,
      markAllRead,
      markRead,
      notifications,
      refreshNotifications: async () => undefined,
      unreadCount,
    }),
    [markAllRead, markRead, notifications, unreadCount],
  );

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
}

function DemoContextProviders({ children }: DemoStateProviderProps) {
  return (
    <DemoAuthProvider>
      <DemoSocialProvider>
        <DemoRecipeProvider>
          <DemoNotificationProvider>{children}</DemoNotificationProvider>
        </DemoRecipeProvider>
      </DemoSocialProvider>
    </DemoAuthProvider>
  );
}

export function DemoAppLayout({ children }: { children: ReactNode }) {
  return (
    <DemoContextProviders>
      <ServiceWorkerRegistration />
      <div className="min-h-dvh">
        <Navigation />

        <div className="lg:pl-72">
          <header className="sticky top-0 z-20 border-b border-stone-200 bg-[#fbf5eb]/92 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <Link className="flex min-w-0 items-center gap-3" href="/demo">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--tomato)] text-white">
                  <ChefHat aria-hidden="true" className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-serif text-xl leading-none text-stone-950">
                    Miso Hungry
                  </span>
                  <span className="block truncate text-xs font-semibold text-stone-500">
                    Demo preview
                  </span>
                </span>
              </Link>
              <NotificationBell />
            </div>
          </header>

          <main className="mx-auto w-full max-w-7xl px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 sm:pb-[calc(7.5rem+env(safe-area-inset-bottom))] lg:px-8 lg:pb-12 lg:pt-8">
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 shadow-sm">
              Demo mode uses local mock data only. Changes reset when the page refreshes.
            </div>
            {children}
          </main>
        </div>
      </div>
    </DemoContextProviders>
  );
}
