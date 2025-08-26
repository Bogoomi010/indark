# Authentication & Firebase Guide

## Environment Variables
Create a `.env` file with the following keys:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Adding a Provider
Providers live in `src/auth/providers`. Implement `IAuthProvider` and register it in `providers/index.ts`:

```ts
export class MyProvider implements IAuthProvider {
  async signIn(options?: any) {
    // ...
  }
}

authProviders.my = new MyProvider();
```

## Data Model
Firestore document: `users/{uid}`

- `uid`, `email`, `emailVerified`
- `displayName`, `photoURL`
- `providerId`
- `createdAt`, `lastLoginAt` (server timestamps)
- `roles` (array, default `["user"]`)
- `profile` object for app specific fields

## Security Rules
See `firestore.rules` for a minimal rule set that restricts read/write to the owner UID.

## Common Pitfalls
- Ensure env vars are set before running `yarn dev`.
- Do not store ID tokens manually; Firebase Auth persists the session.
- Handle `auth/account-exists-with-different-credential` errors to guide users to the correct provider.

