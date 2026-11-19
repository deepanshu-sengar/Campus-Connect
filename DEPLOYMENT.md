# Campus Connect Firebase Setup

## Local setup

```bash
npm install
npm run dev
```

Create `.env.local` in the project root:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Get these values from Firebase Console → Project settings → Your apps → Web app.

## Authentication

In Firebase Console → Authentication → Sign-in method:

- Enable Email/Password.
- Enable Google if Google login is required.

## Firestore

Use the existing `(default)` Firestore database.

The project contains `firestore.rules`.

From the project root:

```bash
npm install -g firebase-tools
firebase login
firebase use
```

If no active project is configured:

```bash
firebase use --add
```

Choose the Campus Connect Firebase project.

Deploy only the Firestore rules:

```bash
firebase deploy --only firestore:rules
```

This updates Firestore security rules only. It does not publish the website.

## Local feature test

```bash
npm run dev
```

Test:

- Register
- Login
- Google login
- Profile update
- Join community
- Refresh and verify membership
- Event registration
- Refresh and verify registration
- Lost report
- Found report
- Chat message
- Chat room switching
- Chat persistence after refresh
- Activity feed
- Direct navigation to every route

## Website deployment when you are ready

Build:

```bash
npm run build
```

Deploy hosting only:

```bash
firebase deploy --only hosting
```

Deploy all configured Firebase services:

```bash
firebase deploy
```

## Firestore collections

- `users`
- `communities`
- `communityMembers`
- `events`
- `eventRegistrations`
- `lostFound`
- `messages`
- `activities`
