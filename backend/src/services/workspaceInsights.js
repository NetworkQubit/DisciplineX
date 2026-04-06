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

function formatDayLabel(date) {
  return date.toLocaleDateString([], { weekday: "short" });
}

function buildWeeklyReport(finishedSessions, now) {
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const day = startOfDay(new Date(now));
    day.setDate(now.getDate() - (6 - index));
    return day;
  });

  const dailyBuckets = weekDays.map((day) => {
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);
    const minutes = Math.round(
      finishedSessions
        .filter((session) => {
          const startedAt = new Date(session.startedAt);
          return startedAt >= day && startedAt < nextDay;
        })
        .reduce((sum, session) => sum + session.durationSeconds, 0) / 60
    );

    return {
      label: formatDayLabel(day),
      minutes
    };
  });

  const sortedByMinutes = [...dailyBuckets].sort((a, b) => b.minutes - a.minutes);
  const totalMinutes = dailyBuckets.reduce((sum, day) => sum + day.minutes, 0);
  const bestDay = sortedByMinutes[0];
  const weakestDay = [...sortedByMinutes].reverse()[0];
  const completedDays = dailyBuckets.filter((day) => day.minutes >= 45).length;
  const suggestions = [];

  if (totalMinutes === 0) {
    suggestions.push("Start with two short focus sessions this week to generate a clearer rhythm.");
  } else {
    if (completedDays < 4) {
      suggestions.push("Aim for at least four solid focus days to stabilize your weekly rhythm.");
    }

    if (bestDay && weakestDay && bestDay.label !== weakestDay.label) {
      suggestions.push(`Protect ${bestDay.label} for deep work and use ${weakestDay.label} for lighter review blocks.`);
    }

    if (totalMinutes < 600) {
      suggestions.push("Your weekly volume is still light, so add one extra 60-minute block on your calmest day.");
    }
  }

  return {
    totalHours: Number((totalMinutes / 60).toFixed(1)),
    bestDayLabel: bestDay?.label || "Not enough data",
    weakestDayLabel: weakestDay?.label || "Not enough data",
    suggestions: suggestions.slice(0, 3),
    days: dailyBuckets
  };
}

function buildFocusDna({ finishedSessions, bestStudyTimeLabel, subjectMap }) {
  if (!finishedSessions.length) {
    return {
      title: "Unmapped Focus Explorer",
      summary: "Log a few sessions and DisciplineX will map your natural focus style.",
      bestTimeOfDay: "Not enough data",
      averageFocusMinutes: 0,
      favoriteSubjects: [],
      quote: "Your focus signature appears once your sessions start stacking up."
    };
  }

  const averageFocusMinutes = Math.round(
    finishedSessions.reduce((sum, session) => sum + session.durationSeconds, 0) / finishedSessions.length / 60
  );

  const hourBuckets = new Map();

  for (const session of finishedSessions) {
    const hour = new Date(session.startedAt).getHours();
    const bucket =
      hour < 6 ? "late-night" : hour < 12 ? "morning" : hour < 18 ? "afternoon" : "night";
    hourBuckets.set(bucket, (hourBuckets.get(bucket) || 0) + session.durationSeconds);
  }

  const dominantBucket = [...hourBuckets.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const dominantSessionMinutes = Math.max(
    ...finishedSessions.map((session) => Math.round(session.durationSeconds / 60))
  );

  const dnaByBucket = {
    morning: {
      title: "Morning Precision Builder",
      quote: "You warm up early and do your cleanest thinking before the day gets noisy."
    },
    afternoon: {
      title: "Afternoon Momentum Crafter",
      quote: "You build pressure through the day and hit your stride once momentum is on your side."
    },
    night: {
      title: "Night Deep Worker",
      quote: "Your best focus appears after the world quiets down and distractions fade."
    },
    "late-night": {
      title: "Midnight Tunnel Thinker",
      quote: "You lean into long, immersive study windows when everything else powers down."
    }
  };

  const favoriteSubjects = Array.from(subjectMap.values())
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 3)
    .map((entry) => ({
      name: entry.name,
      minutes: entry.minutes,
      color: entry.color
    }));

  const profile = dnaByBucket[dominantBucket] || {
    title: "Balanced Focus Builder",
    quote: "Your focus is flexible, which means you can adapt well once your study blocks are protected."
  };

  return {
    title: profile.title,
    summary: `Best time: ${bestStudyTimeLabel}. Average session: ${averageFocusMinutes} min. Longest recent push: ${dominantSessionMinutes} min.`,
    bestTimeOfDay: bestStudyTimeLabel,
    averageFocusMinutes,
    favoriteSubjects,
    quote: profile.quote
  };
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

  const bestStudyTimeLabel = typeof bestStudyHour === "number" ? formatHourLabel(bestStudyHour) : "Not enough data";
  const maxHeatmapSeconds = Math.max(...heatmapMap.values(), 0);

  return {
    overview: {
      todayMinutes: aggregateMinutes(today),
      weekMinutes: aggregateMinutes(weekStart),
      monthMinutes: aggregateMinutes(monthStart),
      focusScore: Math.min(100, Math.round((aggregateMinutes(weekStart) / (25 * 7)) * 100)),
      productivityScore,
      bestStudyTimeLabel
    },
    heatmap: Array.from({ length: 126 }, (_, index) => {
      const day = startOfDay(new Date(now));
      day.setDate(now.getDate() - (125 - index));
      const date = day.toISOString().slice(0, 10);
      const seconds = heatmapMap.get(date) || 0;
      const normalizedIntensity =
        maxHeatmapSeconds > 0 ? Math.min(4, Math.ceil((seconds / maxHeatmapSeconds) * 4)) : 0;

      return {
        date,
        minutes: Math.round(seconds / 60),
        intensity: seconds > 0 ? Math.max(1, normalizedIntensity) : 0
      };
    }),
    subjectBreakdown: Array.from(subjectMap.values()),
    dailyTrend,
    weeklyTrend,
    monthlyTrend,
    weeklyReport: buildWeeklyReport(finishedSessions, now),
    focusDna: buildFocusDna({
      finishedSessions,
      bestStudyTimeLabel,
      subjectMap
    })
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
