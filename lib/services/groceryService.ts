"use client";

import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseServices } from "@/lib/firebase/client";
import { firebaseCollections } from "@/lib/firebase/collections";
import type { GroceryItem, GroceryList, UserProfile } from "@/lib/firebase/schema";
import { removeUndefinedDeep } from "@/lib/services/helpers";

function groceryListIdForUser(userId: string) {
  return userId;
}

export async function fetchGroceryList(user: UserProfile) {
  const { db } = getFirebaseServices();
  const groceryListId = groceryListIdForUser(user.id);
  const snapshot = await getDoc(doc(db, firebaseCollections.groceryLists, groceryListId));

  if (!snapshot.exists()) {
    return {
      id: groceryListId,
      userId: user.id,
      displayName: user.displayName,
      items: [],
    } satisfies GroceryList;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as GroceryList;
}

export async function saveGroceryItems({
  items,
  user,
}: {
  items: GroceryItem[];
  user: UserProfile;
}) {
  const { db } = getFirebaseServices();
  const groceryListId = groceryListIdForUser(user.id);
  const groceryListRef = doc(db, firebaseCollections.groceryLists, groceryListId);
  const existingSnapshot = await getDoc(groceryListRef);
  const groceryList: GroceryList = {
    id: groceryListId,
    userId: user.id,
    displayName: user.displayName,
    items,
  };

  await setDoc(
    groceryListRef,
    removeUndefinedDeep({
      ...groceryList,
      createdAt: existingSnapshot.exists()
        ? existingSnapshot.data().createdAt ?? serverTimestamp()
        : serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );

  return groceryList;
}
