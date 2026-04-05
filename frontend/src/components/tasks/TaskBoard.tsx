import { useEffect, useState } from "react";
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
import { CheckCircle2, GripVertical } from "lucide-react";
import type { Subject, Task } from "../../types";
import { cn } from "../../lib/utils";

type TaskBoardProps = {
  tasks: Task[];
  subjects: Subject[];
  onAddTask: (payload: { title: string; subjectId?: string; priority: "low" | "medium" | "high" }) => Promise<void>;
  onToggleTask: (taskId: string, completed: boolean) => Promise<void>;
  onReorderTasks: (orderedTaskIds: string[]) => Promise<void>;
};

function SortableTaskCard({
  task,
  onToggleTask
}: {
  task: Task;
  onToggleTask: (taskId: string, completed: boolean) => Promise<void>;
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
      className="flex items-center gap-3 rounded-3xl border border-white/30 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/70 sm:gap-4"
    >
      <button className="text-slate-400" {...attributes} {...listeners}>
        <GripVertical className="h-5 w-5" />
      </button>
      <button
        className={cn("rounded-full", task.completed && "text-teal-500")}
        onClick={() => void onToggleTask(task.id, !task.completed)}
      >
        <CheckCircle2 className="h-5 w-5" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{task.title}</p>
        <p className="truncate text-sm text-slate-500 dark:text-slate-400">
          {task.subject?.name || "General"} · {task.priority} priority
        </p>
      </div>
    </article>
  );
}

export function TaskBoard({ tasks, subjects, onAddTask, onToggleTask, onReorderTasks }: TaskBoardProps) {
  const [items, setItems] = useState(tasks);
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    setItems(tasks);
  }, [tasks]);

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
      priority
    });

    setTitle("");
    setSubjectId("");
    setPriority("medium");
  }

  return (
    <section className="rounded-[32px] border border-white/30 bg-white/80 p-5 shadow-glow backdrop-blur sm:p-6 dark:border-white/10 dark:bg-slate-900/70">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-xl font-semibold">Today&apos;s tasks</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Drag to reprioritize and persist your daily plan.
          </p>
        </div>
        <button
          className="w-full rounded-2xl bg-slate-950 px-4 py-2 text-sm text-white sm:w-auto"
          onClick={() => void handleAddTask()}
        >
          Save Task
        </button>
      </div>

      <div className="mb-5 grid gap-3 xl:grid-cols-[1.6fr_1fr_0.8fr]">
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
          <option value="">General</option>
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
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((task) => task.id)} strategy={rectSortingStrategy}>
          <div className="space-y-3">
            {items.map((task) => (
              <SortableTaskCard key={task.id} task={task} onToggleTask={onToggleTask} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}
