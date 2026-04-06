import { TaskBoard } from "../components/tasks/TaskBoard";
import type { WorkspaceData } from "../types";

type TasksPageProps = {
  workspace: WorkspaceData;
  onAddTask: (payload: { title: string; subjectId?: string; priority: "low" | "medium" | "high" }) => Promise<void>;
  onToggleTask: (taskId: string, completed: boolean) => Promise<void>;
  onReorderTasks: (orderedTaskIds: string[]) => Promise<void>;
};

export function TasksPage({ workspace, onAddTask, onToggleTask, onReorderTasks }: TasksPageProps) {
  return (
    <TaskBoard
      tasks={workspace.tasks}
      subjects={workspace.subjects}
      onAddTask={onAddTask}
      onToggleTask={onToggleTask}
      onReorderTasks={onReorderTasks}
    />
  );
}
