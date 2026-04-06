import { useEffect, useState } from "react";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent
} from "@dnd-kit/core";
import {
  SortableContext,
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
  low: "bg-emerald-500/15 text-emerald-200",
  medium: "bg-amber-500/15 text-amber-200",
  high: "bg-rose-500/15 text-rose-200"
};

type TaskBoardProps = {
  tasks: Task[];
  subjects: Subject[];
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
  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter((subtask) => subtask.completed).length || 0;
  const subtaskProgress = totalSubtasks ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  return (
    <article
      ref={setNodeRef}
      style={style}
      className="rounded-3xl border border-white/10 bg-slate-950/45 p-4 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <button className="mt-1 text-slate-400" {...attributes} {...listeners}>
          <GripVertical className="h-5 w-5" />
        </button>
        <button
          className={cn("mt-0.5 rounded-full", task.completed ? "text-teal-300" : "text-slate-400")}
          onClick={() => void onUpdateTask(task.id, { completed: !task.completed })}
        >
          <CheckCircle2 className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium">{task.title}</p>
            <span className="rounded-full bg-white/5 px-2 py-1 text-[11px] uppercase tracking-[0.12em] text-slate-300">
              {categoryLabels[task.category || "others"]}
            </span>
            <span className={cn("rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]", priorityBadgeClasses[task.priority])}>
              {task.priority}
            </span>
          </div>
          <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
            {task.subject?.name || "No subject"}
          </p>

          {totalSubtasks > 0 ? (
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
                <span>Subtasks</span>
                <span>{completedSubtasks}/{totalSubtasks}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-teal-400 transition-all duration-500 ease-out"
                  style={{ width: `${subtaskProgress}%` }}
                />
              </div>
            </div>
          ) : null}

          {task.subtasks?.length ? (
            <div className="mt-4 space-y-2 rounded-2xl bg-white/5 p-3">
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

type LaneId = "personal" | "in_progress" | "will_see_later" | "done";

const laneOrder: LaneId[] = ["personal", "in_progress", "will_see_later", "done"];

const laneLabels: Record<LaneId, string> = {
  personal: "PERSONAL",
  in_progress: "IN PROGRESS",
  will_see_later: "WILL SEE LATER",
  done: "DONE"
};

const laneBorderClasses: Record<LaneId, string> = {
  personal: "border-fuchsia-400/30",
  in_progress: "border-amber-400/30",
  will_see_later: "border-sky-400/30",
  done: "border-emerald-400/30"
};

function getLaneIdForTask(task: Task): LaneId {
  const status = task.status || "backlog";

  if (status === "backlog") {
    return "personal";
  }

  if (status === "in_progress") return "in_progress";
  if (status === "will_see_later") return "will_see_later";
  return "done";
}

function laneToStatus(laneId: LaneId): Task["status"] {
  if (laneId === "personal") return "backlog";
  if (laneId === "in_progress") return "in_progress";
  if (laneId === "will_see_later") return "will_see_later";
  return "done";
}

function LaneColumn({
  laneId,
  laneTasks,
  onUpdateTask
}: {
  laneId: LaneId;
  laneTasks: Task[];
  onUpdateTask: (taskId: string, payload: Record<string, unknown>) => Promise<void>;
}) {
  const { setNodeRef } = useDroppable({ id: laneId });

  return (
    <div className="min-w-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">{laneLabels[laneId]}</h4>
        <span className="rounded-full bg-white/5 px-2 py-1 text-xs font-medium text-slate-200/80">{laneTasks.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "min-h-[560px] rounded-[28px] border border-dashed bg-slate-950/20 p-3 transition",
          laneBorderClasses[laneId]
        )}
      >
        {laneTasks.length ? (
          <SortableContext items={laneTasks.map((task) => task.id)} strategy={rectSortingStrategy}>
            <div className="space-y-3">
              {laneTasks.map((task) => (
                <SortableTaskCard key={task.id} task={task} onUpdateTask={onUpdateTask} />
              ))}
            </div>
          </SortableContext>
        ) : (
          <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-white/5 bg-white/0 px-3 py-6 text-xs text-slate-500">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}

export function TaskBoard({ tasks, subjects, onAddTask, onUpdateTask, onReorderTasks }: TaskBoardProps) {
  const [items, setItems] = useState(tasks);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeTask = items.find((task) => task.id === activeId);
    if (!activeTask) return;

    const laneIds = new Set(laneOrder);

    let targetLane: LaneId;
    let overTask: Task | undefined;

    if (laneIds.has(overId as LaneId)) {
      targetLane = overId as LaneId;
    } else {
      overTask = items.find((task) => task.id === overId);
      if (!overTask) return;
      targetLane = getLaneIdForTask(overTask);
    }

    const nextStatus = laneToStatus(targetLane);

    const updatedActiveTask: Task = {
      ...activeTask,
      status: nextStatus,
      subject: targetLane === "personal" ? null : activeTask.subject
    };

    const withoutActive = items.filter((task) => task.id !== activeId);

    const insertIndex =
      laneIds.has(overId as LaneId)
        ? (() => {
            const lanePositions = withoutActive
              .map((task, index) => (getLaneIdForTask(task) === targetLane ? index : -1))
              .filter((index) => index !== -1);
            const last = lanePositions[lanePositions.length - 1];
            return typeof last === "number" ? last + 1 : 0;
          })()
        : (() => {
            const overIndex = withoutActive.findIndex((task) => task.id === overId);
            return overIndex >= 0 ? overIndex : withoutActive.length;
          })();

    const next = [...withoutActive];
    next.splice(insertIndex, 0, updatedActiveTask);

    setItems(next);

    const updatePayload: Record<string, unknown> = { status: nextStatus };
    if (targetLane === "personal") {
      updatePayload.subjectId = undefined; // backend converts subjectId -> subject and unsets when falsy
    }

    void onUpdateTask(activeId, updatePayload);
    void onReorderTasks(next.map((task) => task.id));
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
      status: "backlog",
      subtasks
    });

    setTitle("");
    setSubjectId("");
    setPriority("medium");
    setCategory("others");
    setSubtaskDraft("");
    setSubtasks([]);
    setIsNewTaskOpen(false);
  }

  function addSubtaskDraft() {
    if (!subtaskDraft.trim()) {
      return;
    }

    setSubtasks((current) => [...current, { title: subtaskDraft.trim(), completed: false }]);
    setSubtaskDraft("");
  }

  return (
    <>
      <section className="rounded-[32px] border border-white/10 bg-slate-950/35 p-5 shadow-glow backdrop-blur sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-xl font-semibold text-white">Task Board</h3>
            <p className="text-sm text-slate-400">Drag tasks between lanes to update their status.</p>
          </div>
          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/10 hover:bg-white/15 sm:w-auto"
            onClick={() => setIsNewTaskOpen(true)}
          >
            <Plus className="h-4 w-4" />
            New Task
          </button>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="grid gap-4 lg:grid-cols-4">
            {laneOrder.map((laneId) => {
              const laneTasks = items.filter((task) => getLaneIdForTask(task) === laneId);
              return <LaneColumn key={laneId} laneId={laneId} laneTasks={laneTasks} onUpdateTask={onUpdateTask} />;
            })}
          </div>
        </DndContext>
      </section>

      {isNewTaskOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-glow backdrop-blur">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">New Task</h3>
                <p className="text-sm text-slate-400">Tasks start in Backlog.</p>
              </div>
              <button
                className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/10 hover:bg-white/15"
                onClick={() => setIsNewTaskOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="grid gap-3 lg:grid-cols-4">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Add a new study task"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none text-white placeholder:text-slate-500"
              />
              <select
                value={subjectId}
                onChange={(event) => setSubjectId(event.target.value)}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none text-white"
              >
                <option value="">Personal (no subject)</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value as "low" | "medium" | "high")}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none text-white"
              >
                <option value="low">Low priority</option>
                <option value="medium">Medium priority</option>
                <option value="high">High priority</option>
              </select>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as keyof typeof categoryLabels)}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none text-white"
              >
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={subtaskDraft}
                  onChange={(event) => setSubtaskDraft(event.target.value)}
                  placeholder="Add a subtask"
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none text-white placeholder:text-slate-500"
                />
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white hover:bg-white/15"
                  onClick={addSubtaskDraft}
                >
                  <Plus className="h-4 w-4" />
                  Add Subtask
                </button>
              </div>

              {subtasks.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {subtasks.map((subtask, index) => (
                    <span
                      key={`${subtask.title}-${index}`}
                      className="rounded-full bg-white/10 px-3 py-2 text-sm text-white/90"
                    >
                      {subtask.title}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-2xl bg-white/10 px-5 py-2 text-sm font-medium text-white ring-1 ring-white/10 hover:bg-white/15"
                onClick={() => setIsNewTaskOpen(false)}
              >
                Cancel
              </button>
              <button
                className="rounded-2xl bg-white px-5 py-2 text-sm font-medium text-slate-950 hover:bg-slate-100"
                onClick={() => void handleAddTask()}
              >
                Save Task
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
