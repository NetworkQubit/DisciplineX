import { AxiosError } from "axios";
import { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import {
  confirmForgotPassword,
  fetchCurrentUser,
  loginUser,
  registerUser,
  requestForgotPassword,
} from "../api/auth";
import { AppShell } from "../components/layout/AppShell";
import { useWorkspaceData } from "../hooks/useWorkspaceData";
import type { AuthUser } from "../types";

const AuthPage = lazy(() => import("../pages/AuthPage").then((module) => ({ default: module.AuthPage })));
const CalendarPage = lazy(() => import("../pages/CalendarPage").then((module) => ({ default: module.CalendarPage })));
const DashboardPage = lazy(() => import("../pages/DashboardPage").then((module) => ({ default: module.DashboardPage })));
const ReportsPage = lazy(() => import("../pages/ReportsPage").then((module) => ({ default: module.ReportsPage })));
const SettingsPage = lazy(() => import("../pages/SettingsPage").then((module) => ({ default: module.SettingsPage })));
const TasksPage = lazy(() => import("../pages/TasksPage").then((module) => ({ default: module.TasksPage })));
const TimerPage = lazy(() => import("../pages/TimerPage").then((module) => ({ default: module.TimerPage })));

export function AppRouter() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authSaving, setAuthSaving] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const {
    workspace,
    loading,
    saving,
    error,
    updateProfile,
    addSubject,
    deleteSubject,
    addTask,
    addCalendarBlock,
    deleteCalendarEvent,
    updateTask,
    reorderTaskList,
    startFocusSession,
    togglePauseSession,
    stopFocusSession,
    clearAllData,
    exportWorkspace,
    importWorkspace
  } = useWorkspaceData(Boolean(authUser));

  useEffect(() => {
    let mounted = true;

    async function bootstrapAuth() {
      const token = window.localStorage.getItem("studyflow_token");

      if (!token) {
        if (mounted) {
          setAuthLoading(false);
        }
        return;
      }

      try {
        const user = await fetchCurrentUser();
        if (mounted) {
          setAuthUser(user);
        }
      } catch {
        window.localStorage.removeItem("studyflow_token");
        if (mounted) {
          setAuthUser(null);
        }
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    }

    void bootstrapAuth();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleAuthAction(action: () => Promise<{ token: string; user: AuthUser }>) {
    try {
      setAuthSaving(true);
      setAuthError(null);
      const response = await action();
      window.localStorage.setItem("studyflow_token", response.token);
      setAuthUser(response.user);
    } catch (nextError) {
      if (nextError instanceof AxiosError) {
        setAuthError(nextError.response?.data?.message || nextError.message || "Authentication failed.");
      } else {
        setAuthError("Authentication failed.");
      }
    } finally {
      setAuthSaving(false);
    }
  }

  function handleLogout() {
    window.localStorage.removeItem("studyflow_token");
    setAuthUser(null);
    setAuthError(null);
  }

  async function handleExportData() {
    const data = await exportWorkspace();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `disciplinex-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  async function handleImportData(file: File) {
    const text = await file.text();
    const parsed = JSON.parse(text) as Record<string, unknown>;
    await importWorkspace(parsed);
  }

  const routeFallback = (
    <div className="rounded-[32px] border border-white/30 bg-white/80 p-10 shadow-glow backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
      <p className="text-lg font-medium">Loading view...</p>
    </div>
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-xl rounded-[32px] border border-white/10 bg-white/5 p-10">
          <p className="text-lg font-medium">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <Suspense fallback={routeFallback}>
        <AuthPage
          onLogin={(payload) => handleAuthAction(() => loginUser(payload))}
          onRegister={(payload) => handleAuthAction(() => registerUser(payload))}
          onForgotPassword={(payload) => requestForgotPassword(payload).then((result) => result.message)}
          onConfirmForgotPassword={(payload) => confirmForgotPassword(payload).then((result) => result.message)}
          error={authError}
          loading={authSaving}
        />
      </Suspense>
    );
  }

  if (loading || !workspace) {
    return (
      <BrowserRouter>
        <AppShell profile={workspace?.profile} saving={saving} onExportData={handleExportData} onImportData={handleImportData} onLogout={handleLogout}>
          <div className="rounded-[32px] border border-white/30 bg-white/80 p-10 shadow-glow backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
            <p className="text-lg font-medium">Loading your workspace...</p>
            {error ? <p className="mt-2 text-sm text-rose-500">{error}</p> : null}
          </div>
        </AppShell>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <AppShell profile={workspace.profile} saving={saving} onExportData={handleExportData} onImportData={handleImportData} onLogout={handleLogout}>
        <Suspense fallback={routeFallback}>
          <Routes>
          <Route
            path="/"
            element={
              <DashboardPage workspace={workspace} />
            }
          />
          <Route
            path="/timer"
            element={
              <TimerPage
                workspace={workspace}
                onStartSession={startFocusSession}
                onPauseSession={togglePauseSession}
                onStopSession={stopFocusSession}
              />
            }
          />
          <Route path="/reports" element={<ReportsPage workspace={workspace} />} />
          <Route
            path="/tasks"
            element={
              <TasksPage
                workspace={workspace}
                onAddTask={addTask}
                onUpdateTask={updateTask}
                onReorderTasks={reorderTaskList}
              />
            }
          />
          <Route
            path="/calendar"
            element={
              <CalendarPage
                workspace={workspace}
                onAddBlock={addCalendarBlock}
                onDeleteBlock={deleteCalendarEvent}
              />
            }
          />
          <Route
            path="/settings"
            element={
              <SettingsPage
                workspace={workspace}
                onUpdateProfile={updateProfile}
                onAddSubject={addSubject}
                onDeleteSubject={deleteSubject}
                onResetWorkspace={clearAllData}
              />
            }
          />
          </Routes>
        </Suspense>
        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-950/20 dark:text-rose-200">
            {error}
          </div>
        ) : null}
      </AppShell>
    </BrowserRouter>
  );
}
