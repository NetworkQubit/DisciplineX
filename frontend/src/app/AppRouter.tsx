import { AxiosError } from "axios";
import { useEffect, useState } from "react";
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
import { AuthPage } from "../pages/AuthPage";
import { CalendarPage } from "../pages/CalendarPage";
import { DashboardPage } from "../pages/DashboardPage";
import { ReportsPage } from "../pages/ReportsPage";
import { SettingsPage } from "../pages/SettingsPage";
import { TasksPage } from "../pages/TasksPage";
import { TimerPage } from "../pages/TimerPage";
import type { AuthUser } from "../types";

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
    clearAllData
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
      <AuthPage
        onLogin={(payload) => handleAuthAction(() => loginUser(payload))}
        onRegister={(payload) => handleAuthAction(() => registerUser(payload))}
        onForgotPassword={(payload) => requestForgotPassword(payload).then((result) => result.message)}
        onConfirmForgotPassword={(payload) => confirmForgotPassword(payload).then((result) => result.message)}
        error={authError}
        loading={authSaving}
      />
    );
  }

  if (loading || !workspace) {
    return (
      <BrowserRouter>
        <AppShell profile={workspace?.profile} saving={saving} onLogout={handleLogout}>
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
      <AppShell profile={workspace.profile} saving={saving} onLogout={handleLogout}>
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
                onToggleTask={(taskId, completed) => updateTask(taskId, { completed })}
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
        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-950/20 dark:text-rose-200">
            {error}
          </div>
        ) : null}
      </AppShell>
    </BrowserRouter>
  );
}
