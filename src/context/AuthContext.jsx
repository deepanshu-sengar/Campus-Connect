import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';

const AuthContext = createContext(null);

async function saveUserProfile(user, extra = {}) {
  await setDoc(
    doc(db, 'users', user.uid),
    {
      uid: user.uid,
      name: user.displayName || extra.name || 'Student',
      email: user.email || '',
      photoURL: user.photoURL || '',
      updatedAt: serverTimestamp(),
      ...extra,
    },
    { merge: true }
  );
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          await saveUserProfile(currentUser);
        } catch (error) {
          console.error('Unable to sync user profile:', error);
        }
      }
      setLoading(false);
    });
  }, []);

  const register = async ({ name, email, password }) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
    await saveUserProfile(result.user, { name });
    return result.user;
  };

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    await saveUserProfile(result.user);
    return result.user;
  };

  const updateUserProfile = async name => {
    if (!auth.currentUser) throw new Error('You must be signed in.');
    const cleanName = name.trim();
    if (!cleanName) throw new Error('Name is required.');
    await updateProfile(auth.currentUser, { displayName: cleanName });
    await saveUserProfile(auth.currentUser, { name: cleanName });
    setUser({ ...auth.currentUser });
  };

  const logout = () => signOut(auth);

  const value = useMemo(
    () => ({ user, loading, register, login, loginWithGoogle, updateUserProfile, logout }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
