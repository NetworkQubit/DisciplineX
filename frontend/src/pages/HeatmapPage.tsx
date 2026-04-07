import { HeatmapGrid } from "../components/dashboard/HeatmapGrid";
import type { WorkspaceData } from "../types";

type HeatmapPageProps = {
  workspace: WorkspaceData;
};

export function HeatmapPage({ workspace }: HeatmapPageProps) {
  const cells = workspace.analytics.heatmap;
  const totalMinutes = cells.reduce((sum, cell) => sum + (cell.minutes || 0), 0);
  const activeDays = cells.filter((cell) => (cell.minutes || 0) > 0);
  const busiestDay = activeDays.reduce(
    (max, cell) => ((cell.minutes || 0) > (max.minutes || 0) ? cell : max),
    activeDays[0] || { date: "-", minutes: 0, intensity: 0 }
  );

  let currentStreak = 0;
  let longestStreak = 0;
  let running = 0;
  for (const cell of cells) {
    if ((cell.minutes || 0) > 0) {
      running += 1;
      longestStreak = Math.max(longestStreak, running);
    } else {
      running = 0;
    }
  }
  for (let index = cells.length - 1; index >= 0; index -= 1) {
    if ((cells[index].minutes || 0) > 0) {
      currentStreak += 1;
    } else {
      break;
    }
  }

  const formattedBusiestDate =
    busiestDay.date === "-"
      ? "-"
      : new Date(busiestDay.date).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="space-y-6">
      <section className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{activeDays.length} active days in the last year</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{totalMinutes} total focused minutes</p>
          </div>
          <p className="text-xs text-slate-400">Contribution settings</p>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-slate-950/60">
            <p className="text-sm text-slate-500 dark:text-slate-400">Busiest day</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{busiestDay.minutes || 0} min</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{formattedBusiestDate}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-slate-950/60">
            <p className="text-sm text-slate-500 dark:text-slate-400">Longest streak</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{longestStreak} days</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-slate-950/60">
            <p className="text-sm text-slate-500 dark:text-slate-400">Current streak</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{currentStreak} days</p>
          </article>
        </div>

        <HeatmapGrid data={workspace.analytics.heatmap} />
      </section>
    </div>
  );
}
