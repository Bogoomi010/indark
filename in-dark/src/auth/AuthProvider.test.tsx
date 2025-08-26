import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_a: unknown, cb: (u: unknown) => void) => { cb(null); return () => {}; },
  signOut: vi.fn(),
  updateProfile: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({ exists: () => false }),
  setDoc: vi.fn(),
  serverTimestamp: () => ({})
}));

vi.mock('../firebase/firebaseConfig', () => ({
  auth: {},
  db: {},
}));

vi.mock('./providers', () => ({
  authProviders: { mock: { signIn: vi.fn().mockResolvedValue({}) } },
}));

import { AuthProvider, useAuth } from './AuthProvider';

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthProvider', () => {
  it('calls provider signIn', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.signIn('mock');
    });
    const providers = (await import('./providers')).authProviders as Record<string, { signIn: (...args: unknown[]) => unknown }>;
    expect(providers.mock.signIn).toHaveBeenCalled();
  });
});
