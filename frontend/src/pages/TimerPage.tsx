import { TimerPanel } from "../components/timer/TimerPanel";
import type { WorkspaceData } from "../types";

type TimerPageProps = {
  workspace: WorkspaceData;
  onStartSession: (payload: { subjectId?: string; mode: "standard" | "pomodoro" | "focus" }) => Promise<void>;
  onPauseSession: (sessionId: string, isPaused: boolean) => Promise<void>;
  onStopSession: (sessionId: string) => Promise<void>;
};

export function TimerPage({ workspace, onStartSession, onPauseSession, onStopSession }: TimerPageProps) {
  return (
    <div className="space-y-6">
      <TimerPanel
        subjects={workspace.subjects}
        sessions={workspace.sessions}
        activeSession={workspace.activeSession}
        profile={workspace.profile}
        onStartSession={onStartSession}
        onPauseSession={onPauseSession}
        onStopSession={onStopSession}
      />
    </div>
  );
}
