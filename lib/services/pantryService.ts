"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getFirebaseServices } from "@/lib/firebase/client";
import { firebaseCollections } from "@/lib/firebase/collections";
import type {
  PantryIngredient,
  PantryIngredientInput,
} from "@/lib/firebase/schema";
import {
  formatIngredientDisplayName as formatRecognizedIngredientName,
  normalizeIngredientNameForMatching,
} from "@/lib/ingredientRecognition";
import { removeUndefinedDeep, slugify } from "@/lib/services/helpers";

export function normalizeIngredientName(value: string) {
  return normalizeIngredientNameForMatching(value);
}

export function formatIngredientDisplayName(value: string) {
  return formatRecognizedIngredientName(value);
}

function pantryIngredientIdFromName(name: string) {
  return slugify(normalizeIngredientName(name)) || `ingredient-${Date.now().toString(36)}`;
}

function cleanList(value?: string[]) {
  return value?.map((item) => item.trim()).filter(Boolean);
}

function cleanPantryIngredientInput(input: PantryIngredientInput) {
  return {
    name: formatIngredientDisplayName(input.name),
    normalizedName: normalizeIngredientName(input.name),
    category: input.category,
    preferredBrand: input.preferredBrand?.trim() || undefined,
    preferredProductName: input.preferredProductName?.trim() || undefined,
    store: input.store?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    similarBrands: cleanList(input.similarBrands),
    tags: cleanList(input.tags),
  };
}

export async function fetchPantryIngredients() {
  const { db } = getFirebaseServices();
  const snapshot = await getDocs(
    query(collection(db, firebaseCollections.pantryIngredients), orderBy("normalizedName", "asc")),
  );

  return snapshot.docs.map(
    (ingredientDoc) =>
      ({
        id: ingredientDoc.id,
        ...ingredientDoc.data(),
      }) as PantryIngredient,
  );
}

export async function savePantryIngredient({
  ingredientId,
  input,
}: {
  ingredientId?: string;
  input: PantryIngredientInput;
}) {
  const { db } = getFirebaseServices();
  const cleanedInput = cleanPantryIngredientInput(input);

  if (!cleanedInput.name) {
    throw new Error("Ingredient name is required.");
  }

  const finalId = ingredientId || pantryIngredientIdFromName(cleanedInput.name);
  const ingredientRef = doc(db, firebaseCollections.pantryIngredients, finalId);
  const existingIngredient = await getDoc(ingredientRef);
  const ingredient: PantryIngredient = {
    id: finalId,
    ...cleanedInput,
  };

  await setDoc(
    ingredientRef,
    removeUndefinedDeep({
      ...ingredient,
      updatedAt: serverTimestamp(),
      createdAt: existingIngredient.exists()
        ? existingIngredient.data().createdAt ?? serverTimestamp()
        : serverTimestamp(),
    }),
  );

  return ingredient;
}
