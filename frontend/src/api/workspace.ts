import { api } from "./client";
import type { WorkspaceData } from "../types";

export async function fetchWorkspace() {
  const { data } = await api.get<WorkspaceData>("/workspace");
  return data;
}

export async function patchProfile(payload: Record<string, unknown>) {
  const { data } = await api.patch<WorkspaceData>("/workspace/profile", payload);
  return data;
}

export async function createSubject(payload: Record<string, unknown>) {
  const { data } = await api.post<WorkspaceData>("/workspace/subjects", payload);
  return data;
}

export async function patchSubject(subjectId: string, payload: Record<string, unknown>) {
  const { data } = await api.patch<WorkspaceData>(`/workspace/subjects/${subjectId}`, payload);
  return data;
}

export async function removeSubject(subjectId: string) {
  const { data } = await api.delete<WorkspaceData>(`/workspace/subjects/${subjectId}`);
  return data;
}

export async function createTask(payload: Record<string, unknown>) {
  const { data } = await api.post<WorkspaceData>("/workspace/tasks", payload);
  return data;
}

export async function patchTask(taskId: string, payload: Record<string, unknown>) {
  const { data } = await api.patch<WorkspaceData>(`/workspace/tasks/${taskId}`, payload);
  return data;
}

export async function reorderTasks(payload: { orderedTaskIds: string[] }) {
  const { data } = await api.patch<WorkspaceData>("/workspace/tasks/reorder", payload);
  return data;
}

export async function removeTask(taskId: string) {
  const { data } = await api.delete<WorkspaceData>(`/workspace/tasks/${taskId}`);
  return data;
}

export async function startSession(payload: Record<string, unknown>) {
  const { data } = await api.post<WorkspaceData>("/workspace/sessions/start", payload);
  return data;
}

export async function pauseSession(sessionId: string, payload: { isPaused: boolean }) {
  const { data } = await api.patch<WorkspaceData>(`/workspace/sessions/${sessionId}/pause`, payload);
  return data;
}

export async function stopSession(sessionId: string) {
  const { data } = await api.patch<WorkspaceData>(`/workspace/sessions/${sessionId}/stop`);
  return data;
}

export async function resetWorkspace() {
  const { data } = await api.delete<WorkspaceData>("/workspace/reset");
  return data;
}

export async function createCalendarBlock(payload: Record<string, unknown>) {
  const { data } = await api.post<WorkspaceData>("/workspace/calendar/blocks", payload);
  return data;
}

export async function deleteCalendarBlock(blockId: string) {
  const { data } = await api.delete<WorkspaceData>(`/workspace/calendar/blocks/${blockId}`);
  return data;
}

export async function autoScheduleTasks() {
  const { data } = await api.post<WorkspaceData>("/workspace/schedule/auto");
  return data;
}
