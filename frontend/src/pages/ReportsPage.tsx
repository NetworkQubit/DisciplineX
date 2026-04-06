import { SubjectPieChart } from "../components/charts/SubjectPieChart";
import { StudyTrendChart } from "../components/charts/StudyTrendChart";
import { formatMinutes } from "../lib/utils";
import type { WorkspaceData } from "../types";

type ReportsPageProps = {
  workspace: WorkspaceData;
};

export function ReportsPage({ workspace }: ReportsPageProps) {
  const favoriteSubjectLine = workspace.analytics.focusDna.favoriteSubjects[0]
    ? `${workspace.analytics.focusDna.favoriteSubjects[0].name} leads your focus map.`
    : "No favorite subject mapped yet.";

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="space-y-6">
        <article className="rounded-[32px] border border-white/30 bg-white/80 p-5 shadow-glow backdrop-blur sm:p-6 dark:border-white/10 dark:bg-slate-900/70">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Weekly Report</p>
              <h3 className="mt-2 text-2xl font-semibold">Performance Summary</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Best day and weakest day, distilled into next steps.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/50">
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Hours</p>
              <p className="mt-2 text-2xl font-semibold">{workspace.analytics.weeklyReport.totalHours}h</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/50">
              <p className="text-sm text-slate-500 dark:text-slate-400">Best Day</p>
              <p className="mt-2 text-2xl font-semibold">{workspace.analytics.weeklyReport.bestDayLabel}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/50">
              <p className="text-sm text-slate-500 dark:text-slate-400">Weakest Day</p>
              <p className="mt-2 text-2xl font-semibold">{workspace.analytics.weeklyReport.weakestDayLabel}</p>
            </div>
          </div>

          <div className="mt-5 rounded-[28px] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/50">
            <StudyTrendChart data={workspace.analytics.weeklyReport.days} />
          </div>

          <div className="mt-5 grid gap-3">
            {workspace.analytics.weeklyReport.suggestions.map((suggestion) => (
              <div key={suggestion} className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
                {suggestion}
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="space-y-6">
        <article className="rounded-[32px] border border-white/30 bg-white/80 p-5 shadow-glow backdrop-blur sm:p-6 dark:border-white/10 dark:bg-slate-900/70">
          <p className="text-xs uppercase tracking-[0.24em] text-teal-600 dark:text-teal-300">Focus DNA</p>
          <h3 className="mt-2 text-2xl font-semibold">{workspace.analytics.focusDna.title}</h3>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{workspace.analytics.focusDna.summary}</p>

          <div className="mt-5 rounded-[28px] bg-[linear-gradient(135deg,_rgba(20,184,166,0.18),_rgba(15,23,42,0.08))] p-[1px] dark:bg-[linear-gradient(135deg,_rgba(45,212,191,0.32),_rgba(15,23,42,0.12))]">
            <div className="rounded-[calc(1.75rem-1px)] bg-white/95 p-5 dark:bg-slate-950/90">
              <p className="text-lg font-medium leading-relaxed">{workspace.analytics.focusDna.quote}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/50">
              <p className="text-sm text-slate-500 dark:text-slate-400">Peak Focus Window</p>
              <p className="mt-2 text-xl font-semibold">{workspace.analytics.focusDna.bestTimeOfDay}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/50">
              <p className="text-sm text-slate-500 dark:text-slate-400">Average Focus Duration</p>
              <p className="mt-2 text-xl font-semibold">{workspace.analytics.focusDna.averageFocusMinutes} min</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/50">
              <p className="text-sm text-slate-500 dark:text-slate-400">Favorite Subjects</p>
              <p className="mt-2 text-xl font-semibold">{favoriteSubjectLine}</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {workspace.analytics.focusDna.favoriteSubjects.map((subject) => (
              <div key={subject.name} className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/50">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: subject.color }} />
                  <span className="font-medium">{subject.name}</span>
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400">{formatMinutes(subject.minutes)}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[32px] border border-white/30 bg-white/80 p-5 shadow-glow backdrop-blur sm:p-6 dark:border-white/10 dark:bg-slate-900/70">
          <h3 className="text-xl font-semibold">Subject Focus Distribution</h3>
          <SubjectPieChart data={workspace.analytics.subjectBreakdown} />
        </article>
      </section>
    </div>
  );
}
