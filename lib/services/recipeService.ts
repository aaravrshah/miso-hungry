"use client";

import {
  addDoc,
  collection,
  deleteField,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { getFirebaseServices } from "@/lib/firebase/client";
import { firebaseCollections } from "@/lib/firebase/collections";
import type {
  CookedBy,
  CookLog,
  CookLogInput,
  FirestoreCategory,
  FirestoreRecipe,
  UserProfile,
} from "@/lib/firebase/schema";
import {
  normalizeRatingToFive,
  type RecipeUserRating,
  uncategorizedCategoryName,
  type Category,
  type Recipe,
} from "@/lib/recipes";
import { removeUndefinedDeep, slugify, todayString } from "@/lib/services/helpers";

type CookLogMutationResult = {
  cookLog?: CookLog;
  cookLogs: CookLog[];
  recipe: Recipe;
};

type CategoryInput = {
  coverImageFile?: File;
  coverImageUrl?: string;
  description: string;
  name: string;
};

function categoryFromDoc(categoryId: string, data: Partial<Category>) {
  return {
    accent: "bg-stone-100 text-stone-800 ring-stone-200",
    description: "",
    ...data,
    id: categoryId,
    name: data.name ?? "Untitled Category",
    slug: data.slug ?? categoryId,
  } as FirestoreCategory;
}

function sortCategories(categories: Category[]) {
  return [...categories].sort((first, second) => {
    const firstOrder = first.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const secondOrder = second.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const orderSort = firstOrder - secondOrder;

    if (orderSort !== 0) {
      return orderSort;
    }

    return first.name.localeCompare(second.name);
  });
}

export async function fetchCategories() {
  const { db } = getFirebaseServices();
  const snapshot = await getDocs(collection(db, firebaseCollections.categories));

  return sortCategories(
    snapshot.docs.map((categoryDoc) =>
      categoryFromDoc(categoryDoc.id, categoryDoc.data() as Partial<Category>),
    ),
  );
}

async function uploadCategoryCoverImage({
  file,
  categoryId,
  user,
}: {
  file: File;
  categoryId: string;
  user: UserProfile;
}) {
  const { storage } = getFirebaseServices();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const imagePath = `category-images/${categoryId}/${Date.now()}-${safeName}`;
  const storageRef = ref(storage, imagePath);
  await uploadBytes(storageRef, file, { contentType: file.type });

  return {
    coverImagePath: imagePath,
    coverImageUrl: await getDownloadURL(storageRef),
    uploadedBy: user.id,
  };
}

export async function createCategory({
  coverImageFile,
  coverImageUrl,
  description,
  name,
  user,
}: CategoryInput & {
  user: UserProfile;
}) {
  const { db } = getFirebaseServices();
  const baseSlug = slugify(name) || "category";
  const categoryRef = doc(db, firebaseCollections.categories, baseSlug);
  const existing = await getDoc(categoryRef);
  const finalRef = existing.exists()
    ? doc(db, firebaseCollections.categories, `${baseSlug}-${Date.now().toString(36)}`)
    : categoryRef;
  const currentCategoriesSnapshot = await getDocs(collection(db, firebaseCollections.categories));
  const uploadedImage = coverImageFile
    ? await uploadCategoryCoverImage({ categoryId: finalRef.id, file: coverImageFile, user })
    : undefined;
  const trimmedCoverImageUrl = coverImageUrl?.trim();
  const category: Category = {
    id: finalRef.id,
    name,
    slug: finalRef.id,
    description,
    accent: "bg-stone-100 text-stone-800 ring-stone-200",
    coverImagePath: uploadedImage?.coverImagePath,
    coverImageUrl: uploadedImage?.coverImageUrl ?? (trimmedCoverImageUrl || undefined),
    isDefault: false,
    sortOrder: currentCategoriesSnapshot.size,
    createdBy: user.id,
    createdByDisplayName: user.displayName,
    updatedBy: user.id,
    updatedByDisplayName: user.displayName,
  };

  await setDoc(
    finalRef,
    removeUndefinedDeep({
      ...category,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );

  return category;
}

export async function updateCategory({
  categoryId,
  coverImageFile,
  coverImageUrl,
  description,
  name,
  sortOrder,
  user,
}: {
  categoryId: string;
  coverImageFile?: File;
  coverImageUrl?: string;
  description: string;
  name: string;
  sortOrder?: number;
  user: UserProfile;
}) {
  const { db, storage } = getFirebaseServices();
  const categoryRef = doc(db, firebaseCollections.categories, categoryId);
  const snapshot = await getDoc(categoryRef);
  const existingCategory = snapshot.exists()
    ? categoryFromDoc(snapshot.id, snapshot.data() as Partial<Category>)
    : undefined;
  const uploadedImage = coverImageFile
    ? await uploadCategoryCoverImage({ categoryId, file: coverImageFile, user })
    : undefined;
  const trimmedCoverImageUrl = coverImageUrl?.trim();
  const updates: Record<string, unknown> = {
    name,
    description,
    updatedBy: user.id,
    updatedByDisplayName: user.displayName,
    updatedAt: serverTimestamp(),
  };

  if (typeof sortOrder === "number" || typeof existingCategory?.sortOrder === "number") {
    updates.sortOrder = sortOrder ?? existingCategory?.sortOrder;
  }

  if (uploadedImage) {
    updates.coverImagePath = uploadedImage.coverImagePath;
    updates.coverImageUrl = uploadedImage.coverImageUrl;
  } else if (coverImageUrl !== undefined) {
    updates.coverImagePath = deleteField();
    updates.coverImageUrl = trimmedCoverImageUrl || deleteField();
  }

  await updateDoc(categoryRef, updates);

  if ((uploadedImage || coverImageUrl !== undefined) && existingCategory?.coverImagePath) {
    await deleteObject(ref(storage, existingCategory.coverImagePath)).catch(() => undefined);
  }

  await updateRecipesForCategoryRename({
    categoryId,
    nextName: name,
    previousName: existingCategory?.name,
    user,
  });

  return {
    ...(existingCategory ?? {
      accent: "bg-stone-100 text-stone-800 ring-stone-200",
      id: categoryId,
      slug: categoryId,
    }),
    name,
    description,
    coverImagePath: uploadedImage
      ? uploadedImage.coverImagePath
      : coverImageUrl !== undefined
        ? undefined
        : existingCategory?.coverImagePath,
    coverImageUrl: uploadedImage
      ? uploadedImage.coverImageUrl
      : coverImageUrl !== undefined
        ? trimmedCoverImageUrl || undefined
        : existingCategory?.coverImageUrl,
    sortOrder: sortOrder ?? existingCategory?.sortOrder,
    updatedBy: user.id,
    updatedByDisplayName: user.displayName,
  };
}

export async function reorderCategories({
  categoryIds,
  user,
}: {
  categoryIds: string[];
  user: UserProfile;
}) {
  const { db } = getFirebaseServices();

  await Promise.all(
    categoryIds.map((categoryId, sortOrder) =>
      updateDoc(doc(db, firebaseCollections.categories, categoryId), {
        sortOrder,
        updatedAt: serverTimestamp(),
        updatedBy: user.id,
        updatedByDisplayName: user.displayName,
      }),
    ),
  );
}

async function updateRecipesForCategoryRename({
  categoryId,
  nextName,
  previousName,
  user,
}: {
  categoryId: string;
  nextName: string;
  previousName?: string;
  user: UserProfile;
}) {
  const { db } = getFirebaseServices();
  const recipesSnapshot = await getDocs(collection(db, firebaseCollections.recipes));

  await Promise.all(
    recipesSnapshot.docs.map(async (recipeDoc) => {
      const recipe = recipeFromDoc(recipeDoc.id, recipeDoc.data() as Partial<Recipe>);
      const categoryIds = recipe.categoryIds?.length
        ? recipe.categoryIds
        : recipe.categoryId
          ? [recipe.categoryId]
          : [];
      const categories = recipe.categories?.length
        ? recipe.categories
        : recipe.category
          ? [recipe.category]
          : [];
      const usesCategory =
        categoryIds.includes(categoryId) ||
        recipe.categoryId === categoryId ||
        Boolean(previousName && categories.includes(previousName));

      if (!usesCategory) {
        return;
      }

      const nextCategories = categories.map((categoryName, index) =>
        categoryIds[index] === categoryId || categoryName === previousName
          ? nextName
          : categoryName,
      );

      await updateDoc(doc(db, firebaseCollections.recipes, recipeDoc.id), {
        categories: nextCategories,
        category: nextCategories[0] ?? uncategorizedCategoryName,
        updatedAt: serverTimestamp(),
        updatedBy: user.id,
        updatedByDisplayName: user.displayName,
      });
    }),
  );
}

export async function deleteCategory({
  categoryId,
  user,
}: {
  categoryId: string;
  user: UserProfile;
}) {
  const { db, storage } = getFirebaseServices();
  const categoryRef = doc(db, firebaseCollections.categories, categoryId);
  const categorySnapshot = await getDoc(categoryRef);
  const category = categorySnapshot.exists()
    ? categoryFromDoc(categorySnapshot.id, categorySnapshot.data() as Partial<Category>)
    : undefined;
  const recipesSnapshot = await getDocs(collection(db, firebaseCollections.recipes));
  const categoryName = category?.name;

  await Promise.all(
    recipesSnapshot.docs.map(async (recipeDoc) => {
      const recipe = recipeFromDoc(recipeDoc.id, recipeDoc.data() as Partial<Recipe>);
      const nextCategoryIds = (recipe.categoryIds ?? [recipe.categoryId]).filter(
        (id) => id && id !== categoryId,
      );
      const nextCategories = (recipe.categories ?? [recipe.category]).filter(
        (name) => name && name !== categoryName,
      );
      const usedCategory =
        recipe.categoryId === categoryId ||
        recipe.category === categoryName ||
        (recipe.categoryIds ?? []).includes(categoryId) ||
        Boolean(categoryName && (recipe.categories ?? []).includes(categoryName));

      if (!usedCategory) {
        return;
      }

      await updateDoc(doc(db, firebaseCollections.recipes, recipeDoc.id), {
        categories: nextCategories,
        category: nextCategories[0] ?? uncategorizedCategoryName,
        categoryId: nextCategoryIds[0] ?? "",
        categoryIds: nextCategoryIds,
        updatedAt: serverTimestamp(),
        updatedBy: user.id,
        updatedByDisplayName: user.displayName,
      });
    }),
  );

  await deleteDoc(categoryRef);

  if (category?.coverImagePath) {
    await deleteObject(ref(storage, category.coverImagePath)).catch(() => undefined);
  }
}

function recipeFromDoc(recipeId: string, data: Partial<Recipe>) {
  const categoryIds = data.categoryIds?.length
    ? data.categoryIds.filter(Boolean)
    : data.categoryId
      ? [data.categoryId]
      : [];
  const categories = data.categories?.length
    ? data.categories.filter(Boolean)
    : data.category
      ? [data.category]
      : [];

  return {
    id: recipeId,
    ...data,
    category: data.category ?? categories[0] ?? uncategorizedCategoryName,
    categoryId: data.categoryId ?? categoryIds[0] ?? "",
    categories,
    categoryIds,
    collaboratorIds: data.collaboratorIds?.filter(Boolean) ?? [],
    collaborators: data.collaborators ?? [],
    timesMade: data.timesMade ?? 0,
  } as FirestoreRecipe;
}

function normalizeRecipeForSave(recipe: Recipe) {
  const categoryIds = Array.from(
    new Set((recipe.categoryIds?.length ? recipe.categoryIds : [recipe.categoryId]).filter(Boolean)),
  );
  const categories = Array.from(
    new Set((recipe.categories?.length ? recipe.categories : [recipe.category]).filter(Boolean)),
  );

  return {
    ...recipe,
    category: categories[0] ?? uncategorizedCategoryName,
    categoryId: categoryIds[0] ?? "",
    categories,
    categoryIds,
    collaboratorIds: recipe.collaboratorIds?.filter(Boolean) ?? [],
    collaborators: recipe.collaborators ?? [],
  };
}

export async function fetchRecipes() {
  const { db } = getFirebaseServices();
  const snapshot = await getDocs(
    query(collection(db, firebaseCollections.recipes), orderBy("title", "asc")),
  );

  return snapshot.docs.map((recipeDoc) => recipeFromDoc(recipeDoc.id, recipeDoc.data()));
}

async function uploadRecipeCoverImage({
  file,
  recipeId,
  user,
}: {
  file: File;
  recipeId: string;
  user: UserProfile;
}) {
  const { storage } = getFirebaseServices();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const imagePath = `recipe-images/${recipeId}/${Date.now()}-${safeName}`;
  const storageRef = ref(storage, imagePath);
  await uploadBytes(storageRef, file, { contentType: file.type });

  return {
    coverImagePath: imagePath,
    coverImageUrl: await getDownloadURL(storageRef),
    uploadedBy: user.id,
  };
}

export async function createRecipe({
  coverImageFile,
  recipe,
  user,
}: {
  coverImageFile?: File;
  recipe: Recipe;
  user: UserProfile;
}) {
  const { db } = getFirebaseServices();
  const recipeRef = doc(collection(db, firebaseCollections.recipes));
  const uploadedImage = coverImageFile
    ? await uploadRecipeCoverImage({ file: coverImageFile, recipeId: recipeRef.id, user })
    : undefined;
  const savedRecipe: Recipe = {
    ...normalizeRecipeForSave(recipe),
    ...uploadedImage,
    id: recipeRef.id,
    collaboratorIds: recipe.collaboratorIds?.filter(Boolean) ?? [],
    collaborators: recipe.collaborators ?? [],
    createdBy: user.id,
    createdByDisplayName: user.displayName,
    updatedBy: user.id,
    updatedByDisplayName: user.displayName,
  };

  await setDoc(
    recipeRef,
    removeUndefinedDeep({
      ...savedRecipe,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );

  return savedRecipe;
}

export async function updateRecipe({
  coverImageFile,
  recipe,
  recipeId,
  user,
}: {
  coverImageFile?: File;
  recipe: Recipe;
  recipeId: string;
  user: UserProfile;
}) {
  const uploadedImage = coverImageFile
    ? await uploadRecipeCoverImage({ file: coverImageFile, recipeId, user })
    : undefined;
  const { db } = getFirebaseServices();
  const savedRecipe: Recipe = {
    ...normalizeRecipeForSave(recipe),
    ...uploadedImage,
    id: recipeId,
    updatedBy: user.id,
    updatedByDisplayName: user.displayName,
  };

  await updateDoc(
    doc(db, firebaseCollections.recipes, recipeId),
    removeUndefinedDeep({
      ...savedRecipe,
      updatedAt: serverTimestamp(),
    }),
  );

  return savedRecipe;
}

export async function deleteRecipe(recipeId: string) {
  const { db, storage } = getFirebaseServices();
  const recipeRef = doc(db, firebaseCollections.recipes, recipeId);
  const snapshot = await getDoc(recipeRef);
  const recipe = snapshot.exists() ? (snapshot.data() as Recipe) : undefined;

  await deleteDoc(recipeRef);

  if (recipe?.coverImagePath) {
    await deleteObject(ref(storage, recipe.coverImagePath)).catch(() => undefined);
  }
}

function sortCookLogs(cookLogs: CookLog[]) {
  return [...cookLogs].sort((first, second) => {
    const dateSort = second.dateMade.localeCompare(first.dateMade);
    return dateSort || second.id.localeCompare(first.id);
  });
}

function normalizeCookedBy(value?: string): CookedBy {
  if (value?.trim()) {
    return value;
  }

  return "Both";
}

function normalizeRating(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return undefined;
  }

  return normalizeRatingToFive(value);
}

function cleanCookLogInput(input: CookLogInput): CookLogInput {
  return {
    dateMade: input.dateMade || todayString(),
    cookedBy: input.cookedBy,
    occasion: input.occasion?.trim() || undefined,
    rating: normalizeRating(input.rating),
    aaravRating: normalizeRating(input.aaravRating),
    sophieRating: normalizeRating(input.sophieRating),
    notes: input.notes?.trim() || undefined,
    changesNextTime: input.changesNextTime?.trim() || undefined,
    imageUrl: input.imageUrl?.trim() || undefined,
    taggedUserIds: input.taggedUserIds?.filter(Boolean) ?? [],
    taggedUsers: input.taggedUsers ?? [],
  };
}

function cookLogFromDoc(logId: string, data: Partial<CookLog> & {
  cookedAt?: string;
  displayName?: string;
}) {
  return {
    id: logId,
    ...data,
    recipeId: data.recipeId ?? "",
    dateMade: data.dateMade ?? data.cookedAt ?? todayString(),
    cookedBy: normalizeCookedBy(data.cookedBy ?? data.displayName),
  } as CookLog;
}

function collectCookLogRatings(cookLogs: CookLog[]) {
  const ratings: number[] = [];
  const latestByUser = new Map<string, RecipeUserRating>();

  for (const cookLog of cookLogs) {
    const explicitRating = normalizeRating(cookLog.rating);

    if (typeof explicitRating === "number") {
      ratings.push(explicitRating);

      if (cookLog.ratedByUserId && !latestByUser.has(cookLog.ratedByUserId)) {
        latestByUser.set(cookLog.ratedByUserId, {
          id: cookLog.ratedByUserId,
          displayName: cookLog.ratedByDisplayName ?? "Cook",
          rating: explicitRating,
          dateMade: cookLog.dateMade,
        });
      }
    }

    const aaravRating = normalizeRating(cookLog.aaravRating);
    const sophieRating = normalizeRating(cookLog.sophieRating);

    if (typeof aaravRating === "number") {
      ratings.push(aaravRating);
    }

    if (typeof sophieRating === "number") {
      ratings.push(sophieRating);
    }
  }

  const ratingTotal = ratings.reduce((total, rating) => total + rating, 0);

  return {
    averageUserRating: ratings.length ? ratingTotal / ratings.length : undefined,
    latestUserRatings: Array.from(latestByUser.values()).slice(0, 6),
    ratingCount: ratings.length,
    ratingTotal,
  };
}

export async function fetchCookLogs(recipeId: string) {
  const { db } = getFirebaseServices();
  const snapshot = await getDocs(
    query(collection(db, firebaseCollections.cookLogs), where("recipeId", "==", recipeId)),
  );

  return sortCookLogs(
    snapshot.docs.map((cookLogDoc) => cookLogFromDoc(cookLogDoc.id, cookLogDoc.data())),
  );
}

async function syncRecipeCookSummary({
  clearMissingRatings,
  recipeId,
  user,
}: {
  clearMissingRatings: boolean;
  recipeId: string;
  user: UserProfile;
}) {
  const { db } = getFirebaseServices();
  const recipeRef = doc(db, firebaseCollections.recipes, recipeId);
  const recipeSnapshot = await getDoc(recipeRef);

  if (!recipeSnapshot.exists()) {
    throw new Error("Recipe not found.");
  }

  const recipe = {
    id: recipeSnapshot.id,
    ...recipeSnapshot.data(),
  } as Recipe;
  const cookLogs = await fetchCookLogs(recipeId);
  const lastMadeDate = cookLogs[0]?.dateMade;
  const latestAaravRating = cookLogs.find(
    (cookLog) => typeof cookLog.aaravRating === "number",
  )?.aaravRating;
  const latestSophieRating = cookLogs.find(
    (cookLog) => typeof cookLog.sophieRating === "number",
  )?.sophieRating;
  const ratingSummary = collectCookLogRatings(cookLogs);
  const updatePayload: Record<string, unknown> = {
    averageUserRating: ratingSummary.averageUserRating ?? deleteField(),
    lastMadeDate: lastMadeDate ?? deleteField(),
    latestUserRatings: ratingSummary.latestUserRatings,
    ratingCount: ratingSummary.ratingCount,
    ratingTotal: ratingSummary.ratingTotal,
    timesMade: cookLogs.length,
    updatedAt: serverTimestamp(),
    updatedBy: user.id,
    updatedByDisplayName: user.displayName,
  };
  const recipePatch: Partial<Recipe> = {
    lastMadeDate,
    averageUserRating: ratingSummary.averageUserRating,
    latestUserRatings: ratingSummary.latestUserRatings,
    ratingCount: ratingSummary.ratingCount,
    ratingTotal: ratingSummary.ratingTotal,
    timesMade: cookLogs.length,
    updatedBy: user.id,
    updatedByDisplayName: user.displayName,
  };

  if (typeof latestAaravRating === "number") {
    updatePayload.aaravRating = latestAaravRating;
    recipePatch.aaravRating = latestAaravRating;
  } else if (clearMissingRatings) {
    updatePayload.aaravRating = deleteField();
    recipePatch.aaravRating = undefined;
  }

  if (typeof latestSophieRating === "number") {
    updatePayload.sophieRating = latestSophieRating;
    recipePatch.sophieRating = latestSophieRating;
  } else if (clearMissingRatings) {
    updatePayload.sophieRating = deleteField();
    recipePatch.sophieRating = undefined;
  }

  await updateDoc(recipeRef, updatePayload);

  return {
    cookLogs,
    recipe: {
      ...recipe,
      ...recipePatch,
    },
  };
}

export async function createCookLog({
  input,
  recipe,
  user,
}: {
  input: CookLogInput;
  recipe: Recipe;
  user: UserProfile;
}): Promise<CookLogMutationResult> {
  const { db } = getFirebaseServices();
  const cleanedInput = cleanCookLogInput(input);
  const cookLog: Omit<CookLog, "id"> = {
    recipeId: recipe.id,
    ...cleanedInput,
    ratedByDisplayName:
      typeof cleanedInput.rating === "number" ? String(user.displayName) : undefined,
    ratedByUserId: typeof cleanedInput.rating === "number" ? user.id : undefined,
    createdBy: user.id,
    createdByDisplayName: user.displayName,
    updatedBy: user.id,
    updatedByDisplayName: user.displayName,
  };

  const logRef = await addDoc(
    collection(db, firebaseCollections.cookLogs),
    removeUndefinedDeep({
      ...cookLog,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );

  const synced = await syncRecipeCookSummary({
    clearMissingRatings: false,
    recipeId: recipe.id,
    user,
  });
  const savedCookLog = {
    id: logRef.id,
    ...cookLog,
  };

  return {
    cookLog: savedCookLog,
    cookLogs: sortCookLogs([savedCookLog, ...synced.cookLogs.filter((log) => log.id !== logRef.id)]),
    recipe: synced.recipe,
  };
}

export async function updateCookLog({
  cookLogId,
  input,
  recipeId,
  user,
}: {
  cookLogId: string;
  input: CookLogInput;
  recipeId: string;
  user: UserProfile;
}): Promise<CookLogMutationResult> {
  const { db } = getFirebaseServices();
  const cookLogRef = doc(db, firebaseCollections.cookLogs, cookLogId);
  const existingSnapshot = await getDoc(cookLogRef);
  const existingCookLog = existingSnapshot.exists()
    ? cookLogFromDoc(existingSnapshot.id, existingSnapshot.data())
    : undefined;
  const cleanedInput = cleanCookLogInput(input);

  await updateDoc(cookLogRef, {
    dateMade: cleanedInput.dateMade,
    cookedBy: cleanedInput.cookedBy,
    occasion: cleanedInput.occasion ?? deleteField(),
    rating: cleanedInput.rating ?? deleteField(),
    ratedByDisplayName:
      cleanedInput.rating !== undefined ? String(user.displayName) : deleteField(),
    ratedByUserId: cleanedInput.rating !== undefined ? user.id : deleteField(),
    aaravRating: cleanedInput.aaravRating ?? deleteField(),
    sophieRating: cleanedInput.sophieRating ?? deleteField(),
    notes: cleanedInput.notes ?? deleteField(),
    changesNextTime: cleanedInput.changesNextTime ?? deleteField(),
    imageUrl: cleanedInput.imageUrl ?? deleteField(),
    taggedUserIds: cleanedInput.taggedUserIds ?? [],
    taggedUsers: cleanedInput.taggedUsers ?? [],
    updatedAt: serverTimestamp(),
    updatedBy: user.id,
    updatedByDisplayName: user.displayName,
  });

  const synced = await syncRecipeCookSummary({
    clearMissingRatings:
      typeof existingCookLog?.aaravRating === "number" ||
      typeof existingCookLog?.sophieRating === "number" ||
      typeof cleanedInput.aaravRating === "number" ||
      typeof cleanedInput.sophieRating === "number",
    recipeId,
    user,
  });
  const savedCookLog = synced.cookLogs.find((cookLog) => cookLog.id === cookLogId);

  return {
    cookLog: savedCookLog,
    cookLogs: synced.cookLogs,
    recipe: synced.recipe,
  };
}

export async function deleteCookLog({
  cookLogId,
  recipeId,
  user,
}: {
  cookLogId: string;
  recipeId: string;
  user: UserProfile;
}): Promise<CookLogMutationResult> {
  const { db } = getFirebaseServices();
  const cookLogRef = doc(db, firebaseCollections.cookLogs, cookLogId);
  const existingSnapshot = await getDoc(cookLogRef);
  const existingCookLog = existingSnapshot.exists()
    ? cookLogFromDoc(existingSnapshot.id, existingSnapshot.data())
    : undefined;

  await deleteDoc(cookLogRef);

  const synced = await syncRecipeCookSummary({
    clearMissingRatings:
      typeof existingCookLog?.aaravRating === "number" ||
      typeof existingCookLog?.sophieRating === "number",
    recipeId,
    user,
  });

  return {
    cookLogs: synced.cookLogs,
    recipe: synced.recipe,
  };
}
