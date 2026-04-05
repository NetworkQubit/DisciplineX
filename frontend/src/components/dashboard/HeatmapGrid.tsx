import type { HeatmapCell } from "../../types";

const intensityClasses = [
  "bg-slate-200 dark:bg-slate-800",
  "bg-teal-100 dark:bg-teal-950",
  "bg-teal-200 dark:bg-teal-800",
  "bg-teal-400 dark:bg-teal-600",
  "bg-teal-500 dark:bg-teal-400"
];

type HeatmapGridProps = {
  data: HeatmapCell[];
};

export function HeatmapGrid({ data }: HeatmapGridProps) {
  return (
    <div className="grid grid-flow-col grid-rows-7 gap-1.5 overflow-x-auto pb-2 sm:gap-2">
      {data.map((cell) => (
        <div
          key={cell.date}
          className={`h-3.5 w-3.5 rounded-[6px] sm:h-4 sm:w-4 ${intensityClasses[cell.intensity]}`}
          title={cell.date}
        />
      ))}
    </div>
  );
}
