import { getApp, getApps, initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, firebaseConfig } from '../lib/firebase';

const ADMIN_APP_NAME = 'campus-connect-admin-creator';

const getAdminAuth = () => {
  const adminApp = getApps().find(app => app.name === ADMIN_APP_NAME)
    || initializeApp(firebaseConfig, ADMIN_APP_NAME);
  return getAuth(adminApp);
};

export const createManagedUser = async ({ name, email, password, role }) => {
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanName || !cleanEmail || !password) {
    throw new Error('Name, email and password are required.');
  }

  if (!['student', 'faculty'].includes(role)) {
    throw new Error('Invalid user role.');
  }

  const secondaryAuth = getAdminAuth();
  const result = await createUserWithEmailAndPassword(
    secondaryAuth,
    cleanEmail,
    password
  );

  try {
    await setDoc(doc(db, 'users', result.user.uid), {
      uid: result.user.uid,
      name: cleanName,
      email: cleanEmail,
      photoURL: '',
      role,
      createdByAdmin: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    await result.user.delete().catch(() => {});
    throw error;
  } finally {
    await signOut(secondaryAuth).catch(() => {});
  }

  return result.user;
};
