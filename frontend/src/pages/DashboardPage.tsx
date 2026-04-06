import { SubjectPieChart } from "../components/charts/SubjectPieChart";
import { StudyTrendChart } from "../components/charts/StudyTrendChart";
import { HeatmapGrid } from "../components/dashboard/HeatmapGrid";
import { MetricCards } from "../components/dashboard/MetricCards";
import { formatDuration, formatMinutes } from "../lib/utils";
import type { MetricCard, WorkspaceData } from "../types";

type DashboardPageProps = {
  workspace: WorkspaceData;
};

export function DashboardPage({ workspace }: DashboardPageProps) {
  const desktopMetrics: MetricCard[] = [
    {
      label: "Today",
      value: formatMinutes(workspace.analytics.overview.todayMinutes),
      trend: "Tracked from your stored sessions"
    },
    {
      label: "This Week",
      value: formatMinutes(workspace.analytics.overview.weekMinutes),
      trend: "Your weekly desktop focus total"
    },
    {
      label: "Productivity",
      value: `${workspace.analytics.overview.productivityScore}%`,
      trend: `Best time: ${workspace.analytics.overview.bestStudyTimeLabel}`
    },
    {
      label: "This Month",
      value: formatMinutes(workspace.analytics.overview.monthMinutes),
      trend: `${workspace.calendarBlocks.length} calendar blocks planned`
    }
  ];

  return (
    <div className="space-y-6">
      <MetricCards metrics={desktopMetrics} />

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <section className="min-w-0 rounded-[32px] border border-white/30 bg-white/80 p-5 shadow-glow backdrop-blur sm:p-6 dark:border-white/10 dark:bg-slate-900/70">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-xl font-semibold">Focus Timeline</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Rolling view of your last 14 days of focus time
              </p>
            </div>
            <span className="w-fit rounded-full bg-slate-950 px-3 py-1 text-xs font-medium text-white">
              Score: {workspace.analytics.overview.focusScore}
            </span>
          </div>
          <StudyTrendChart data={workspace.analytics.dailyTrend} />
        </section>

        <section className="rounded-[32px] border border-white/30 bg-white/80 p-5 shadow-glow backdrop-blur sm:p-6 dark:border-white/10 dark:bg-slate-900/70">
          <h3 className="text-xl font-semibold">Subject Focus Distribution</h3>
          <SubjectPieChart data={workspace.analytics.subjectBreakdown} />
          <div className="space-y-3">
            {workspace.subjects.map((subject) => (
              <div key={subject.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: subject.color }} />
                  <span className="truncate">{subject.name}</span>
                </div>
                <span className="text-slate-500 dark:text-slate-400">
                  {subject.studiedMinutes || 0}/{subject.goalMinutes} min
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <section className="space-y-6">
          <article className="rounded-[32px] border border-white/30 bg-white/80 p-5 shadow-glow backdrop-blur sm:p-6 dark:border-white/10 dark:bg-slate-900/70">
            <h3 className="text-xl font-semibold">Advanced Analytics</h3>
            <div className="mt-5 grid gap-3">
              <div className="rounded-3xl border border-white/30 bg-white/60 p-4 dark:border-white/10 dark:bg-slate-950/40">
                <p className="text-sm text-slate-500 dark:text-slate-400">Best Study Time</p>
                <p className="mt-2 text-2xl font-semibold">{workspace.analytics.overview.bestStudyTimeLabel}</p>
              </div>
              <div className="rounded-3xl border border-white/30 bg-white/60 p-4 dark:border-white/10 dark:bg-slate-950/40">
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Recorded Time</p>
                <p className="mt-2 text-2xl font-semibold">{formatDuration(workspace.profile.totalStudySeconds)}</p>
              </div>
              <div className="rounded-3xl border border-white/30 bg-white/60 p-4 dark:border-white/10 dark:bg-slate-950/40">
                <p className="text-sm text-slate-500 dark:text-slate-400">Current Streak</p>
                <p className="mt-2 text-2xl font-semibold">{workspace.profile.streak} days</p>
              </div>
            </div>
          </article>

          <article className="rounded-[32px] border border-white/30 bg-white/80 p-5 shadow-glow backdrop-blur sm:p-6 dark:border-white/10 dark:bg-slate-900/70">
            <div className="rounded-[28px] bg-[linear-gradient(135deg,_rgba(253,224,71,0.18),_rgba(45,212,191,0.18),_rgba(125,211,252,0.18))] p-[1px] dark:bg-[linear-gradient(135deg,_rgba(45,212,191,0.28),_rgba(125,211,252,0.2),_rgba(251,191,36,0.16))]">
              <div className="rounded-[calc(1.75rem-1px)] bg-white/92 p-5 dark:bg-slate-950/88 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-teal-600 dark:text-teal-300">Consistency Area</p>
                    <h3 className="mt-2 text-xl font-semibold">Momentum Radar</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      A richer snapshot of your rhythm, output, and long-range steadiness.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-950 px-4 py-3 text-white dark:bg-white dark:text-slate-950">
                    <p className="text-xs uppercase tracking-[0.2em] opacity-70">Productivity</p>
                    <p className="mt-1 text-2xl font-semibold">Score: {workspace.analytics.overview.productivityScore}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <HeatmapGrid data={workspace.analytics.heatmap} />
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <div className="rounded-3xl border border-white/50 bg-gradient-to-br from-amber-50 to-white p-4 dark:border-white/10 dark:bg-gradient-to-br dark:from-white/5 dark:to-transparent">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Best Study Window</p>
                    <p className="mt-2 text-xl font-semibold">{workspace.analytics.overview.bestStudyTimeLabel}</p>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      Your focus tends to peak most reliably here.
                    </p>
                  </div>
                  <div className="rounded-3xl border border-white/50 bg-gradient-to-br from-emerald-50 to-white p-4 dark:border-white/10 dark:bg-gradient-to-br dark:from-white/5 dark:to-transparent">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Monthly Arc</p>
                    <p className="mt-2 text-xl font-semibold">{formatMinutes(workspace.analytics.overview.monthMinutes)}</p>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      Total focused time accumulated this month.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="rounded-3xl border border-white/50 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-950/40">
                <p className="text-sm text-slate-500 dark:text-slate-400">Daily</p>
                <p className="mt-2 text-xl font-semibold">{formatMinutes(workspace.analytics.overview.todayMinutes)}</p>
              </div>
              <div className="rounded-3xl border border-white/50 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-950/40">
                <p className="text-sm text-slate-500 dark:text-slate-400">Weekly</p>
                <p className="mt-2 text-xl font-semibold">{formatMinutes(workspace.analytics.overview.weekMinutes)}</p>
              </div>
              <div className="rounded-3xl border border-white/50 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-950/40">
                <p className="text-sm text-slate-500 dark:text-slate-400">Score</p>
                <p className="mt-2 text-xl font-semibold">Score: {workspace.analytics.overview.focusScore}</p>
              </div>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
