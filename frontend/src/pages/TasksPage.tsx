import { TaskBoard } from "../components/tasks/TaskBoard";
import type { WorkspaceData } from "../types";

type TasksPageProps = {
  workspace: WorkspaceData;
  onAddTask: (payload: {
    title: string;
    subjectId?: string;
    priority: "low" | "medium" | "high";
    category: "coding" | "debugging" | "research" | "writing" | "learning" | "planning" | "ti_cohort" | "backlogs" | "others";
    status: "in_progress" | "will_see_later" | "backlog" | "done";
    subtasks: Array<{ title: string; completed: boolean }>;
  }) => Promise<void>;
  onUpdateTask: (taskId: string, payload: Record<string, unknown>) => Promise<void>;
  onReorderTasks: (orderedTaskIds: string[]) => Promise<void>;
};

export function TasksPage({ workspace, onAddTask, onUpdateTask, onReorderTasks }: TasksPageProps) {
  const cohortTasks = workspace.tasks.filter((task) => task.category === "ti_cohort");

  return (
    <div className="space-y-6">
      <TaskBoard
        tasks={workspace.tasks}
        subjects={workspace.subjects}
        onAddTask={onAddTask}
        onUpdateTask={onUpdateTask}
        onReorderTasks={onReorderTasks}
      />

      <section className="rounded-[32px] border border-white/10 bg-slate-950/35 p-5 shadow-glow backdrop-blur sm:p-6">
        <h3 className="text-xl font-semibold text-white">Cohort Subjects</h3>
        <p className="mt-1 text-sm text-slate-400">Tasks tagged as TI COHORT are grouped by subject here.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {workspace.subjects.map((subject) => {
            const subjectTasks = cohortTasks.filter((task) => task.subject?._id === subject.id || task.subject?.name === subject.name);
            return (
              <article key={subject.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: subject.color }} />
                  <p className="font-medium text-white">{subject.name}</p>
                </div>
                <div className="mt-3 space-y-2">
                  {subjectTasks.length ? (
                    subjectTasks.map((task) => (
                      <div key={task.id} className="rounded-2xl border border-white/10 bg-slate-900/40 px-3 py-2 text-sm text-slate-200">
                        {task.title}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No cohort tasks yet.</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
