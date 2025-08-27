/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signOut as fbSignOut, updateProfile as fbUpdateProfile } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { upsertUserProfile } from '../data/userProfile';
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
  // 데이터 계층으로 위임
  await upsertUserProfile(u);
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
    // 프로필 업데이트(예: displayName 설정)가 provider 내부에서 수행될 수 있으므로
    // 로그인 직후 갱신된 사용자 정보를 기반으로 프로필을 다시 upsert합니다.
    if (auth.currentUser) {
      await upsertUser(auth.currentUser);
    }
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
