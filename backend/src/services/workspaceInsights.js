import crypto from "crypto";

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatHourLabel(hour) {
  const start = new Date();
  start.setHours(hour, 0, 0, 0);
  const end = new Date(start);
  end.setHours(hour + 1, 0, 0, 0);
  return `${start.toLocaleTimeString([], { hour: "numeric" })} - ${end.toLocaleTimeString([], { hour: "numeric" })}`;
}

export function buildWorkspaceAnalytics({ sessions, tasks, studyGoalMinutes, streak = 0 }) {
  const finishedSessions = sessions.filter((session) => session.endedAt);
  const now = new Date();
  const today = startOfDay(now);
  const weekStart = startOfDay(new Date(now));
  weekStart.setDate(now.getDate() - 6);
  const monthStart = startOfDay(new Date(now));
  monthStart.setDate(now.getDate() - 29);

  const aggregateMinutes = (fromDate) =>
    Math.round(
      finishedSessions
        .filter((session) => new Date(session.startedAt) >= fromDate)
        .reduce((sum, session) => sum + session.durationSeconds, 0) / 60
    );

  const subjectMap = new Map();
  const heatmapMap = new Map();
  const bestHourMap = new Map();

  for (const session of finishedSessions) {
    const dateKey = new Date(session.startedAt).toISOString().slice(0, 10);
    heatmapMap.set(dateKey, (heatmapMap.get(dateKey) || 0) + session.durationSeconds);

    const name = session.subjectName || "General Focus";
    const color = session.subjectColor || "#64748B";
    const subjectEntry = subjectMap.get(name) || { name, color, minutes: 0 };
    subjectEntry.minutes += Math.round(session.durationSeconds / 60);
    subjectMap.set(name, subjectEntry);

    const hour = new Date(session.startedAt).getHours();
    bestHourMap.set(hour, (bestHourMap.get(hour) || 0) + session.durationSeconds);
  }

  const hasRecordedActivity = finishedSessions.length > 0 || tasks.length > 0;
  const completionRate = tasks.length
    ? tasks.filter((task) => task.status === "done").length / tasks.length
    : 0;
  const activeDays = new Set(
    finishedSessions.map((session) => startOfDay(new Date(session.startedAt)).toISOString())
  ).size;
  const consistencyScore = Math.min(1, activeDays / 7);
  const goalScore = Math.min(1, aggregateMinutes(weekStart) / (studyGoalMinutes * 7 || 1));
  const streakScore = Math.min(1, streak / 7);

  const productivityScore = hasRecordedActivity
    ? Math.round(consistencyScore * 40 + completionRate * 30 + goalScore * 20 + streakScore * 10)
    : 0;

  const bestStudyHour = [...bestHourMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  const dailyTrend = Array.from({ length: 14 }, (_, index) => {
    const day = startOfDay(new Date(now));
    day.setDate(now.getDate() - (13 - index));
    const key = day.toISOString().slice(0, 10);
    return {
      label: day.toLocaleDateString([], { month: "short", day: "numeric" }),
      minutes: Math.round((heatmapMap.get(key) || 0) / 60)
    };
  });

  const weeklyTrend = Array.from({ length: 8 }, (_, index) => {
    const rangeStart = startOfDay(new Date(now));
    rangeStart.setDate(now.getDate() - (7 * (7 - index) + 6));
    const rangeEnd = new Date(rangeStart);
    rangeEnd.setDate(rangeStart.getDate() + 7);
    return {
      label: `W${index + 1}`,
      minutes: Math.round(
        finishedSessions
          .filter((session) => {
            const startedAt = new Date(session.startedAt);
            return startedAt >= rangeStart && startedAt < rangeEnd;
          })
          .reduce((sum, session) => sum + session.durationSeconds, 0) / 60
      )
    };
  });

  const monthlyTrend = Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const monthStartDate = startOfDay(monthDate);
    const monthEndDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
    return {
      label: monthDate.toLocaleDateString([], { month: "short" }),
      minutes: Math.round(
        finishedSessions
          .filter((session) => {
            const startedAt = new Date(session.startedAt);
            return startedAt >= monthStartDate && startedAt < monthEndDate;
          })
          .reduce((sum, session) => sum + session.durationSeconds, 0) / 60
      )
    };
  });

  return {
    overview: {
      todayMinutes: aggregateMinutes(today),
      weekMinutes: aggregateMinutes(weekStart),
      monthMinutes: aggregateMinutes(monthStart),
      focusScore: Math.min(100, Math.round((aggregateMinutes(weekStart) / (25 * 7)) * 100)),
      productivityScore,
      bestStudyTimeLabel: typeof bestStudyHour === "number" ? formatHourLabel(bestStudyHour) : "Not enough data"
    },
    heatmap: Array.from(heatmapMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, seconds]) => ({
        date,
        minutes: Math.round(seconds / 60),
        intensity: Math.min(4, Math.ceil(seconds / 3600))
      })),
    subjectBreakdown: Array.from(subjectMap.values()),
    dailyTrend,
    weeklyTrend,
    monthlyTrend
  };
}

