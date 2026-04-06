import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import type { WorkspaceData } from "../types";

type SettingsPageProps = {
  workspace: WorkspaceData;
  onUpdateProfile: (payload: Record<string, unknown>) => Promise<void>;
  onAddSubject: (payload: { name: string; color: string; goalMinutes: number }) => Promise<void>;
  onDeleteSubject: (subjectId: string) => Promise<void>;
  onResetWorkspace: () => Promise<void>;
};

export function SettingsPage({
  workspace,
  onUpdateProfile,
  onAddSubject,
  onDeleteSubject,
  onResetWorkspace
}: SettingsPageProps) {
  const [username, setUsername] = useState(workspace.profile.username);
  const [bio, setBio] = useState(workspace.profile.bio);
  const [studyGoalMinutes, setStudyGoalMinutes] = useState(workspace.profile.studyGoalMinutes);
  const [theme, setTheme] = useState<"light" | "dark" | "system">(workspace.profile.preferences.theme);
  const [pomodoroFocusMinutes, setPomodoroFocusMinutes] = useState(workspace.profile.preferences.pomodoroFocusMinutes);
  const [pomodoroBreakMinutes, setPomodoroBreakMinutes] = useState(workspace.profile.preferences.pomodoroBreakMinutes);
  const [subjectName, setSubjectName] = useState("");
  const [subjectColor, setSubjectColor] = useState("#14B8A6");
  const [subjectGoal, setSubjectGoal] = useState(90);

  useEffect(() => {
    setUsername(workspace.profile.username);
    setBio(workspace.profile.bio);
    setStudyGoalMinutes(workspace.profile.studyGoalMinutes);
    setTheme(workspace.profile.preferences.theme);
    setPomodoroFocusMinutes(workspace.profile.preferences.pomodoroFocusMinutes);
    setPomodoroBreakMinutes(workspace.profile.preferences.pomodoroBreakMinutes);
  }, [workspace.profile]);

  async function handleSaveProfile() {
    await onUpdateProfile({
      username,
      bio,
      studyGoalMinutes,
      preferences: {
        ...workspace.profile.preferences,
        theme,
        pomodoroFocusMinutes,
        pomodoroBreakMinutes
      }
    });
  }

  async function handleAddSubject() {
    if (!subjectName.trim()) {
      return;
    }

    await onAddSubject({
      name: subjectName.trim(),
      color: subjectColor,
      goalMinutes: subjectGoal
    });

    setSubjectName("");
    setSubjectGoal(90);
  }

  async function handleReset() {
    const confirmed = window.confirm("This will permanently clear your saved subjects, tasks, and sessions. Continue?");

    if (!confirmed) {
      return;
    }

    await onResetWorkspace();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
        <h3 className="text-xl font-semibold">Workspace settings</h3>
        <div className="mt-6 grid gap-4">
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Username"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950/50"
          />
          <textarea
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder="Bio"
            rows={4}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950/50"
          />
          <input
            type="number"
            value={studyGoalMinutes}
            onChange={(event) => setStudyGoalMinutes(Number(event.target.value))}
            placeholder="Daily goal minutes"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950/50"
          />
          <select
            value={theme}
            onChange={(event) => setTheme(event.target.value as "light" | "dark" | "system")}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950/50"
          >
            <option value="light">Light theme</option>
            <option value="dark">Dark theme</option>
            <option value="system">System / temporary toggle</option>
          </select>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/50">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              <p className="font-medium">Pomodoro cycle</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                type="number"
                value={pomodoroFocusMinutes}
                onChange={(event) => setPomodoroFocusMinutes(Number(event.target.value))}
                placeholder="Focus minutes"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-900"
              />
              <input
                type="number"
                value={pomodoroBreakMinutes}
                onChange={(event) => setPomodoroBreakMinutes(Number(event.target.value))}
                placeholder="Break minutes"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-900"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { focus: 25, break: 5 },
                { focus: 25, break: 10 },
                { focus: 50, break: 10 }
              ].map((preset) => (
                <button
                  key={`${preset.focus}-${preset.break}`}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900"
                  onClick={() => {
                    setPomodoroFocusMinutes(preset.focus);
                    setPomodoroBreakMinutes(preset.break);
                  }}
                >
                  {preset.focus}/{preset.break}
                </button>
              ))}
            </div>
          </div>
          <button className="rounded-2xl bg-slate-950 px-4 py-3 text-white" onClick={() => void handleSaveProfile()}>
            Save Profile
          </button>
        </div>
      </section>

      <div className="space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <h3 className="text-xl font-semibold">Subjects</h3>
          <div className="mt-5 grid gap-3">
            <input
              value={subjectName}
              onChange={(event) => setSubjectName(event.target.value)}
              placeholder="New subject name"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950/50"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="color"
                value={subjectColor}
                onChange={(event) => setSubjectColor(event.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white p-2 dark:border-white/10 dark:bg-slate-950/50"
              />
              <input
                type="number"
                value={subjectGoal}
                onChange={(event) => setSubjectGoal(Number(event.target.value))}
                placeholder="Goal minutes"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950/50"
              />
            </div>
            <button className="rounded-2xl bg-slate-950 px-4 py-3 text-white" onClick={() => void handleAddSubject()}>
              Add Subject
            </button>
          </div>

          <div className="mt-6 space-y-3">
            {workspace.subjects.map((subject) => (
              <div key={subject.id} className="flex items-center justify-between rounded-3xl bg-slate-100/70 p-4 dark:bg-slate-950/40">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: subject.color }} />
                  <div>
                    <p className="font-medium">{subject.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{subject.goalMinutes} min goal</p>
                  </div>
                </div>
                <button className="rounded-2xl bg-white px-3 py-2 text-sm dark:bg-slate-950" onClick={() => void onDeleteSubject(subject.id)}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 shadow-sm dark:border-rose-500/20 dark:bg-rose-950/20">
          <h3 className="text-xl font-semibold text-rose-900 dark:text-rose-100">Reset data</h3>
          <p className="mt-2 text-sm text-rose-700 dark:text-rose-200">
            Clear all stored tasks, subjects, sessions, and derived analytics from the database.
          </p>
          <button
            className="mt-5 rounded-2xl bg-rose-600 px-4 py-3 text-white"
            onClick={() => void handleReset()}
          >
            Clear All Data
          </button>
        </section>
      </div>
    </div>
  );
}
