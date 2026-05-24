# Miso Hungry

A warm personal recipe tracking app for Sophie and me, built with Next.js, TypeScript, React, and Tailwind CSS.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Firebase setup

Create `.env.local` from `.env.example` and fill in the `NEXT_PUBLIC_FIREBASE_*`
values from your Firebase web app settings. Enable Email/Password auth, Google
auth, Cloud Firestore, and Firebase Storage in the Firebase console.

Firestore collections used by the app:

- `users/{userId}`: display name, email, and profile metadata for Aarav/Sophie.
- `recipes/{recipeId}`: recipe fields, ratings, category id/name, and cover image URL/path.
- `categories/{categoryId}`: default and custom cookbook shelves.
- `cookLogs/{cookLogId}`: one entry each time a signed-in user marks a recipe made.
- `groceryLists/{listId}`: persisted grocery items for recipe planning and shopping.
