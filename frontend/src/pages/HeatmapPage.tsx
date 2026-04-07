import { HeatmapGrid } from "../components/dashboard/HeatmapGrid";
import type { WorkspaceData } from "../types";

type HeatmapPageProps = {
  workspace: WorkspaceData;
};

export function HeatmapPage({ workspace }: HeatmapPageProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/30 bg-white/80 p-5 shadow-glow backdrop-blur sm:p-6 dark:border-white/10 dark:bg-slate-900/70">
        <div className="mb-5">
          <h3 className="text-xl font-semibold">Consistency Heatmap</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">A dedicated year view of your daily focus consistency.</p>
        </div>
        <HeatmapGrid data={workspace.analytics.heatmap} />
      </section>
    </div>
  );
}
