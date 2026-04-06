import { useMemo } from "react";
import type { HeatmapCell } from "../../types";

const intensityClasses = [
  "bg-slate-200 dark:bg-slate-800",
  "bg-emerald-200 dark:bg-emerald-950",
  "bg-emerald-300 dark:bg-emerald-800",
  "bg-emerald-500 dark:bg-emerald-600",
  "bg-emerald-700 dark:bg-emerald-400"
];

const weekdayLabels = ["Mon", "", "Wed", "", "Fri", "", ""];

type HeatmapGridProps = {
  data: HeatmapCell[];
};

export function HeatmapGrid({ data }: HeatmapGridProps) {
  const { columns, monthMarkers } = useMemo(() => {
    const weeks: HeatmapCell[][] = [];

    for (let index = 0; index < data.length; index += 7) {
      weeks.push(data.slice(index, index + 7));
    }

    let previousMonthMarkerIndex = -8;
    const markers = weeks.map((week, index) => {
      const firstDay = week[0];
      if (!firstDay) {
        return "";
      }

      const date = new Date(firstDay.date);
      const month = date.toLocaleDateString([], { month: "short" });
      const previousWeek = weeks[index - 1]?.[0];

      if (!previousWeek) {
        previousMonthMarkerIndex = index;
        return month;
      }

      const previousMonth = new Date(previousWeek.date).toLocaleDateString([], { month: "short" });
      if (previousMonth === month || index - previousMonthMarkerIndex < 4) {
        return "";
      }

      previousMonthMarkerIndex = index;
      return month;
    });

    return {
      columns: weeks,
      monthMarkers: markers
        .map((label, index) => ({ label, index }))
        .filter((marker) => Boolean(marker.label))
    };
  }, [data]);

  const gridWidthRem = columns.length * 1 + Math.max(0, columns.length - 1) * 0.5;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[760px]">
        <div className="mb-3 flex gap-3">
          <div className="w-7 shrink-0" />
          <div className="relative h-4" style={{ width: `${gridWidthRem}rem` }}>
            {monthMarkers.map((marker) => (
              <span
                key={`${marker.label}-${marker.index}`}
                className="absolute top-0 text-[10px] font-medium uppercase tracking-[0.08em] text-slate-400"
                style={{ left: `${marker.index * 1.5}rem` }}
              >
                {marker.label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <div className="grid grid-rows-7 gap-2 pt-1 text-[11px] text-slate-400">
            {weekdayLabels.map((label, index) => (
              <span key={`${label}-${index}`} className="h-4 leading-4">
                {label}
              </span>
            ))}
          </div>

          <div className="grid grid-flow-col grid-rows-7 gap-2">
            {columns.map((week, columnIndex) =>
              week.map((cell) => (
                <div
                  key={`${columnIndex}-${cell.date}`}
                  className={`h-4 w-4 rounded-[4px] transition-transform hover:scale-110 ${intensityClasses[cell.intensity]}`}
                  title={`${cell.date} • ${cell.minutes || 0} min`}
                />
              ))
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2 text-[11px] text-slate-400">
          <span>Less</span>
          {intensityClasses.map((className, index) => (
            <span key={index} className={`h-3.5 w-3.5 rounded-[4px] ${className}`} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
