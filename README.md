# Campus Connect

Campus Connect is a React + Vite student campus platform backed by Firebase Authentication and Cloud Firestore.

## Working features

- Email/password registration and login
- Google login
- Student profile with editable display name
- Protected profile route
- Communities loaded from Firestore with automatic demo-data seeding
- Join community with persistent membership
- Events loaded from Firestore with automatic demo-data seeding
- Persistent event registration
- Lost & Found reports stored in Firestore
- Real-time community chat
- Real-time activity feed
- Responsive campus navigation
- Firebase Hosting SPA configuration
- Firestore security rules

## Run locally

```bash
npm install
npm run dev
```

Create `.env.local` from `.env.example` and enter your Firebase Web App configuration.

## Firebase

The project is already configured for the Firebase project used by Campus Connect through `.firebaserc`.

To update Firestore rules only:

```bash
firebase login
firebase use
firebase deploy --only firestore:rules
```

This does not deploy the website.

To deploy the website later:

```bash
npm run build
firebase deploy --only hosting
```

## Main Firestore collections

- `users`
- `communities`
- `communityMembers`
- `events`
- `eventRegistrations`
- `lostFound`
- `messages`
- `activities`

## Test checklist

1. Register a new account.
2. Login/logout.
3. Open Profile and edit the name.
4. Join a community.
5. Refresh and verify the community remains joined.
6. Register for an event.
7. Refresh and verify the event remains registered.
8. Report a lost item.
9. Report a found item.
10. Open Chat and send a message.
11. Switch chat rooms and return.
12. Refresh Chat and verify the message remains.
13. Open Activity Feed and verify new activity appears.
14. Open each navigation route directly.

## Notes

The project keeps demo data as a safe fallback so the UI remains usable when a Firebase collection has not been populated yet. Once Firebase data exists, the Firestore data is used.

Do not commit `.env.local`.
