import { TaskBoard } from "../components/tasks/TaskBoard";
import type { WorkspaceData } from "../types";

type TasksPageProps = {
  workspace: WorkspaceData;
  onAddTask: (payload: {
    title: string;
    subjectId?: string;
    priority: "low" | "medium" | "high";
    category: "coding" | "debugging" | "research" | "writing" | "learning" | "planning" | "others";
    status: "in_progress" | "will_see_later" | "backlog" | "done";
    subtasks: Array<{ title: string; completed: boolean }>;
  }) => Promise<void>;
  onUpdateTask: (taskId: string, payload: Record<string, unknown>) => Promise<void>;
  onReorderTasks: (orderedTaskIds: string[]) => Promise<void>;
};

export function TasksPage({ workspace, onAddTask, onUpdateTask, onReorderTasks }: TasksPageProps) {
  return (
    <div className="space-y-6">
      <TaskBoard
        tasks={workspace.tasks}
        subjects={workspace.subjects}
        onAddTask={onAddTask}
        onUpdateTask={onUpdateTask}
        onReorderTasks={onReorderTasks}
      />
    </div>
  );
}
