import { BookOpen, KeyRound, MoonStar, SunMedium, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type AuthPageProps = {
  onLogin: (payload: { email: string; password: string }) => Promise<void>;
  onRegister: (payload: { username: string; email: string; password: string }) => Promise<void>;
  onForgotPassword: (payload: { email: string }) => Promise<string>;
  onConfirmForgotPassword: (payload: { email: string; token: string; newPassword: string }) => Promise<string>;
  error?: string | null;
  loading?: boolean;
};

export function AuthPage({
  onLogin,
  onRegister,
  onForgotPassword,
  onConfirmForgotPassword,
  error,
  loading = false
}: AuthPageProps) {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    return window.localStorage.getItem("studyflow_theme") === "dark" ? "dark" : "light";
  });
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const tokenFromUrl = searchParams.get("resetToken") || "";
  const emailFromUrl = searchParams.get("email") || "";
  const [mode, setMode] = useState<"login" | "register" | "forgot" | "reset">(tokenFromUrl ? "reset" : "login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState(emailFromUrl);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [localMessage, setLocalMessage] = useState("");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem("studyflow_theme", theme);
  }, [theme]);

  async function handleSubmit() {
    if (mode === "login") {
      await onLogin({ email, password });
      return;
    }

    if (mode === "forgot") {
      const message = await onForgotPassword({ email });
      setLocalMessage(message);
      return;
    }

    if (mode === "reset") {
      if (password !== passwordConfirmation) {
        setLocalMessage("Passwords do not match.");
        return;
      }

      const message = await onConfirmForgotPassword({ email, token: tokenFromUrl, newPassword: password });
      setLocalMessage(message);
      setMode("login");
      setPassword("");
      setPasswordConfirmation("");
      window.history.replaceState({}, "", "/");
      return;
    }

    await onRegister({ username, email, password });
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.92),_rgba(246,244,237,0.95)_34%,_rgba(226,232,240,0.9)_72%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-6 py-10 text-slate-900 dark:bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.12),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(251,191,36,0.08),_transparent_18%),linear-gradient(180deg,_#08111f_0%,_#111827_48%,_#172033_100%)] dark:text-slate-50">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[40px] border border-white/50 bg-white/82 p-8 shadow-[0_26px_80px_rgba(148,163,184,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/72 dark:shadow-[0_24px_80px_rgba(2,6,23,0.48)] lg:p-10">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.34em] text-teal-600 dark:text-teal-300/80">DisciplineX</p>
            <button
              className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
              onClick={() => setTheme((value) => (value === "light" ? "dark" : "light"))}
              aria-label="Toggle theme"
            >
              {theme === "light" ? <MoonStar className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
            </button>
          </div>
          <h1 className="mt-4 text-4xl font-semibold leading-tight lg:text-5xl">
            Study with structure, now with your own account.
          </h1>
          <p className="mt-4 max-w-xl text-base text-slate-600 dark:text-slate-300">
            Sign in to keep your analytics, calendar plans, and study sessions tied to your personal workspace.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-slate-200/80 bg-white/75 p-5 dark:border-white/10 dark:bg-white/5">
              <BookOpen className="h-5 w-5 text-teal-600 dark:text-teal-300" />
              <p className="mt-4 font-medium">Saved dashboards</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Keep your calendar, streaks, and tracked focus in one account.</p>
            </div>
            <div className="rounded-3xl border border-slate-200/80 bg-white/75 p-5 dark:border-white/10 dark:bg-white/5">
              <UserRound className="h-5 w-5 text-teal-600 dark:text-teal-300" />
              <p className="mt-4 font-medium">Personal profile</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Your workspace stays separate from everyone else using the app.</p>
            </div>
            <div className="rounded-3xl border border-slate-200/80 bg-white/75 p-5 dark:border-white/10 dark:bg-white/5">
              <KeyRound className="h-5 w-5 text-teal-600 dark:text-teal-300" />
              <p className="mt-4 font-medium">JWT session</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">A secure token keeps your study data available across refreshes.</p>
            </div>
          </div>
        </section>

        <section className="rounded-[40px] border border-white/50 bg-white/86 p-8 shadow-[0_26px_80px_rgba(148,163,184,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/78 dark:shadow-[0_24px_80px_rgba(2,6,23,0.48)] lg:p-10">
          <div className="flex rounded-2xl bg-slate-100 p-1 dark:bg-white/5">
            {(["login", "register"] as const).map((entryMode) => (
              <button
                key={entryMode}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  mode === entryMode ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950" : "text-slate-500 dark:text-slate-300"
                }`}
                onClick={() => setMode(entryMode)}
              >
                {entryMode === "login" ? "Login" : "Create account"}
              </button>
            ))}
          </div>

          <div className="mt-8 space-y-4">
            {mode === "register" ? (
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Username"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950/50"
              />
            ) : null}
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              type="email"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950/50"
            />
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={mode === "forgot" ? "Password not needed here" : mode === "reset" ? "New password" : "Password"}
              type="password"
              disabled={mode === "forgot"}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950/50"
            />
            {mode === "reset" ? (
              <input
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
                placeholder="Confirm new password"
                type="password"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950/50"
              />
            ) : null}
            <button
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-white dark:bg-white dark:text-slate-950"
              disabled={loading}
              onClick={() => void handleSubmit()}
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                  ? "Login to DisciplineX"
                  : mode === "register"
                    ? "Create your account"
                    : mode === "forgot"
                      ? "Send reset email"
                      : "Reset password"}
            </button>
            {mode === "login" ? (
              <button
                className="text-sm text-slate-500 underline-offset-4 hover:underline dark:text-slate-400"
                onClick={() => {
                  setMode("forgot");
                  setLocalMessage("");
                }}
              >
                Forgot password?
              </button>
            ) : null}
            {mode !== "login" ? (
              <button
                className="text-sm text-slate-500 underline-offset-4 hover:underline dark:text-slate-400"
                onClick={() => {
                  setMode("login");
                  setLocalMessage("");
                  window.history.replaceState({}, "", "/");
                }}
              >
                Back to login
              </button>
            ) : null}
            {localMessage ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200">
                {localMessage}
              </div>
            ) : null}
            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-950/20 dark:text-rose-200">
                {error}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
