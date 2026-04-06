import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { CalendarBlock, WorkspaceData } from "../types";

type CalendarPageProps = {
  workspace: WorkspaceData;
  onAddBlock: (payload: Record<string, unknown>) => Promise<void>;
  onDeleteBlock: (blockId: string) => Promise<void>;
};

const hourStart = 6;
const hourEnd = 22;
const hourRows = Array.from({ length: hourEnd - hourStart + 1 }, (_, index) => hourStart + index);
const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const typeStyles: Record<CalendarBlock["type"], string> = {
  class: "bg-sky-500/15 text-sky-800 ring-sky-400/30 dark:text-sky-100",
  study: "bg-emerald-500/15 text-emerald-800 ring-emerald-400/30 dark:text-emerald-100",
  task: "bg-amber-500/15 text-amber-800 ring-amber-400/30 dark:text-amber-100",
  personal: "bg-fuchsia-500/15 text-fuchsia-800 ring-fuchsia-400/30 dark:text-fuchsia-100"
};

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfWeek(date: Date) {
  const next = new Date(date);
  const diff = next.getDate() - next.getDay();
  next.setDate(diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfMonthGrid(date: Date) {
  return startOfWeek(new Date(date.getFullYear(), date.getMonth(), 1));
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function timeLabel(hour: number) {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  return date.toLocaleTimeString([], { hour: "numeric" });
}

function minutesFromMidnight(value: string) {
  const date = new Date(value);
  return date.getHours() * 60 + date.getMinutes();
}

function groupBlocksByDate(blocks: CalendarBlock[]) {
  const map = new Map<string, CalendarBlock[]>();

  blocks.forEach((block) => {
    const key = block.startAt.slice(0, 10);
    const current = map.get(key) || [];
    current.push(block);
    map.set(key, current.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()));
  });

  return map;
}

function recurrenceLabel(block: CalendarBlock) {
  if (!block.recurrence) {
    return block.source === "auto" ? "Auto-scheduled" : block.type;
  }

  const unit = block.recurrence.frequency === "daily" ? "day" : "week";
  const interval = block.recurrence.interval > 1 ? `${block.recurrence.interval} ${unit}s` : `every ${unit}`;
  return `Repeats ${interval}`;
}

function blocksForDate(blocksByDate: Map<string, CalendarBlock[]>, day: Date) {
  return blocksByDate.get(dateKey(day)) || [];
}

function toGoogleCalendarTime(value: string) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function buildGoogleCalendarUrl(payload: { title: string; startAt: string; endAt: string; details?: string }) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: payload.title,
    dates: `${toGoogleCalendarTime(payload.startAt)}/${toGoogleCalendarTime(payload.endAt)}`,
    details: payload.details || "Synced from DisciplineX"
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function WeekEventColumn({
  day,
  blocks,
  selected,
  onSelect
}: {
  day: Date;
  blocks: CalendarBlock[];
  selected: boolean;
  onSelect: (date: Date) => void;
}) {
  return (
    <div className="relative min-w-0 border-l border-slate-200/70 dark:border-white/10">
      <button
        className={`sticky top-0 z-10 flex w-full flex-col border-b border-slate-200/70 px-3 py-3 text-left backdrop-blur dark:border-white/10 ${
          selected ? "bg-slate-950 text-white" : "bg-white/80 dark:bg-slate-900/80"
        }`}
        onClick={() => onSelect(day)}
      >
        <span className="text-xs uppercase tracking-[0.18em] opacity-70">{dayLabels[day.getDay()]}</span>
        <span className="mt-1 text-lg font-semibold">{day.getDate()}</span>
      </button>

      <div className="relative h-[960px]">
        {hourRows.slice(0, -1).map((hour) => (
          <div
            key={hour}
            className="pointer-events-none absolute inset-x-0 border-t border-dashed border-slate-200/80 dark:border-white/10"
            style={{ top: `${((hour - hourStart) / (hourEnd - hourStart)) * 960}px` }}
          />
        ))}

        {blocks.map((block) => {
          const startMinutes = minutesFromMidnight(block.startAt);
          const endMinutes = minutesFromMidnight(block.endAt);
          const top = ((startMinutes - hourStart * 60) / ((hourEnd - hourStart) * 60)) * 960;
          const height = Math.max(36, ((endMinutes - startMinutes) / ((hourEnd - hourStart) * 60)) * 960);

          return (
            <div
              key={block.id}
              className={`absolute left-2 right-2 overflow-hidden rounded-2xl p-3 text-xs ring-1 ${typeStyles[block.type]}`}
              style={{ top, height }}
              title={block.title}
            >
              <p className="truncate font-semibold">{block.title}</p>
              <p className="mt-1 truncate opacity-75">
                {new Date(block.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                {new Date(block.endAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
              <p className="mt-1 truncate opacity-65">{recurrenceLabel(block)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CalendarPage({
  workspace,
  onAddBlock,
  onDeleteBlock
}: CalendarPageProps) {
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("week");
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [title, setTitle] = useState("");
  const [type, setType] = useState<CalendarBlock["type"]>("study");
  const [date, setDate] = useState(toInputDate(new Date()));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:30");
  const [repeatFrequency, setRepeatFrequency] = useState<"none" | "daily" | "weekly">("none");
  const [repeatCount, setRepeatCount] = useState(6);

  const blocksByDate = useMemo(() => groupBlocksByDate(workspace.calendarBlocks), [workspace.calendarBlocks]);
  const weekStart = useMemo(() => startOfWeek(anchorDate), [anchorDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  const monthDays = useMemo(
    () => Array.from({ length: 42 }, (_, index) => addDays(startOfMonthGrid(anchorDate), index)),
    [anchorDate]
  );
  const selectedBlocks = blocksByDate.get(dateKey(selectedDate)) || [];

  const miniMonthDays = useMemo(() => {
    const monthAnchor = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
    const first = startOfWeek(monthAnchor);
    return Array.from({ length: 35 }, (_, index) => addDays(first, index));
  }, [anchorDate]);

  async function handleAddBlock() {
    if (!title.trim()) {
      return;
    }

    const startAt = new Date(`${date}T${startTime}:00`);
    const endAt = new Date(`${date}T${endTime}:00`);
    await onAddBlock({
      title: title.trim(),
      type,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      recurrence:
        repeatFrequency === "none"
          ? null
          : {
              frequency: repeatFrequency,
              count: repeatCount,
              interval: 1
            }
    });
    setTitle("");
  }

  async function handleSyncGoogleCalendar() {
    const sourceBlock = selectedBlocks[0];
    const draftStartAt = new Date(`${date}T${startTime}:00`).toISOString();
    const draftEndAt = new Date(`${date}T${endTime}:00`).toISOString();
    const titleToUse = sourceBlock?.title || title.trim() || "Study Block";
    const startAtToUse = sourceBlock?.startAt || draftStartAt;
    const endAtToUse = sourceBlock?.endAt || draftEndAt;

    if (!sourceBlock && title.trim()) {
      await onAddBlock({
        title: title.trim(),
        type,
        startAt: startAtToUse,
        endAt: endAtToUse,
        recurrence:
          repeatFrequency === "none"
            ? null
            : {
                frequency: repeatFrequency,
                count: repeatCount,
                interval: 1
              }
      });
      setTitle("");
    }

    window.open(
      buildGoogleCalendarUrl({
        title: titleToUse,
        startAt: startAtToUse,
        endAt: endAtToUse,
        details: sourceBlock ? recurrenceLabel(sourceBlock) : "Created from DisciplineX calendar"
      }),
      "_blank",
      "noopener,noreferrer"
    );
  }

  function shiftAnchor(direction: -1 | 1) {
    const next = new Date(anchorDate);

    if (viewMode === "month") {
      next.setMonth(next.getMonth() + direction);
    } else if (viewMode === "week") {
      next.setDate(next.getDate() + direction * 7);
    } else {
      next.setDate(next.getDate() + direction);
    }

    setAnchorDate(next);
  }

  const periodLabel =
    viewMode === "month"
      ? anchorDate.toLocaleDateString([], { month: "long", year: "numeric" })
      : viewMode === "week"
        ? `${weekStart.toLocaleDateString([], { month: "long", day: "numeric" })} - ${addDays(weekStart, 6).toLocaleDateString([], {
            month: "long",
            day: "numeric"
          })}`
        : selectedDate.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="grid gap-6 xl:grid-cols-[0.36fr_1fr_0.44fr]">
      <aside className="space-y-6">
        <section className="rounded-[32px] border border-white/30 bg-white/80 p-6 shadow-glow backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <button className="rounded-xl bg-slate-100 p-2 dark:bg-slate-950/50" onClick={() => shiftAnchor(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <p className="text-sm font-semibold">
                {anchorDate.toLocaleDateString([], { month: "long", year: "numeric" })}
              </p>
              <button className="rounded-xl bg-slate-100 p-2 dark:bg-slate-950/50" onClick={() => shiftAnchor(1)}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-[0.16em] text-slate-400">
              {dayLabels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {miniMonthDays.map((day) => {
                const key = dateKey(day);
                const isCurrentMonth = day.getMonth() === anchorDate.getMonth();
                const isSelected = key === dateKey(selectedDate);
                const count = (blocksByDate.get(key) || []).length;

                return (
                  <button
                    key={key}
                    className={`rounded-2xl px-2 py-3 text-center text-sm transition ${
                      isSelected
                        ? "bg-slate-950 text-white"
                        : isCurrentMonth
                          ? "bg-slate-100 text-slate-700 dark:bg-slate-950/40 dark:text-slate-200"
                          : "bg-slate-50 text-slate-400 dark:bg-slate-950/20 dark:text-slate-500"
                    }`}
                    onClick={() => {
                      setSelectedDate(day);
                      setAnchorDate(day);
                      setDate(toInputDate(day));
                    }}
                  >
                    <span>{day.getDate()}</span>
                    {count ? <div className="mx-auto mt-1 h-1.5 w-1.5 rounded-full bg-teal-400" /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/30 bg-white/80 p-5 shadow-glow backdrop-blur dark:border-white/10 dark:bg-slate-900/70 sm:p-6">
          <h3 className="text-xl font-semibold">Add time block</h3>
          <div className="mt-5 grid gap-3">
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Event title" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950/50" />
            <select value={type} onChange={(event) => setType(event.target.value as CalendarBlock["type"])} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950/50">
              <option value="study">Study</option>
              <option value="class">Class</option>
              <option value="task">Task</option>
              <option value="personal">Personal</option>
            </select>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950/50" />
            <div className="grid grid-cols-2 gap-3">
              <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950/50" />
              <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950/50" />
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
              <select
                value={repeatFrequency}
                onChange={(event) => setRepeatFrequency(event.target.value as "none" | "daily" | "weekly")}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950/50"
              >
                <option value="none">Does not repeat</option>
                <option value="daily">Repeat daily</option>
                <option value="weekly">Repeat weekly</option>
              </select>
              <input
                type="number"
                min={2}
                max={30}
                value={repeatCount}
                disabled={repeatFrequency === "none"}
                onChange={(event) => setRepeatCount(Math.max(2, Number(event.target.value) || 2))}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 disabled:opacity-50 dark:border-white/10 dark:bg-slate-950/50"
              />
            </div>
            <button className="rounded-2xl bg-slate-950 px-4 py-3 text-white" onClick={() => void handleAddBlock()}>
              Save Event
            </button>
          </div>
        </section>
      </aside>

      <section className="order-first rounded-[32px] border border-white/30 bg-white/80 p-4 shadow-glow backdrop-blur dark:border-white/10 dark:bg-slate-900/70 xl:order-none">
        <div className="mb-4 flex flex-col gap-3 px-1 pt-2 sm:px-2 xl:flex-row xl:flex-wrap xl:items-center xl:justify-between">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button className="rounded-2xl bg-slate-100 px-3 py-2 dark:bg-slate-950/50" onClick={() => shiftAnchor(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="rounded-2xl bg-slate-100 px-3 py-2 dark:bg-slate-950/50" onClick={() => setAnchorDate(new Date())}>
              Today
            </button>
            <button className="rounded-2xl bg-slate-100 px-3 py-2 dark:bg-slate-950/50" onClick={() => shiftAnchor(1)}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="min-w-0">
            <p className="text-lg font-semibold">{periodLabel}</p>
          </div>

          <div className="flex w-full rounded-2xl bg-slate-100 p-1 dark:bg-slate-950/50 sm:w-auto">
            {(["month", "week", "day"] as const).map((mode) => (
              <button
                key={mode}
                className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition sm:flex-none ${
                  viewMode === mode ? "bg-slate-950 text-white" : "text-slate-500 dark:text-slate-300"
                }`}
                onClick={() => setViewMode(mode)}
              >
                {mode === "month" ? "Month" : mode === "week" ? "Week" : "Day"}
              </button>
            ))}
          </div>
        </div>

        {viewMode === "month" ? (
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-[24px] border border-slate-200/70 bg-slate-200/70 dark:border-white/10 dark:bg-white/10">
            {dayLabels.map((label) => (
              <div key={label} className="bg-slate-50 px-3 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:bg-slate-950/80">
                {label}
              </div>
            ))}
            {monthDays.map((day) => {
              const dayBlocks = blocksForDate(blocksByDate, day);
              const isCurrentMonth = day.getMonth() === anchorDate.getMonth();
              const isSelected = dateKey(day) === dateKey(selectedDate);

              return (
                <button
                  key={dateKey(day)}
                  className={`min-h-[144px] bg-white px-3 py-3 text-left align-top transition dark:bg-slate-900 ${
                    isSelected ? "ring-2 ring-slate-950 dark:ring-white" : ""
                  }`}
                  onClick={() => {
                    setSelectedDate(day);
                    setDate(toInputDate(day));
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${isCurrentMonth ? "" : "text-slate-400 dark:text-slate-500"}`}>
                      {day.getDate()}
                    </span>
                    {dayBlocks.length ? (
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-500 dark:bg-slate-950/80 dark:text-slate-400">
                        {dayBlocks.length}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 space-y-2">
                    {dayBlocks.slice(0, 3).map((block) => (
                      <div
                        key={block.id}
                        className={`truncate rounded-xl px-2 py-1 text-xs ring-1 ${typeStyles[block.type]}`}
                      >
                        {block.title}
                      </div>
                    ))}
                    {dayBlocks.length > 3 ? (
                      <p className="text-xs text-slate-400">+{dayBlocks.length - 3} more</p>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="grid min-w-[980px] grid-cols-[72px_repeat(7,minmax(120px,1fr))]">
              <div className="relative border-r border-slate-200/70 dark:border-white/10">
                <div className="sticky top-0 z-10 h-[74px] border-b border-slate-200/70 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-slate-900/80" />
                <div className="relative h-[960px]">
                  {hourRows.map((hour) => (
                    <div key={hour} className="relative h-[60px]">
                      <span className="absolute -top-2 left-2 text-xs text-slate-400">{timeLabel(hour)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {(viewMode === "day" ? [selectedDate] : weekDays).map((day) => (
                <WeekEventColumn
                  key={dateKey(day)}
                  day={day}
                  blocks={blocksForDate(blocksByDate, day)}
                  selected={dateKey(day) === dateKey(selectedDate)}
                  onSelect={setSelectedDate}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      <aside className="space-y-6">
        <section className="rounded-[32px] border border-white/30 bg-white/80 p-6 shadow-glow backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
          <h3 className="text-xl font-semibold">
            {selectedDate.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
          </h3>
          <div className="mt-5 space-y-3">
            {selectedBlocks.length ? (
              selectedBlocks.map((block) => (
                <div key={block.id} className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/40">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{block.title}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {new Date(block.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                        {new Date(block.endAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.15em] text-slate-400">{recurrenceLabel(block)}</p>
                    </div>
                    <button className="rounded-2xl bg-slate-100 px-3 py-2 text-sm dark:bg-slate-900" onClick={() => void onDeleteBlock(block.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl bg-slate-100/70 p-4 text-sm text-slate-500 dark:bg-slate-950/40 dark:text-slate-400">
                No events planned for this day yet.
              </div>
            )}
          </div>
        </section>
      </aside>
    </div>
  );
}
