import clsx from "clsx";

export function cn(...values: Array<string | false | null | undefined>) {
  return clsx(values);
}

export function formatMinutes(value: number) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  if (!hours) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

export function formatDuration(seconds: number) {
  const totalMinutes = Math.max(0, Math.round(seconds / 60));
  return formatMinutes(totalMinutes);
}

export function formatMode(mode: "standard" | "pomodoro" | "focus") {
  if (mode === "pomodoro") {
    return "Pomodoro";
  }

  if (mode === "focus") {
    return "Focus";
  }

  return "Standard";
}
