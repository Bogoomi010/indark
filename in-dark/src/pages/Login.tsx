import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useI18n } from "../i18n/i18n";

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { t } = useI18n();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const subtitle = useMemo(
    () => (mode === "signin" ? t("login.title.signin") : t("login.title.signup")),
    [mode, t]
  );

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    try {
      setError(null);
      setLoading(true);
      await signIn("password", { email, password });
      navigate("/", { replace: true });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (password !== passwordConfirm) return setError("비밀번호가 일치하지 않습니다");
    try {
      setError(null);
      setLoading(true);
      await signIn("password", { email, password, nickname, create: true });
      navigate("/", { replace: true });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    try {
      setError(null);
      setLoading(true);
      await signIn("google");
      navigate("/", { replace: true });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={rootRef} className="min-h-screen flex items-center justify-center bg-black text-white">
      <main className="w-full max-w-md p-6">
        <h1 className="mb-2 text-2xl font-semibold text-gray-100 text-center">{subtitle}</h1>
        {mode === "signin" ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm text-gray-300">
                {t("login.email")}
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-gray-100 focus:border-amber-400/60"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm text-gray-300">
                {t("login.password")}
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-gray-100 focus:border-amber-400/60"
              />
            </div>
            {error && (
              <div role="alert" className="rounded-md border border-red-500/40 bg-red-900/20 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-amber-600 px-4 py-2 text-black hover:bg-amber-500 disabled:opacity-50"
            >
              {t("login.signin")}
            </button>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="h-px flex-1 bg-white/10" />
              <span>{t("login.or")}</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="w-full rounded-lg border border-white/10 bg-black/60 px-4 py-2 text-sm text-gray-100 hover:border-amber-400/40 disabled:opacity-50"
            >
              {t("login.continueWithGoogle")}
            </button>
            <div className="text-center text-sm text-gray-400">
              <button type="button" onClick={() => setMode("signup")}>{t("login.goSignup")}</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label htmlFor="email_su" className="mb-1 block text-sm text-gray-300">
                {t("login.email")}
              </label>
              <input
                id="email_su"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-gray-100 focus:border-amber-400/60"
              />
            </div>
            <div>
              <label htmlFor="nickname_su" className="mb-1 block text-sm text-gray-300">
                {t("login.nickname")}
              </label>
              <input
                id="nickname_su"
                type="text"
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-gray-100 focus:border-amber-400/60"
              />
            </div>
            <div>
              <label htmlFor="password_su" className="mb-1 block text-sm text-gray-300">
                {t("login.password")}
              </label>
              <input
                id="password_su"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-gray-100 focus:border-amber-400/60"
              />
            </div>
            <div>
              <label htmlFor="passwordConfirm_su" className="mb-1 block text-sm text-gray-300">
                {t("login.passwordConfirm")}
              </label>
              <input
                id="passwordConfirm_su"
                type="password"
                required
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-gray-100 focus:border-amber-400/60"
              />
            </div>
            {password && passwordConfirm && password !== passwordConfirm && (
              <div role="alert" className="rounded-md border border-red-500/40 bg-red-900/20 px-3 py-2 text-sm text-red-200">
                비밀번호가 일치하지 않습니다
              </div>
            )}
            {error && (
              <div role="alert" className="rounded-md border border-red-500/40 bg-red-900/20 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading || password !== passwordConfirm}
              className="w-full rounded-lg bg-amber-600 px-4 py-2 text-black hover:bg-amber-500 disabled:opacity-50"
            >
              {t("login.signup")}
            </button>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="h-px flex-1 bg-white/10" />
              <span>{t("login.or")}</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="w-full rounded-lg border border-white/10 bg-black/60 px-4 py-2 text-sm text-gray-100 hover:border-amber-400/40 disabled:opacity-50"
            >
              {t("login.continueWithGoogle")}
            </button>
            <div className="text-center text-sm text-gray-400">
              <button type="button" onClick={() => setMode("signin")}>{t("login.goSignin")}</button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

