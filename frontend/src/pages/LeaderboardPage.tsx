import { Trophy } from "lucide-react";
import { formatMinutes } from "../lib/utils";
import type { WorkspaceData } from "../types";

type LeaderboardPageProps = {
  workspace: WorkspaceData;
};

const ringConfig = [
  { label: "TODAY", color: "#f97316", inset: 0 },
  { label: "WEEK", color: "#3b82f6", inset: 14 },
  { label: "MONTH", color: "#a855f7", inset: 28 },
  { label: "ALL TIME", color: "#22c55e", inset: 42 }
] as const;

export function LeaderboardPage({ workspace }: LeaderboardPageProps) {
  const today = workspace.analytics.overview.todayMinutes;
  const week = workspace.analytics.overview.weekMinutes;
  const month = workspace.analytics.overview.monthMinutes;
  const allTime = Math.round(workspace.profile.totalStudySeconds / 60);
  const ringRatios = [
    allTime > 0 ? Math.min(today / allTime, 1) : 0,
    allTime > 0 ? Math.min(week / allTime, 1) : 0,
    allTime > 0 ? Math.min(month / allTime, 1) : 0,
    allTime > 0 ? 1 : 0
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-[#040a1f] p-5 shadow-glow backdrop-blur sm:p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-orange-500/15 p-2 text-orange-300">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Leaderboard</h3>
            <p className="text-sm text-slate-400">See who is leading in hours and points</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[28px] border border-white/10 bg-slate-950/45 p-6">
            <p className="mb-4 text-sm font-medium text-slate-300">Your Stats</p>
            <div className="flex items-center justify-center">
              <div className="relative h-56 w-56">
                {ringConfig.map((ring, index) => (
                  <div key={ring.label} className="absolute rounded-full" style={{ inset: `${ring.inset}px` }}>
                    <div
                      className="h-full w-full rounded-full"
                      style={{
                        background: `conic-gradient(${ring.color} ${Math.round(ringRatios[index] * 360)}deg, rgba(100,116,139,0.4) 0deg)`
                      }}
                    />
                    <div className="absolute inset-[6px] rounded-full bg-[#060b20]" />
                  </div>
                ))}
                <div className="absolute inset-[58px] rounded-full bg-[#030712]" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-4xl font-bold text-orange-300">{today}m</p>
                  <p className="text-xs tracking-[0.2em] text-slate-400">TODAY</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <article className="rounded-3xl border border-orange-400/20 bg-gradient-to-br from-orange-500/18 to-slate-900 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-orange-300/90">Today</p>
              <p className="mt-2 text-3xl font-semibold text-white">{today}m</p>
            </article>
            <article className="rounded-3xl border border-sky-400/20 bg-gradient-to-br from-sky-500/18 to-slate-900 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-sky-300/90">Week</p>
              <p className="mt-2 text-3xl font-semibold text-white">{formatMinutes(week)}</p>
            </article>
            <article className="rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-500/18 to-slate-900 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-violet-300/90">Month</p>
              <p className="mt-2 text-3xl font-semibold text-white">{formatMinutes(month)}</p>
            </article>
            <article className="rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/18 to-slate-900 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/90">All Time</p>
              <p className="mt-2 text-3xl font-semibold text-white">{formatMinutes(allTime)}</p>
            </article>
          </div>
        </div>

      </section>
    </div>
  );
}
