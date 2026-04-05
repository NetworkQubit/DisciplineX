import type { MetricCard } from "../../types";

type MetricCardsProps = {
  metrics: MetricCard[];
};

export function MetricCards({ metrics }: MetricCardsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <article
          key={metric.label}
          className="rounded-[28px] border border-white/30 bg-white/80 p-5 shadow-glow backdrop-blur dark:border-white/10 dark:bg-slate-900/70"
        >
          <p className="text-sm text-slate-500 dark:text-slate-400">{metric.label}</p>
          <h3 className="mt-4 text-2xl font-semibold sm:text-3xl">{metric.value}</h3>
          <p className="mt-2 text-sm text-teal-600 dark:text-teal-300">{metric.trend}</p>
        </article>
      ))}
    </section>
  );
}
