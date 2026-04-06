import { useEffect, useMemo, useState } from "react";
import {
  autoScheduleTasks,
  createCalendarBlock,
  createSubject,
  createTask,
  deleteCalendarBlock,
  exportWorkspaceData,
  fetchWorkspace,
  importWorkspaceData,
  patchProfile,
  patchSubject,
  patchTask,
  pauseSession,
  removeSubject,
  removeTask,
  reorderTasks,
  resetWorkspace,
  startSession,
  stopSession
} from "../api/workspace";
import type { WorkspaceData } from "../types";

export function useWorkspaceData(enabled = true) {
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return undefined;
    }

    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const data = await fetchWorkspace();
        if (mounted) {
          setWorkspace(data);
        }
      } catch (nextError) {
        if (mounted) {
          setError("Unable to load your workspace. Make sure the backend and MongoDB are running.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [enabled]);

  async function runAction(action: () => Promise<WorkspaceData>) {
    try {
      setSaving(true);
      setError(null);
      const data = await action();
      setWorkspace(data);
    } catch (nextError) {
      setError("Your changes could not be saved.");
      throw nextError;
    } finally {
      setSaving(false);
    }
  }

  return useMemo(
    () => ({
      workspace,
      loading,
      saving,
      error,
      setError,
      refresh: () => runAction(fetchWorkspace),
      updateProfile: (payload: Record<string, unknown>) => runAction(() => patchProfile(payload)),
      addSubject: (payload: Record<string, unknown>) => runAction(() => createSubject(payload)),
      updateSubject: (subjectId: string, payload: Record<string, unknown>) =>
        runAction(() => patchSubject(subjectId, payload)),
      deleteSubject: (subjectId: string) => runAction(() => removeSubject(subjectId)),
      addTask: (payload: Record<string, unknown>) => runAction(() => createTask(payload)),
      updateTask: (taskId: string, payload: Record<string, unknown>) =>
        runAction(() => patchTask(taskId, payload)),
      reorderTaskList: (orderedTaskIds: string[]) => runAction(() => reorderTasks({ orderedTaskIds })),
      deleteTask: (taskId: string) => runAction(() => removeTask(taskId)),
      addCalendarBlock: (payload: Record<string, unknown>) => runAction(() => createCalendarBlock(payload)),
      deleteCalendarEvent: (blockId: string) => runAction(() => deleteCalendarBlock(blockId)),
      runAutoSchedule: () => runAction(autoScheduleTasks),
      exportWorkspace: () => exportWorkspaceData(),
      importWorkspace: (payload: Record<string, unknown>) => runAction(() => importWorkspaceData(payload)),
      startFocusSession: (payload: Record<string, unknown>) => runAction(() => startSession(payload)),
      togglePauseSession: (sessionId: string, isPaused: boolean) =>
        runAction(() => pauseSession(sessionId, { isPaused })),
      stopFocusSession: (sessionId: string) => runAction(() => stopSession(sessionId)),
      clearAllData: () => runAction(resetWorkspace)
    }),
    [workspace, loading, saving, error]
  );
}
