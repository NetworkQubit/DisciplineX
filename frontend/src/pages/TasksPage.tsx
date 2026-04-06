import { useMemo, useState } from "react";
import { TaskBoard } from "../components/tasks/TaskBoard";
import { cn } from "../lib/utils";
import type { WorkspaceData } from "../types";

const taskTabs = [
  { id: "in_progress", label: "In Progress" },
  { id: "will_see_later", label: "Will See Later" },
  { id: "backlog", label: "Backlogs" },
  { id: "done", label: "Done" }
] as const;

type TaskStatusTab = (typeof taskTabs)[number]["id"];

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
  const [activeTab, setActiveTab] = useState<TaskStatusTab>("in_progress");

  const filteredTasks = useMemo(
    () => workspace.tasks.filter((task) => (task.status || "backlog") === activeTab),
    [workspace.tasks, activeTab]
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/30 bg-white/80 p-3 shadow-glow backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
        <div className="grid gap-2 md:grid-cols-4">
          {taskTabs.map((tab) => (
            <button
              key={tab.id}
              className={cn(
                "rounded-[22px] px-4 py-4 text-sm font-medium transition",
                activeTab === tab.id
                  ? "bg-slate-950 text-white shadow-[0_18px_45px_rgba(15,23,42,0.18)] dark:bg-white dark:text-slate-950"
                  : "bg-white/70 text-slate-500 hover:text-slate-950 dark:bg-white/5 dark:text-slate-300 dark:hover:text-white"
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      <TaskBoard
        tasks={filteredTasks}
        subjects={workspace.subjects}
        activeStatus={activeTab}
        onAddTask={onAddTask}
        onUpdateTask={onUpdateTask}
        onReorderTasks={onReorderTasks}
      />
    </div>
  );
}