function overlaps(block, startAt, endAt) {
  return new Date(block.startAt) < endAt && new Date(block.endAt) > startAt;
}

export function buildAutoSchedule({ tasks, blocks, subjects }) {
  const incompleteTasks = tasks.filter((task) => task.status !== "done");
  const scheduledBlocks = [];
  const existingBlocks = [...blocks];
  const subjectMap = new Map(subjects.map((subject) => [subject.id, subject]));

  for (const task of incompleteTasks.slice(0, 6)) {
    let scheduled = false;

    for (let dayOffset = 1; dayOffset <= 7 && !scheduled; dayOffset += 1) {
      for (let hour = 8; hour <= 19 && !scheduled; hour += 2) {
        const startAt = new Date();
        startAt.setDate(startAt.getDate() + dayOffset);
        startAt.setHours(hour, 0, 0, 0);
        const endAt = new Date(startAt);
        endAt.setHours(hour + 1, 30, 0, 0);

        const collision = existingBlocks.some((block) => overlaps(block, startAt, endAt));

        if (!collision) {
          const subject = task.subjectId ? subjectMap.get(task.subjectId) : null;
          const block = {
            title: task.title,
            type: "task",
            source: "auto",
            startAt: startAt.toISOString(),
            endAt: endAt.toISOString(),
            subjectId: task.subjectId,
            subjectName: subject?.name,
            subjectColor: subject?.color,
            taskId: task.id
          };

          existingBlocks.push(block);
          scheduledBlocks.push(block);
          scheduled = true;
        }
      }
    }
  }

  return scheduledBlocks;
}

export function buildRecurringCalendarBlocks(payload) {
  const startAt = new Date(payload.startAt);
  const endAt = new Date(payload.endAt);
  const rawRecurrence = payload.recurrence || {};
  const frequency = rawRecurrence.frequency === "daily" || rawRecurrence.frequency === "weekly"
    ? rawRecurrence.frequency
    : "none";
  const count = Math.max(1, Math.min(Number(rawRecurrence.count) || 1, 30));
  const interval = Math.max(1, Math.min(Number(rawRecurrence.interval) || 1, 12));
  const seriesId = frequency === "none" ? null : crypto.randomUUID();
  const blocks = [];

  for (let index = 0; index < count; index += 1) {
    if (index > 0 && frequency === "none") {
      break;
    }

    const nextStartAt = new Date(startAt);
    const nextEndAt = new Date(endAt);

    if (frequency === "daily") {
      nextStartAt.setDate(nextStartAt.getDate() + index * interval);
      nextEndAt.setDate(nextEndAt.getDate() + index * interval);
    }

    if (frequency === "weekly") {
      nextStartAt.setDate(nextStartAt.getDate() + index * interval * 7);
      nextEndAt.setDate(nextEndAt.getDate() + index * interval * 7);
    }

    blocks.push({
      title: payload.title,
      type: payload.type || "study",
      source: payload.source || "manual",
      startAt: nextStartAt.toISOString(),
      endAt: nextEndAt.toISOString(),
      subjectId: payload.subjectId,
      recurrence:
        frequency === "none"
          ? null
          : {
              frequency,
              interval,
              count,
              seriesId
            }
    });
  }

  return blocks;
}
