import { Pause, Play, RefreshCw, Square, TimerReset } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatDuration, formatMode } from "../../lib/utils";
import type { Profile, Session, Subject } from "../../types";

type TimerPanelProps = {
  profile: Profile;
  subjects: Subject[];
  sessions: Session[];
  activeSession: Session | null;
  onStartSession: (payload: { subjectId?: string; mode: "standard" | "pomodoro" | "focus" }) => Promise<void>;
  onPauseSession: (sessionId: string, isPaused: boolean) => Promise<void>;
  onStopSession: (sessionId: string) => Promise<void>;
};

function formatLiveClock(activeSession: Session | null, now: number) {
  if (!activeSession) {
    return "00:00:00";
  }

  const elapsedSeconds = activeSession.isPaused
    ? activeSession.durationSeconds || 0
    : Math.max(
        activeSession.durationSeconds || 0,
        (activeSession.durationSeconds || 0) +
          Math.floor((now - new Date(activeSession.startedAt).getTime()) / 1000)
      );
  const hours = String(Math.floor(elapsedSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(elapsedSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function getElapsedSeconds(activeSession: Session | null, now: number) {
  if (!activeSession) {
    return 0;
  }

  if (activeSession.isPaused) {
    return activeSession.durationSeconds || 0;
  }

  return Math.max(
    activeSession.durationSeconds || 0,
    (activeSession.durationSeconds || 0) + Math.floor((now - new Date(activeSession.startedAt).getTime()) / 1000)
  );
}

export function TimerPanel({
  profile,
  subjects,
  sessions,
  activeSession,
  onStartSession,
  onPauseSession,
  onStopSession
}: TimerPanelProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || "");
  const [mode, setMode] = useState<"standard" | "pomodoro" | "focus">("focus");
  const [now, setNow] = useState(Date.now());
  const isPomodoroEnabled = (activeSession?.mode || mode) === "pomodoro";
  const elapsedSeconds = getElapsedSeconds(activeSession, now);

  useEffect(() => {
    setSelectedSubjectId((current) => current || subjects[0]?.id || "");
  }, [subjects]);

  useEffect(() => {
    if (!activeSession || activeSession.isPaused) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [activeSession]);

  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.id === selectedSubjectId),
    [subjects, selectedSubjectId]
  );
  const targetMinutes = isPomodoroEnabled ? profile.preferences.pomodoroFocusMinutes : 60;
  const targetSeconds = Math.max(1, targetMinutes * 60);
  const progress = Math.min(1, elapsedSeconds / targetSeconds);
  const circumference = 2 * Math.PI * 120;
  const strokeOffset = circumference - progress * circumference;

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 text-slate-900 shadow-sm sm:p-8 dark:border-white/10 dark:bg-slate-900 dark:text-white">
      <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.12),_transparent_50%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(241,245,249,0.9))] p-6 dark:border-white/10 dark:bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.14),_transparent_45%),linear-gradient(180deg,_rgba(15,23,42,0.98),_rgba(15,23,42,0.84))]">
          <div className="flex flex-col items-center text-center">
            <div className="relative flex h-[320px] w-[320px] items-center justify-center">
              <svg viewBox="0 0 280 280" className="absolute inset-0 h-full w-full -rotate-90">
                <circle cx="140" cy="140" r="120" fill="transparent" stroke="rgba(148,163,184,0.18)" strokeWidth="16" />
                <circle
                  cx="140"
                  cy="140"
                  r="120"
                  fill="transparent"
                  stroke="url(#timerGradient)"
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                />
                <defs>
                  <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#14B8A6" />
                    <stop offset="100%" stopColor="#0F766E" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="relative z-10 flex h-[240px] w-[240px] flex-col items-center justify-center rounded-full border border-white/60 bg-white/75 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
                <p className="text-xs uppercase tracking-[0.34em] text-slate-400">
                  {isPomodoroEnabled ? "Pomodoro cycle" : "Deep focus"}
                </p>
                <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                  {formatLiveClock(activeSession, now)}
                </h2>
                <p className="mt-3 max-w-[180px] text-sm text-slate-500 dark:text-slate-400">
                  {selectedSubject?.name || activeSession?.subject?.name || "General Focus"} · {formatMode(activeSession?.mode || mode)}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Target orbit {targetMinutes} min
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              Pomodoro cycle: {profile.preferences.pomodoroFocusMinutes}/{profile.preferences.pomodoroBreakMinutes}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button
            className="rounded-2xl bg-slate-950 px-4 py-3 font-medium text-white dark:bg-white dark:text-slate-950"
            onClick={() => void onStartSession({ subjectId: selectedSubjectId || undefined, mode })}
          >
            <Play className="mx-auto mb-2 h-4 w-4" />
            Start
          </button>
          <button
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium dark:border-white/10 dark:bg-white/5"
            disabled={!activeSession}
            onClick={() => activeSession && void onPauseSession(activeSession.id, !activeSession.isPaused)}
          >
            <Pause className="mx-auto mb-2 h-4 w-4" />
            {activeSession?.isPaused ? "Resume" : "Pause"}
          </button>
          <button
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium dark:border-white/10 dark:bg-white/5"
            disabled={!activeSession}
            onClick={() => activeSession && void onStopSession(activeSession.id)}
          >
            <Square className="mx-auto mb-2 h-4 w-4" />
            Stop
          </button>
          <button
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium dark:border-white/10 dark:bg-white/5"
            onClick={() => setMode((currentMode) => (currentMode === "pomodoro" ? "focus" : "pomodoro"))}
          >
            <RefreshCw className="mx-auto mb-2 h-4 w-4" />
            {isPomodoroEnabled ? "Pomodoro On" : "Pomodoro Off"}
          </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-sm text-slate-500 dark:text-slate-400">Current streak</p>
              <p className="mt-2 text-2xl font-semibold">{profile.streak} days</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-sm text-slate-500 dark:text-slate-400">Goal pace</p>
              <p className="mt-2 text-2xl font-semibold">{profile.studyGoalMinutes} min</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-sm text-slate-500 dark:text-slate-400">Elapsed</p>
              <p className="mt-2 text-2xl font-semibold">{formatDuration(elapsedSeconds)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-[28px] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/50">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium">Subjects</h3>
          <TimerReset className="h-4 w-4 text-slate-400" />
        </div>
        <div className="space-y-3">
          {subjects.map((subject) => (
            <div key={subject.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: subject.color }} />
                  <div>
                    <p className="font-medium">{subject.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{subject.studiedMinutes || 0} min tracked</p>
                  </div>
                </div>
                <button
                  className="rounded-xl bg-slate-100 px-3 py-2 text-sm dark:bg-white/10"
                  onClick={() => setSelectedSubjectId(subject.id)}
                >
                  {selectedSubjectId === subject.id ? "Selected" : "Select"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-[28px] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/50">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium">Recent sessions</h3>
          <TimerReset className="h-4 w-4 text-slate-400" />
        </div>
        <div className="grid gap-3 xl:grid-cols-3">
          {sessions.map((session) => (
            <div key={session.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900/60">
              <p className="font-medium">{session.subject?.name || "General Focus"}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {formatDuration(session.durationSeconds)} · {formatMode(session.mode)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
