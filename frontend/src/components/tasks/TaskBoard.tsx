import { useEffect, useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CheckCircle2, Circle, GripVertical, Plus } from "lucide-react";
import type { Subject, Task } from "../../types";
import { cn } from "../../lib/utils";

const categoryLabels = {
  coding: "Coding",
  debugging: "Debugging",
  research: "Research",
  writing: "Writing",
  learning: "Learning",
  planning: "Planning",
  others: "Others"
} as const;

const priorityBadgeClasses: Record<Task["priority"], string> = {
  low: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
  medium: "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
  high: "bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200"
};

type TaskBoardProps = {
  tasks: Task[];
  subjects: Subject[];
  activeStatus: "in_progress" | "will_see_later" | "backlog" | "done";
  onAddTask: (payload: {
    title: string;
    subjectId?: string;
    priority: "low" | "medium" | "high";
    category: keyof typeof categoryLabels;
    status: "in_progress" | "will_see_later" | "backlog" | "done";
    subtasks: Array<{ title: string; completed: boolean }>;
  }) => Promise<void>;
  onUpdateTask: (taskId: string, payload: Record<string, unknown>) => Promise<void>;
  onReorderTasks: (orderedTaskIds: string[]) => Promise<void>;
};

function SortableTaskCard({
  task,
  onUpdateTask
}: {
  task: Task;
  onUpdateTask: (taskId: string, payload: Record<string, unknown>) => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: task.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className="rounded-3xl border border-white/30 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/70"
    >
      <div className="flex items-start gap-3">
        <button className="mt-1 text-slate-400" {...attributes} {...listeners}>
          <GripVertical className="h-5 w-5" />
        </button>
        <button
          className={cn("mt-0.5 rounded-full", task.completed && "text-teal-500")}
          onClick={() => void onUpdateTask(task.id, { completed: !task.completed })}
        >
          <CheckCircle2 className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium">{task.title}</p>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] uppercase tracking-[0.12em] text-slate-500 dark:bg-slate-950 dark:text-slate-400">
              {categoryLabels[task.category || "others"]}
            </span>
            <span className={cn("rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]", priorityBadgeClasses[task.priority])}>
              {task.priority}
            </span>
          </div>
          <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
            {task.subject?.name || "No subject"}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <select
              value={task.status || "backlog"}
              onChange={(event) => void onUpdateTask(task.id, { status: event.target.value })}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-950/60"
            >
              <option value="in_progress">In Progress</option>
              <option value="will_see_later">Will See Later</option>
              <option value="backlog">Backlogs</option>
              <option value="done">Done</option>
            </select>
          </div>

          {task.subtasks?.length ? (
            <div className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/60">
              {task.subtasks.map((subtask, index) => (
                <button
                  key={subtask.id || subtask._id || `${task.id}-${index}`}
                  className="flex w-full items-center gap-2 text-left text-sm"
                  onClick={() =>
                    void onUpdateTask(task.id, {
                      subtasks: task.subtasks?.map((entry, entryIndex) =>
                        entryIndex === index ? { ...entry, completed: !entry.completed } : entry
                      )
                    })
                  }
                >
                  {subtask.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-teal-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-slate-400" />
                  )}
                  <span className={cn(subtask.completed && "line-through text-slate-400")}>{subtask.title}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function TaskBoard({ tasks, subjects, activeStatus, onAddTask, onUpdateTask, onReorderTasks }: TaskBoardProps) {
  const [items, setItems] = useState(tasks);
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [category, setCategory] = useState<keyof typeof categoryLabels>("others");
  const [subtaskDraft, setSubtaskDraft] = useState("");
  const [subtasks, setSubtasks] = useState<Array<{ title: string; completed: boolean }>>([]);
  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    setItems(tasks);
  }, [tasks]);

  const emptyLabel = useMemo(() => {
    const mapping = {
      in_progress: "Nothing is actively moving here yet.",
      will_see_later: "This lane is waiting for future attention.",
      backlog: "Your backlog is clear right now.",
      done: "No completed tasks yet."
    };

    return mapping[activeStatus];
  }, [activeStatus]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setItems((current) => {
      const oldIndex = current.findIndex((task) => task.id === active.id);
      const newIndex = current.findIndex((task) => task.id === over.id);
      const next = arrayMove(current, oldIndex, newIndex);
      void onReorderTasks(next.map((task) => task.id));
      return next;
    });
  }

  async function handleAddTask() {
    if (!title.trim()) {
      return;
    }

    await onAddTask({
      title: title.trim(),
      subjectId: subjectId || undefined,
      priority,
      category,
      status: activeStatus,
      subtasks
    });

    setTitle("");
    setSubjectId("");
    setPriority("medium");
    setCategory("others");
    setSubtaskDraft("");
    setSubtasks([]);
  }

  function addSubtaskDraft() {
    if (!subtaskDraft.trim()) {
      return;
    }

    setSubtasks((current) => [...current, { title: subtaskDraft.trim(), completed: false }]);
    setSubtaskDraft("");
  }

  return (
    <section className="rounded-[32px] border border-white/30 bg-white/80 p-5 shadow-glow backdrop-blur sm:p-6 dark:border-white/10 dark:bg-slate-900/70">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-xl font-semibold">Task Categories</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Add richer tasks with categories, subtasks, and clear status lanes.
          </p>
        </div>
        <button
          className="w-full rounded-2xl bg-slate-950 px-4 py-2 text-sm text-white sm:w-auto"
          onClick={() => void handleAddTask()}
        >
          Save Task
        </button>
      </div>

      <div className="mb-5 grid gap-3 xl:grid-cols-[1.6fr_1fr_0.8fr_1fr]">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a new study task"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none dark:border-white/10 dark:bg-slate-950/50"
        />
        <select
          value={subjectId}
          onChange={(event) => setSubjectId(event.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none dark:border-white/10 dark:bg-slate-950/50"
        >
          <option value="">Select subject</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
        <select
          value={priority}
          onChange={(event) => setPriority(event.target.value as "low" | "medium" | "high")}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none dark:border-white/10 dark:bg-slate-950/50"
        >
          <option value="low">Low priority</option>
          <option value="medium">Medium priority</option>
          <option value="high">High priority</option>
        </select>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value as keyof typeof categoryLabels)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none dark:border-white/10 dark:bg-slate-950/50"
        >
          {Object.entries(categoryLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/50">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={subtaskDraft}
            onChange={(event) => setSubtaskDraft(event.target.value)}
            placeholder="Add a subtask"
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none dark:border-white/10 dark:bg-slate-900"
          />
          <button
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-slate-900"
            onClick={addSubtaskDraft}
          >
            <Plus className="h-4 w-4" />
            Add Subtask
          </button>
        </div>

        {subtasks.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {subtasks.map((subtask, index) => (
              <span key={`${subtask.title}-${index}`} className="rounded-full bg-white px-3 py-2 text-sm dark:bg-slate-900">
                {subtask.title}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((task) => task.id)} strategy={rectSortingStrategy}>
          <div className="space-y-3">
            {items.length ? (
              items.map((task) => (
                <SortableTaskCard key={task.id} task={task} onUpdateTask={onUpdateTask} />
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-400">
                {emptyLabel}
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}
