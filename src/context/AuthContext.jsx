import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

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
  const [role, setRole] = useState('student');

  useEffect(() => {
    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const profileRef = doc(db, 'users', currentUser.uid);
          const profileSnapshot = await getDoc(profileRef);
          const profileRole = profileSnapshot.exists()
            ? profileSnapshot.data()?.role || 'student'
            : 'student';

          setRole(profileRole);
          await saveUserProfile(currentUser);
        } catch (error) {
          console.error('Unable to sync user profile:', error);
          setRole('student');
        }
      } else {
        setRole('student');
      }
      setLoading(false);
    });
  }, []);

  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const profileSnapshot = await getDoc(doc(db, 'users', result.user.uid));

    if (!profileSnapshot.exists()) {
      await signOut(auth);
      throw new Error('This account was not created by the Campus Connect administrator.');
    }

    return result;
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
    () => ({ user, role, loading, login, updateUserProfile, logout }),
    [user, role, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
