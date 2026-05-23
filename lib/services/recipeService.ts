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
  writeBatch,
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
  defaultCategories,
  type Category,
  type Recipe,
} from "@/lib/recipes";
import { removeUndefinedDeep, slugify, todayString } from "@/lib/services/helpers";

type CookLogMutationResult = {
  cookLog?: CookLog;
  cookLogs: CookLog[];
  recipe: Recipe;
};

export async function ensureDefaultCategories() {
  const { db } = getFirebaseServices();
  const categoriesRef = collection(db, firebaseCollections.categories);
  const snapshot = await getDocs(categoriesRef);

  if (!snapshot.empty) {
    return;
  }

  const batch = writeBatch(db);

  defaultCategories.forEach((category) => {
    batch.set(doc(db, firebaseCollections.categories, category.id), {
      ...category,
      isDefault: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
}

export async function fetchCategories() {
  const { db } = getFirebaseServices();
  await ensureDefaultCategories();
  const snapshot = await getDocs(
    query(collection(db, firebaseCollections.categories), orderBy("name", "asc")),
  );

  return snapshot.docs.map(
    (categoryDoc) =>
      ({
        id: categoryDoc.id,
        ...categoryDoc.data(),
      }) as FirestoreCategory,
  );
}

export async function createCategory({
  description,
  name,
  user,
}: {
  description: string;
  name: string;
  user: UserProfile;
}) {
  const { db } = getFirebaseServices();
  const baseSlug = slugify(name) || "category";
  const categoryRef = doc(db, firebaseCollections.categories, baseSlug);
  const existing = await getDoc(categoryRef);
  const finalRef = existing.exists()
    ? doc(db, firebaseCollections.categories, `${baseSlug}-${Date.now().toString(36)}`)
    : categoryRef;
  const category: Category = {
    id: finalRef.id,
    name,
    slug: finalRef.id,
    description,
    accent: "bg-stone-100 text-stone-800 ring-stone-200",
    isDefault: false,
    createdBy: user.id,
    createdByDisplayName: user.displayName,
  };

  await setDoc(finalRef, {
    ...category,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return category;
}

export async function updateCategory({
  categoryId,
  description,
  name,
  user,
}: {
  categoryId: string;
  description: string;
  name: string;
  user: UserProfile;
}) {
  const { db } = getFirebaseServices();
  const categoryRef = doc(db, firebaseCollections.categories, categoryId);
  const snapshot = await getDoc(categoryRef);
  const existingCategory = snapshot.exists()
    ? ({
        id: snapshot.id,
        ...snapshot.data(),
      } as Category)
    : undefined;
  const updates = {
    name,
    description,
    updatedBy: user.id,
    updatedByDisplayName: user.displayName,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(categoryRef, updates);

  return {
    ...(existingCategory ?? {
      accent: "bg-stone-100 text-stone-800 ring-stone-200",
      id: categoryId,
      slug: categoryId,
    }),
    name,
    description,
  };
}

export async function fetchRecipes() {
  const { db } = getFirebaseServices();
  const snapshot = await getDocs(
    query(collection(db, firebaseCollections.recipes), orderBy("title", "asc")),
  );

  return snapshot.docs.map(
    (recipeDoc) =>
      ({
        id: recipeDoc.id,
        ...recipeDoc.data(),
      }) as FirestoreRecipe,
  );
}

export async function fetchRecipesByCategory(categoryId: string) {
  const { db } = getFirebaseServices();
  const snapshot = await getDocs(
    query(collection(db, firebaseCollections.recipes), where("categoryId", "==", categoryId)),
  );

  return snapshot.docs.map(
    (recipeDoc) =>
      ({
        id: recipeDoc.id,
        ...recipeDoc.data(),
      }) as FirestoreRecipe,
  );
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
    ...recipe,
    ...uploadedImage,
    id: recipeRef.id,
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
    ...recipe,
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
  if (value === "Sophie" || value === "Both") {
    return value;
  }

  return "Aarav";
}

function normalizeRating(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return undefined;
  }

  return Math.min(10, Math.max(1, value));
}

function cleanCookLogInput(input: CookLogInput): CookLogInput {
  return {
    dateMade: input.dateMade || todayString(),
    cookedBy: input.cookedBy,
    occasion: input.occasion?.trim() || undefined,
    aaravRating: normalizeRating(input.aaravRating),
    sophieRating: normalizeRating(input.sophieRating),
    notes: input.notes?.trim() || undefined,
    changesNextTime: input.changesNextTime?.trim() || undefined,
    imageUrl: input.imageUrl?.trim() || undefined,
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
  const updatePayload: Record<string, unknown> = {
    lastMadeDate: lastMadeDate ?? deleteField(),
    timesMade: cookLogs.length,
    updatedAt: serverTimestamp(),
    updatedBy: user.id,
    updatedByDisplayName: user.displayName,
  };
  const recipePatch: Partial<Recipe> = {
    lastMadeDate,
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
    aaravRating: cleanedInput.aaravRating ?? deleteField(),
    sophieRating: cleanedInput.sophieRating ?? deleteField(),
    notes: cleanedInput.notes ?? deleteField(),
    changesNextTime: cleanedInput.changesNextTime ?? deleteField(),
    imageUrl: cleanedInput.imageUrl ?? deleteField(),
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
