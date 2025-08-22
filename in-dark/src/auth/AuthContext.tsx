import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type AuthenticatedUser = {
  id: string;
  email: string;
  nickname: string;
};

type AuthContextValue = {
  user: AuthenticatedUser | null;
  initializing: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, nickname: string, password: string) => Promise<void>;
  startGoogleOAuth: () => Promise<void>;
  completeOauthNickname: (nickname: string, emailHint?: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USERS_KEY = "auth_users";
const SESSION_KEY = "auth_user";

type StoredUser = {
  id: string;
  email: string;
  password: string;
  nickname: string;
  provider: "password" | "google";
};

function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function uuid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) setUser(JSON.parse(raw) as AuthenticatedUser);
    } finally {
      setInitializing(false);
    }
  }, []);

  const persistSession = useCallback((u: AuthenticatedUser) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const users = readUsers();
    const found = users.find((u) => u.email === email && u.password === password && u.provider === "password");
    if (!found) throw new Error("이메일 또는 비밀번호가 올바르지 않습니다");
    persistSession({ id: found.id, email: found.email, nickname: found.nickname });
  }, [persistSession]);

  const signUpWithPassword = useCallback(async (email: string, nickname: string, password: string) => {
    const users = readUsers();
    if (users.some((u) => u.email === email)) throw new Error("이미 가입된 이메일입니다");
    const created: StoredUser = { id: uuid(), email, password, nickname, provider: "password" };
    writeUsers([...users, created]);
    persistSession({ id: created.id, email: created.email, nickname: created.nickname });
  }, [persistSession]);

  const startGoogleOAuth = useCallback(async () => {
    // 프로토타입: 실제 리다이렉트 대신 쿼리 파라미터를 세팅해 복귀를 시뮬레이트
    const randomEmail = `adventurer_${Math.random().toString(36).slice(2, 6)}@example.com`;
    const url = new URL(window.location.href);
    url.pathname = "/login";
    url.searchParams.set("oauth", "google");
    url.searchParams.set("ok", "1");
    url.searchParams.set("email", randomEmail);
    window.location.replace(url.toString());
  }, []);

  const completeOauthNickname = useCallback(async (nickname: string, emailHint?: string) => {
    const users = readUsers();
    const email = emailHint && emailHint.trim() ? emailHint : `adventurer_${uuid()}@example.com`;
    const existing = users.find((u) => u.email === email && u.provider === "google");
    const record: StoredUser = existing ?? { id: uuid(), email, password: "", nickname, provider: "google" };
    record.nickname = nickname;
    if (!existing) writeUsers([...users, record]); else writeUsers(users.map((u) => (u.id === record.id ? record : u)));
    persistSession({ id: record.id, email: record.email, nickname: record.nickname });
  }, [persistSession]);

  const signOut = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    initializing,
    signInWithPassword,
    signUpWithPassword,
    startGoogleOAuth,
    completeOauthNickname,
    signOut,
  }), [user, initializing, signInWithPassword, signUpWithPassword, startGoogleOAuth, completeOauthNickname, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthContext가 초기화되지 않았습니다");
  return ctx;
}


