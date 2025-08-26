import type { User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

export interface UserProfile {
  email: string | null;
  nickname: string;
  provider: string;
  createdAt: unknown;
  lastLogin: unknown;
  settings: {
    theme: string;
    language: string;
  };
}

export async function upsertUserProfile(user: User): Promise<void> {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);

  const base: Omit<UserProfile, 'createdAt' | 'lastLogin'> = {
    email: user.email,
    nickname: user.displayName || '새로운 모험가',
    provider: user.providerData[0]?.providerId ?? 'unknown',
    settings: {
      theme: 'dark',
      language: 'ko',
    },
  };

  if (snap.exists()) {
    await setDoc(
      ref,
      { ...base, lastLogin: serverTimestamp() },
      { merge: true }
    );
  } else {
    await setDoc(
      ref,
      { ...base, createdAt: serverTimestamp(), lastLogin: serverTimestamp() },
      { merge: true }
    );
  }
}


