import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useI18n } from "../i18n/i18n";

type LoginPayload =
  | { type: "password"; email: string; password: string }
  | { type: "signup"; email: string; nickname: string; password: string }
  | { type: "oauth"; provider: "google" | "github" }
  | { type: "oauth_nickname"; provider: "google" | "github"; nickname: string; email?: string };

export default function LoginPage() {
  const { signInWithPassword, signUpWithPassword, startGoogleOAuth, completeOauthNickname } = useAuth();
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { t, locale, setLocale } = useI18n();
  const spotlightRef = useRef<HTMLDivElement | null>(null);

  const [mode, setMode] = useState<"signin" | "signup" | "oauthNickname">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // common fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // signup fields
  const [nickname, setNickname] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  // oauth return
  const [oauthEmail, setOauthEmail] = useState<string>("");

  const subtitle = useMemo(
    () => (mode === "signin" ? t("login.title.signin") : mode === "signup" ? t("login.title.signup") : t("login.title.oauthNickname")),
    [mode, t]
  );

  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("oauth") === "google" && sp.get("ok") === "1")
      {
        const em = sp.get("email") || "";
        if (em) {
          setOauthEmail(em);
          setEmail(em);
        }
        setMode("oauthNickname");
      }
    } catch { /* noop */ }
  }, []);

  // 초기 스포트라이트 위치를 중앙으로 설정
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${rect.width / 2}px`);
    el.style.setProperty("--my", `${rect.height / 2}px`);
  }, []);

  async function onLogin(payload: LoginPayload) {
    try {
      setError(null);
      setLoading(true);
      switch (payload.type) {
        case "password":
          await signInWithPassword(payload.email, payload.password);
          navigate("/", { replace: true });
          break;
        case "signup":
          await signUpWithPassword(payload.email, payload.nickname, payload.password);
          navigate("/", { replace: true });
          break;
        case "oauth":
          if (payload.provider === "google") await startGoogleOAuth();
          break;
        case "oauth_nickname":
          await completeOauthNickname(payload.nickname, payload.email);
          navigate("/", { replace: true });
          break;
      }
    } catch (e: any) {
      setError(e?.message ?? "요청 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    await onLogin({ type: "password", email, password });
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return setError("이메일을 입력하세요");
    if (!nickname.trim()) return setError("닉네임을 입력하세요");
    if (password.length < 8) return setError("비밀번호는 8자 이상 권장");
    if (password !== passwordConfirm) return setError("비밀번호가 일치하지 않습니다");
    await onLogin({ type: "signup", email, nickname: nickname.trim(), password });
  }

  async function signInWithGoogle() {
    await onLogin({ type: "oauth", provider: "google" });
  }

  async function submitOauthNickname(e: React.FormEvent) {
    e.preventDefault();
    if (!nickname.trim()) return setError("닉네임을 입력하세요");
    await onLogin({ type: "oauth_nickname", provider: "google", nickname: nickname.trim(), email: email || oauthEmail });
  }

  // 커서 위치를 CSS 변수로 전달하여 스포트라이트를 이동
  function handleMouse(e: React.MouseEvent) {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    el.style.setProperty("--mx", `${x}px`);
    el.style.setProperty("--my", `${y}px`);
  }

  return (
    <div
      ref={rootRef}
      onMouseMove={handleMouse}
      className="relative min-h-screen w-full overflow-hidden bg-black text-gray-200 font-body"
      style={{
        backgroundImage: "url('/img_loginbackground.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Torch spotlight overlay */}
      <div
        ref={spotlightRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(600px 600px at var(--mx) var(--my), rgba(0,0,0,0) 0%, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.75) 80%, rgba(0,0,0,0.92) 100%)",
        }}
      />
      <div className="relative z-10 grid min-h-screen grid-rows-[auto_1fr_auto]">
        <header className="flex items-center justify-between p-6">
          <div className="text-2xl tracking-[0.4em] font-semibold text-gray-100 font-heading">IN DARK</div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <details className="group">
                <summary className="list-none cursor-pointer rounded-2xl bg-zinc-800 hover:bg-zinc-700 px-2 py-1 text-xs inline-flex items-center gap-1">
                  {locale.toUpperCase()}
                </summary>
                <div className="absolute right-0 mt-2 w-28 rounded-md border border-zinc-800 bg-zinc-900 shadow-lg text-xs">
                  <button onClick={() => setLocale("en")} className="w-full text-left px-3 py-2 hover:bg-zinc-800">EN - English</button>
                  <button onClick={() => setLocale("ko")} className="w-full text-left px-3 py-2 hover:bg-zinc-800">KO - 한국어</button>
                  <button onClick={() => setLocale("de")} className="w-full text-left px-3 py-2 hover:bg-zinc-800">DE - Deutsch</button>
                </div>
              </details>
            </div>
            <div className="text-xs text-gray-400">ALPHA BUILD</div>
          </div>
        </header>

        <main className="mx-auto flex w-full flex-1 items-center justify-center px-4">
          <div className="w-full max-w-[420px] rounded-2xl border border-white/10 bg-black/70 p-6 shadow-xl backdrop-blur">
            {(mode === "signin" || mode === "signup") && (
              <div className="mb-6 flex items-center justify-center gap-4">
                <button onClick={() => setMode("signin")} className={`text-sm ${mode === "signin" ? "text-amber-300" : "text-gray-400 hover:text-gray-200"}`}>{t("login.tab.signin")}</button>
                <span className="text-gray-600">/</span>
                <button onClick={() => setMode("signup")} className={`text-sm ${mode === "signup" ? "text-amber-300" : "text-gray-400 hover:text-gray-200"}`}>{t("login.tab.signup")}</button>
              </div>
            )}

            <h1 className="mb-2 text-2xl font-semibold text-gray-100 text-center">{subtitle}</h1>

            {mode === "oauthNickname" ? (
              <form onSubmit={submitOauthNickname} className="space-y-4">
                <p className="text-center text-sm text-gray-400">{t("login.oauth.done")}</p>
                <div>
                  <label htmlFor="nickname_oauth" className="mb-1 block text-sm text-gray-300">{t("login.nickname")}</label>
                  <input
                    id="nickname_oauth"
                    type="text"
                    required
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-gray-100 focus:border-amber-400/60"
                    placeholder="던전 탐험가"
                  />
                </div>
                {error && (<div role="alert" className="rounded-md border border-red-500/40 bg-red-900/20 px-3 py-2 text-sm text-red-200">{error}</div>)}
                <button type="submit" disabled={loading} className="w-full rounded-lg bg-amber-600 px-4 py-2 text-black hover:bg-amber-500 disabled:opacity-50">{t("login.signup")}</button>
              </form>
            ) : mode === "signin" ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label htmlFor="email" className="mb-1 block text-sm text-gray-300">{t("login.email")}</label>
                  <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-gray-100 focus:border-amber-400/60" placeholder="you@dark.example" />
                </div>
                <div>
                  <label htmlFor="password" className="mb-1 block text-sm text-gray-300">{t("login.password")}</label>
                  <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-gray-100 focus:border-amber-400/60" placeholder="••••••••" />
                </div>
                {error && (<div role="alert" className="rounded-md border border-red-500/40 bg-red-900/20 px-3 py-2 text-sm text-red-200">{error}</div>)}
                <button type="submit" disabled={loading} className="w-full rounded-lg bg-amber-600 px-4 py-2 text-black hover:bg-amber-500 disabled:opacity-50">{t("login.signin")}</button>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="h-px flex-1 bg-white/10" />
                  <span>{t("login.or")}</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <button type="button" onClick={signInWithGoogle} disabled={loading} className="w-full rounded-lg border border-white/10 bg-black/60 px-4 py-2 text-sm text-gray-100 hover:border-amber-400/40 disabled:opacity-50">{t("login.continueWithGoogle")}</button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label htmlFor="email_su" className="mb-1 block text-sm text-gray-300">{t("login.email")}</label>
                  <input id="email_su" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-gray-100 focus:border-amber-400/60" placeholder="you@dark.example" />
                </div>
                <div>
                  <label htmlFor="nickname_su" className="mb-1 block text-sm text-gray-300">{t("login.nickname")}</label>
                  <input id="nickname_su" type="text" required value={nickname} onChange={(e) => setNickname(e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-gray-100 focus:border-amber-400/60" placeholder="던전 탐험가" />
                </div>
                <div>
                  <label htmlFor="password_su" className="mb-1 block text-sm text-gray-300">{t("login.password")}</label>
                  <input id="password_su" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-gray-100 focus:border-amber-400/60" placeholder="••••••••" />
                </div>
                <div>
                  <label htmlFor="passwordConfirm_su" className="mb-1 block text-sm text-gray-300">{t("login.passwordConfirm")}</label>
                  <input id="passwordConfirm_su" type="password" required value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-gray-100 focus:border-amber-400/60" placeholder="••••••••" />
                </div>
                {password && passwordConfirm && password !== passwordConfirm && (
                  <div role="alert" className="rounded-md border border-red-500/40 bg-red-900/20 px-3 py-2 text-sm text-red-200">비밀번호가 일치하지 않습니다</div>
                )}
                {error && (<div role="alert" className="rounded-md border border-red-500/40 bg-red-900/20 px-3 py-2 text-sm text-red-200">{error}</div>)}
                <button type="submit" disabled={loading || password !== passwordConfirm} className="w-full rounded-lg bg-amber-600 px-4 py-2 text-black hover:bg-amber-500 disabled:opacity-50">{t("login.signup")}</button>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="h-px flex-1 bg-white/10" />
                  <span>{t("login.or")}</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <button type="button" onClick={signInWithGoogle} disabled={loading} className="w-full rounded-lg border border-white/10 bg-black/60 px-4 py-2 text-sm text-gray-100 hover:border-amber-400/40 disabled:opacity-50">{t("login.continueWithGoogle")}</button>
              </form>
            )}
          </div>
        </main>

        <footer className="flex items-center justify-between p-6 text-xs text-gray-500">
          <span>© {new Date().getFullYear()} IN DARK</span>
          <nav className="flex gap-4">
            <a className="hover:text-gray-300" href="#">{t("footer.terms")}</a>
            <a className="hover:text-gray-300" href="#">{t("footer.privacy")}</a>
            <a className="hover:text-gray-300" href="#">{t("footer.contact")}</a>
          </nav>
        </footer>
      </div>
    </div>
  );
}


