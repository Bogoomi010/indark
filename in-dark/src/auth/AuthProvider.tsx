/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signOut as fbSignOut, updateProfile as fbUpdateProfile } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';
import { authProviders } from './providers';
import type { AuthProviderKey } from './providers';

export interface AppUser extends Pick<User, 'uid' | 'email' | 'displayName' | 'photoURL' | 'emailVerified'> {
  providerId: string;
  roles: string[];
  profile: Record<string, unknown>;
  createdAt?: unknown;
  lastLoginAt?: unknown;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (provider: AuthProviderKey, options?: unknown) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: { displayName?: string; photoURL?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function upsertUser(u: User) {
  const ref = doc(db, 'users', u.uid);
  const snap = await getDoc(ref);
  const base: AppUser = {
    uid: u.uid,
    email: u.email,
    emailVerified: u.emailVerified,
    displayName: u.displayName,
    photoURL: u.photoURL,
    providerId: u.providerData[0]?.providerId ?? 'unknown',
    roles: ['user'],
    profile: {},
  };
  if (snap.exists()) {
    await setDoc(ref, { ...base, lastLoginAt: serverTimestamp() }, { merge: true });
  } else {
    await setDoc(ref, { ...base, createdAt: serverTimestamp(), lastLoginAt: serverTimestamp() });
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) await upsertUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signIn = async (provider: AuthProviderKey, options?: unknown) => {
    const impl = authProviders[provider];
    if (!impl) throw new Error(`지원되지 않는 로그인 방식입니다: ${provider}`);
    await impl.signIn(options);
  };

  const signOut = async () => {
    await fbSignOut(auth);
  };

  const updateProfile = async (data: { displayName?: string; photoURL?: string }) => {
    if (!auth.currentUser) throw new Error('로그인되지 않았습니다');
    await fbUpdateProfile(auth.currentUser, data);
    await upsertUser(auth.currentUser);
    setUser({ ...auth.currentUser });
  };

  const value: AuthContextValue = { user, loading, signIn, signOut, updateProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthProvider가 초기화되지 않았습니다');
  return ctx;
}
