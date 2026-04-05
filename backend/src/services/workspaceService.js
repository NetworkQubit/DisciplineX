import Subject from "../models/Subject.js";
import Task from "../models/Task.js";
import StudySession from "../models/StudySession.js";

export async function seedWorkspaceForUser(userId) {
  const subjects = await Subject.insertMany([
    { user: userId, name: "Mathematics", color: "#14B8A6", goalMinutes: 120, icon: "Sigma" },
    { user: userId, name: "Physics", color: "#FB7185", goalMinutes: 90, icon: "Atom" },
    { user: userId, name: "Programming", color: "#F59E0B", goalMinutes: 150, icon: "Code2" }
  ]);

  await Task.insertMany([
    {
      user: userId,
      subject: subjects[0]._id,
      title: "Solve 20 differentiation problems",
      priority: "high",
      position: 0
    },
    {
      user: userId,
      subject: subjects[1]._id,
      title: "Review thermodynamics notes",
      priority: "medium",
      position: 1
    },
    {
      user: userId,
      subject: subjects[2]._id,
      title: "Build timer screen interactions",
      priority: "high",
      position: 2
    }
  ]);

  const now = new Date();
  const sessionDates = [1, 2, 4, 5, 7, 8, 10].map((daysAgo) => {
    const startedAt = new Date(now);
    startedAt.setDate(now.getDate() - daysAgo);
    startedAt.setHours(9 + (daysAgo % 3), 0, 0, 0);
    return startedAt;
  });

  const seededSessions = sessionDates.map((startedAt, index) => ({
    user: userId,
    subject: subjects[index % subjects.length]._id,
    mode: index % 2 ? "pomodoro" : "standard",
    startedAt,
    endedAt: new Date(startedAt.getTime() + (45 + index * 10) * 60 * 1000),
    durationSeconds: (45 + index * 10) * 60,
    pomodoroCycles: index % 2 ? 2 : 0,
    isActive: false,
    isPaused: false
  }));

  await StudySession.insertMany(seededSessions);
}
