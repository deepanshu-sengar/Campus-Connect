# Campus Connect

Campus Connect is a React + Vite student campus platform backed by Firebase Authentication, Cloud Firestore and Cloudinary.

## Updated role-based access

- There is no public self-registration form.
- Google login has been removed from the application.
- The administrator creates student and faculty accounts and gives each user their email/password.
- Users have one of three roles: `student`, `faculty`, `admin`.
- Students can view/download academic resources but cannot upload notes.
- Faculty and admins can upload academic notes.
- Only admins can create new user accounts from the Admin page.
- Only admins can modify the seeded communities/events collections.

> Important: the first admin must be created in Firebase Authentication and then assigned `role: "admin"` in `users/{uid}` in Firestore. After that, the admin can create student/faculty accounts from `/admin`.

## Lost & Found images

- Lost & Found reports support an optional image.
- Images must be actual image files and must be **less than 1 MB**.
- Images are uploaded to Cloudinary under `lostFound/{uid}`.
- Firestore stores the Cloudinary URL, public ID, filename and size along with the Lost & Found report.
- The report card displays the uploaded image when available.

## Activity Feed

The live Activity Feed now contains only:

- Lost & Found reports and resolutions.
- New academic notes uploaded by faculty/admin.

Community joins, event registrations and chat messages no longer create activity-feed entries.

## Tech stack

- React 18
- Vite
- React Router
- Firebase Authentication
- Cloud Firestore
- Cloudinary
- Lucide React
- Recharts

## Run locally

```bash
npm install
npm run dev
```

Create `.env.local` from `.env.example` and add your Firebase and Cloudinary configuration.

## Environment variables

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset
```

Configure the Cloudinary upload preset to allow image uploads for Lost & Found and raw/document uploads for academic resources. The frontend also validates the Lost & Found image size before upload.

## First admin setup

1. Create the first administrator manually in Firebase Authentication.
2. Copy that user's UID.
3. In Firestore, create/open `users/{uid}`.
4. Set:

```json
{
  "role": "admin"
}
```

5. Sign in through `/login`.
6. Open `/admin` and create student/faculty accounts.
7. Give the generated email/password to the intended user.
8. Use **Seed Communities & Events** once if the database is empty.

The application never exposes a public account-creation form.

## Firestore deployment

Deploy the updated rules and activity-feed index with:

```bash
firebase login
firebase use
firebase deploy --only firestore:rules,firestore:indexes
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
- `academicResources`

## Security model

Firestore rules enforce the role checks server-side:

- `academicResources` creation requires `faculty` or `admin`.
- `activities` can only be created for `Lost & Found` or `Academics`.
- Student users cannot change their own role.
- Only admins can create/update user documents for other users.
- Only admins can write `communities` and `events`.
- Lost & Found image metadata is limited to an image size below 1 MB.

## Test checklist

1. Login using an admin account.
2. Open `/admin` and create a student account.
3. Create a faculty account.
4. Verify the student can login but cannot see the note-upload form.
5. Verify the faculty can upload an academic note.
6. Verify the uploaded note appears in the Activity Feed.
7. Login as a student and report a Lost/Found item without an image.
8. Report another item with an image below 1 MB.
9. Verify the image appears on the Lost & Found card.
10. Try an image of 1 MB or larger and verify it is rejected.
11. Verify Lost & Found report/resolution activities appear in the Activity Feed.
12. Send a chat message, join a community and register for an event; verify these do not appear in the Activity Feed.
13. Verify students cannot upload academic notes through Firestore/API manipulation because the Firestore rules reject the write.

## Notes

Do not commit `.env.local`.
