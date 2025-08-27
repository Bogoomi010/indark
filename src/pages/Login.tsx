import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useI18n } from "../i18n/i18n";
import { Globe } from "lucide-react";

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const spotlightRef = useRef<HTMLDivElement | null>(null);
  const { t, locale, setLocale } = useI18n();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  // (언어 드롭다운을 사용하므로 보조 헬퍼는 제거)

  // ===== Reset view to initial signin state =====
  function resetToInitial() {
    setMode("signin");
    setEmail("");
    setPassword("");
    setNickname("");
    setPasswordConfirm("");
    setError(null);
    setLoading(false);
  }

  // ===== Torch spotlight builder =====
  function buildSpotlightCSS(x: number, y: number) {
    // 중심부는 따뜻한 빛, 바깥으로 갈수록 어두워지게 구성
    // 투명도 계단을 줘서 부드러운 감쇠를 만듭니다
    return `radial-gradient(600px at ${x}px ${y}px,
      rgba(255, 180, 80, 0.35) 0%,
      rgba(255, 140, 60, 0.18) 12%,
      rgba(0, 0, 0, 0.0) 28%,
      rgba(0, 0, 0, 0.65) 46%,
      rgba(0, 0, 0, 0.85) 68%,
      rgba(0, 0, 0, 0.9) 100%)`;
  }

  // ===== Torch spotlight: window mousemove drives a secondary overlay =====
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!spotlightRef.current) return;
      const x = e.clientX;
      const y = e.clientY;
      spotlightRef.current.style.background = buildSpotlightCSS(x, y);
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  // ===== Local mouse handler (cursor 위치를 CSS 변수로 넘겨 spotlight 이동) =====
  function handleMouse(e: React.MouseEvent) {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    el.style.setProperty("--mx", `${x}px`);
    el.style.setProperty("--my", `${y}px`);
  }

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
    <div
      ref={rootRef}
      onMouseMove={handleMouse}
      className="min-h-screen relative flex items-center justify-center text-white"
    >
      {/* 헤더: 좌측 브랜드, 우측 언어 전환 */}
      <header className="absolute top-0 left-0 right-0 z-30 bg-black/30 backdrop-blur-sm">
        <div className="w-full flex items-center justify-between px-6 py-4">
          <button
            type="button"
            onClick={resetToInitial}
            className="font-heading text-heading-xxl md:text-[2rem] lg:text-[2.5rem] tracking-wide"
          >
            In dark
          </button>
          <div className="relative ml-4">
            <details className="group">
              <summary className="list-none cursor-pointer rounded-2xl bg-zinc-800 hover:bg-zinc-700 px-2 py-1 text-xs inline-flex items-center gap-1">
                <Globe className="w-4 h-4" /> {locale.toUpperCase()}
              </summary>
              <div className="absolute right-0 mt-2 w-28 rounded-md border border-zinc-800 bg-zinc-900 shadow-lg text-xs">
                <button onClick={() => setLocale("en")} className="w-full text-left px-3 py-2 hover:bg-zinc-800">EN - English</button>
                <button onClick={() => setLocale("ko")} className="w-full text-left px-3 py-2 hover:bg-zinc-800">KO - 한국어</button>
                <button onClick={() => setLocale("de")} className="w-full text-left px-3 py-2 hover:bg-zinc-800">DE - Deutsch</button>
              </div>
            </details>
          </div>
        </div>
      </header>
      {/* 배경 이미지 레이어 */}
      <div
        className="absolute inset-0 z-0 bg-black"
        style={{
          backgroundImage: "url('/img_loginbackground.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* 스포트라이트 오버레이 (기본 위치는 뷰포트 중앙) */}
      <div
        ref={spotlightRef}
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          // CSS 변수 기반 예비 값. window mousemove가 들어오기 전의 초기 시야
          background:
            "radial-gradient(600px at var(--mx, 50vw) var(--my, 50vh), rgba(255, 180, 80, 0.30) 0%, rgba(255, 140, 60, 0.16) 12%, rgba(0, 0, 0, 0.0) 28%, rgba(0, 0, 0, 0.65) 46%, rgba(0, 0, 0, 0.85) 68%, rgba(0, 0, 0, 0.9) 100%)",
        }}
      />
      <main className="relative z-20 w-full max-w-md p-6">
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
            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode("signup")}
                disabled={loading}
                className="w-full rounded-lg border border-white/10 bg-black/60 px-4 py-2 text-sm text-gray-100 hover:border-amber-400/40 disabled:opacity-50"
              >
                {t("login.tab.signup")}
              </button>
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

