import StudySession from "../models/StudySession.js";

function startOfDay(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export async function getOverview(userId) {
  const today = startOfDay(new Date());
  const weekStart = startOfDay(new Date(today));
  weekStart.setDate(today.getDate() - 6);
  const monthStart = startOfDay(new Date(today));
  monthStart.setDate(today.getDate() - 29);

  const [todayStats, weekStats, monthStats] = await Promise.all([
    aggregateDuration(userId, today),
    aggregateDuration(userId, weekStart),
    aggregateDuration(userId, monthStart)
  ]);

  return {
    todayMinutes: Math.round(todayStats / 60),
    weekMinutes: Math.round(weekStats / 60),
    monthMinutes: Math.round(monthStats / 60),
    focusScore: Math.min(100, Math.round((weekStats / (25 * 60 * 7)) * 100))
  };
}

export async function getHeatmap(userId) {
  const start = startOfDay(new Date());
  start.setDate(start.getDate() - 119);

  const raw = await StudySession.aggregate([
    {
      $match: {
        user: userId,
        startedAt: { $gte: start }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$startedAt" }
        },
        seconds: { $sum: "$durationSeconds" }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return raw.map((entry) => ({
    date: entry._id,
    minutes: Math.round(entry.seconds / 60),
    intensity: Math.min(4, Math.ceil(entry.seconds / 3600))
  }));
}

export async function getSubjectBreakdown(userId) {
  return StudySession.aggregate([
    {
      $match: {
        user: userId,
        endedAt: { $ne: null }
      }
    },
    {
      $lookup: {
        from: "subjects",
        localField: "subject",
        foreignField: "_id",
        as: "subjectInfo"
      }
    },
    {
      $unwind: {
        path: "$subjectInfo",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $group: {
        _id: "$subjectInfo.name",
        color: { $first: "$subjectInfo.color" },
        seconds: { $sum: "$durationSeconds" }
      }
    },
    {
      $project: {
        _id: 0,
        name: { $ifNull: ["$_id", "General Focus"] },
        color: { $ifNull: ["$color", "#64748B"] },
        minutes: { $round: [{ $divide: ["$seconds", 60] }, 0] }
      }
    }
  ]);
}

async function aggregateDuration(userId, fromDate) {
  const result = await StudySession.aggregate([
    {
      $match: {
        user: userId,
        startedAt: { $gte: fromDate },
        endedAt: { $ne: null }
      }
    },
    {
      $group: {
        _id: null,
        seconds: { $sum: "$durationSeconds" }
      }
    }
  ]);

  return result[0]?.seconds || 0;
}
