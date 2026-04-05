import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { buildAutoSchedule, buildRecurringCalendarBlocks, buildWorkspaceAnalytics } from "./workspaceInsights.js";

const dataDir = path.resolve(process.cwd(), "backend", "data");
const dataFile = path.join(dataDir, "workspace.json");

function createId() {
  return crypto.randomUUID();
}

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function createDefaultWorkspace() {
  const subjectMath = createId();
  const subjectPhysics = createId();
  const subjectProgramming = createId();
  const now = new Date();

  const sessions = [1, 2, 4, 5, 7, 8, 10].map((daysAgo, index) => {
    const startedAt = new Date(now);
    startedAt.setDate(now.getDate() - daysAgo);
    startedAt.setHours(9 + (daysAgo % 3), 0, 0, 0);
    const minutes = 45 + index * 10;
    const subjectIds = [subjectMath, subjectPhysics, subjectProgramming];

    return {
      id: createId(),
      subjectId: subjectIds[index % subjectIds.length],
      mode: index % 2 ? "pomodoro" : "standard",
      startedAt: startedAt.toISOString(),
      endedAt: new Date(startedAt.getTime() + minutes * 60 * 1000).toISOString(),
      durationSeconds: minutes * 60,
      isActive: false,
      isPaused: false
    };
  });

  return {
    profile: {
      id: createId(),
      username: process.env.DESKTOP_USERNAME || "desktop-user",
      email: process.env.DESKTOP_USER_EMAIL || "desktop@studyflow.local",
      avatar: "",
      bio: "Personal study workspace",
      studyGoalMinutes: 240,
      totalStudySeconds: sessions.reduce((sum, session) => sum + session.durationSeconds, 0),
      streak: 0,
      level: 1,
      xp: 0,
      preferences: {
        theme: "system",
        websiteBlockingEnabled: false,
        pomodoroFocusMinutes: 25,
        pomodoroBreakMinutes: 5
      }
    },
    subjects: [
      { id: subjectMath, name: "Mathematics", color: "#14B8A6", goalMinutes: 120, icon: "Sigma" },
      { id: subjectPhysics, name: "Physics", color: "#FB7185", goalMinutes: 90, icon: "Atom" },
      { id: subjectProgramming, name: "Programming", color: "#F59E0B", goalMinutes: 150, icon: "Code2" }
    ],
    tasks: [
      { id: createId(), subjectId: subjectMath, title: "Solve 20 differentiation problems", priority: "high", status: "todo", position: 0 },
      { id: createId(), subjectId: subjectPhysics, title: "Review thermodynamics notes", priority: "medium", status: "todo", position: 1 },
      { id: createId(), subjectId: subjectProgramming, title: "Build timer screen interactions", priority: "high", status: "todo", position: 2 }
    ],
    calendarBlocks: [],
    sessions
  };
}

function calculateStreak(sessions) {
  const uniqueDays = new Set(
    sessions
      .filter((session) => session.endedAt)
      .map((session) => {
        const day = startOfDay(new Date(session.startedAt));
        return day.toISOString();
      })
  );

  let streak = 0;
  const cursor = startOfDay(new Date());

  while (uniqueDays.has(cursor.toISOString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function recomputeProfile(workspace) {
  const endedSessions = workspace.sessions.filter((session) => session.endedAt);
  const totalStudySeconds = endedSessions.reduce((sum, session) => sum + session.durationSeconds, 0);
  const xp = Math.round(totalStudySeconds / 60);
  const level = Math.max(1, Math.floor(xp / 300) + 1);

  workspace.profile.totalStudySeconds = totalStudySeconds;
  workspace.profile.xp = xp;
  workspace.profile.level = level;
  workspace.profile.streak = calculateStreak(endedSessions);
}

function buildWorkspaceResponse(workspace) {
  recomputeProfile(workspace);

  const subjectMap = new Map(workspace.subjects.map((subject) => [subject.id, subject]));
  const activeSession = workspace.sessions.find((session) => session.isActive) || null;
  const analytics = buildWorkspaceAnalytics({
    sessions: workspace.sessions.map((session) => {
      const subject = session.subjectId ? subjectMap.get(session.subjectId) : null;
      return {
        ...session,
        subjectName: subject?.name,
        subjectColor: subject?.color
      };
    }),
    tasks: workspace.tasks,
    studyGoalMinutes: workspace.profile.studyGoalMinutes,
    streak: workspace.profile.streak
  });

  return {
    profile: workspace.profile,
    subjects: workspace.subjects.map((subject) => ({
      ...subject,
      studiedMinutes: analytics.subjectBreakdown.find((entry) => entry.name === subject.name)?.minutes || 0
    })),
    tasks: workspace.tasks
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((task) => ({
        ...task,
        completed: task.status === "done",
        subject: task.subjectId ? subjectMap.get(task.subjectId) || null : null
      })),
    calendarBlocks: workspace.calendarBlocks
      .slice()
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
      .map((block) => ({
        ...block,
        subject: block.subjectId ? subjectMap.get(block.subjectId) || null : null
      })),
    sessions: workspace.sessions
      .slice()
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .slice(0, 12)
      .map((session) => ({
        ...session,
        subject: session.subjectId ? subjectMap.get(session.subjectId) || null : null
      })),
    analytics,
    activeSession: activeSession
      ? {
          ...activeSession,
          subject: activeSession.subjectId ? subjectMap.get(activeSession.subjectId) || null : null
        }
      : null
  };
}

async function readWorkspace() {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    const content = await fs.readFile(dataFile, "utf8");
    const workspace = JSON.parse(content);
    workspace.calendarBlocks ||= [];
    workspace.subjects ||= [];
    workspace.tasks ||= [];
    workspace.sessions ||= [];
    return workspace;
  } catch (error) {
    const workspace = createDefaultWorkspace();
    recomputeProfile(workspace);
    await fs.writeFile(dataFile, JSON.stringify(workspace, null, 2));
    return workspace;
  }
}

async function writeWorkspace(workspace) {
  recomputeProfile(workspace);
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(workspace, null, 2));
  return buildWorkspaceResponse(workspace);
}

export async function getLocalWorkspace() {
  const workspace = await readWorkspace();
  return buildWorkspaceResponse(workspace);
}

export async function updateLocalProfile(updates) {
  const workspace = await readWorkspace();
  workspace.profile = {
    ...workspace.profile,
    ...updates,
    preferences: {
      ...workspace.profile.preferences,
      ...(updates.preferences || {})
    }
  };
  return writeWorkspace(workspace);
}

export async function createLocalSubject(payload) {
  const workspace = await readWorkspace();
  workspace.subjects.push({
    id: createId(),
    name: payload.name,
    color: payload.color || "#22C55E",
    goalMinutes: payload.goalMinutes || 90,
    icon: payload.icon || "BookOpen"
  });
  return writeWorkspace(workspace);
}

export async function updateLocalSubject(subjectId, updates) {
  const workspace = await readWorkspace();
  workspace.subjects = workspace.subjects.map((subject) =>
    subject.id === subjectId ? { ...subject, ...updates } : subject
  );
  return writeWorkspace(workspace);
}

export async function deleteLocalSubject(subjectId) {
  const workspace = await readWorkspace();
  workspace.subjects = workspace.subjects.filter((subject) => subject.id !== subjectId);
  workspace.tasks = workspace.tasks.map((task) =>
    task.subjectId === subjectId ? { ...task, subjectId: undefined } : task
  );
  workspace.sessions = workspace.sessions.map((session) =>
    session.subjectId === subjectId ? { ...session, subjectId: undefined } : session
  );
  return writeWorkspace(workspace);
}

export async function createLocalTask(payload) {
  const workspace = await readWorkspace();
  workspace.tasks.push({
    id: createId(),
    title: payload.title,
    subjectId: payload.subjectId,
    priority: payload.priority || "medium",
    status: payload.completed ? "done" : "todo",
    position: workspace.tasks.length
  });
  return writeWorkspace(workspace);
}

export async function updateLocalTask(taskId, updates) {
  const workspace = await readWorkspace();
  workspace.tasks = workspace.tasks.map((task) => {
    if (task.id !== taskId) {
      return task;
    }

    const next = { ...task, ...updates };
    if ("completed" in updates) {
      next.status = updates.completed ? "done" : "todo";
      delete next.completed;
    }
    if ("subjectId" in updates) {
      next.subjectId = updates.subjectId || undefined;
    }
    return next;
  });
  return writeWorkspace(workspace);
}

export async function reorderLocalTasks(orderedTaskIds) {
  const workspace = await readWorkspace();
  workspace.tasks = workspace.tasks.map((task) => ({
    ...task,
    position: orderedTaskIds.indexOf(task.id)
  }));
  return writeWorkspace(workspace);
}

export async function deleteLocalTask(taskId) {
  const workspace = await readWorkspace();
  workspace.tasks = workspace.tasks.filter((task) => task.id !== taskId);
  workspace.tasks = workspace.tasks
    .sort((a, b) => a.position - b.position)
    .map((task, index) => ({ ...task, position: index }));
  return writeWorkspace(workspace);
}

export async function startLocalSession(payload) {
  const workspace = await readWorkspace();
  workspace.sessions = workspace.sessions.map((session) => ({
    ...session,
    isActive: false,
    isPaused: false
  }));
  workspace.sessions.push({
    id: createId(),
    subjectId: payload.subjectId,
    mode: payload.mode || "standard",
    startedAt: new Date().toISOString(),
    endedAt: null,
    durationSeconds: 0,
    isActive: true,
    isPaused: false
  });
  return writeWorkspace(workspace);
}

export async function pauseLocalSession(sessionId, isPaused) {
  const workspace = await readWorkspace();
  const now = new Date();
  workspace.sessions = workspace.sessions.map((session) => {
    if (session.id !== sessionId || !session.isActive) {
      return session;
    }

    if (isPaused && !session.isPaused) {
      return {
        ...session,
        durationSeconds:
          (session.durationSeconds || 0) +
          Math.max(0, Math.floor((now.getTime() - new Date(session.startedAt).getTime()) / 1000)),
        isPaused: true
      };
    }

    if (!isPaused && session.isPaused) {
      return {
        ...session,
        startedAt: now.toISOString(),
        isPaused: false
      };
    }

    return session;
  });
  return writeWorkspace(workspace);
}

export async function stopLocalSession(sessionId) {
  const workspace = await readWorkspace();
  workspace.sessions = workspace.sessions.map((session) => {
    if (session.id !== sessionId || !session.isActive) {
      return session;
    }

    const endedAt = new Date().toISOString();
    const additionalSeconds = session.isPaused
      ? 0
      : Math.max(0, Math.floor((new Date(endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000));
    return {
      ...session,
      endedAt,
      durationSeconds: (session.durationSeconds || 0) + additionalSeconds,
      isActive: false,
      isPaused: false
    };
  });
  return writeWorkspace(workspace);
}

export async function resetLocalWorkspace() {
  const workspace = createDefaultWorkspace();
  return writeWorkspace(workspace);
}

export async function createLocalCalendarBlock(payload) {
  const workspace = await readWorkspace();
  workspace.calendarBlocks.push(
    ...buildRecurringCalendarBlocks(payload).map((block) => ({
      id: createId(),
      title: block.title,
      type: block.type,
      source: block.source,
      startAt: block.startAt,
      endAt: block.endAt,
      subjectId: block.subjectId,
      recurrence: block.recurrence
    }))
  );
  return writeWorkspace(workspace);
}

export async function deleteLocalCalendarBlock(blockId) {
  const workspace = await readWorkspace();
  workspace.calendarBlocks = workspace.calendarBlocks.filter((block) => block.id !== blockId);
  return writeWorkspace(workspace);
}

export async function autoScheduleLocalTasks() {
  const workspace = await readWorkspace();
  const scheduledBlocks = buildAutoSchedule({
    tasks: workspace.tasks,
    blocks: workspace.calendarBlocks,
    subjects: workspace.subjects
  });

  workspace.calendarBlocks.push(
    ...scheduledBlocks.map((block) => ({
      ...block,
      id: createId()
    }))
  );

  return writeWorkspace(workspace);
}
