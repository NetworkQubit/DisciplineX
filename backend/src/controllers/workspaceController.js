import StudySession from "../models/StudySession.js";
import Subject from "../models/Subject.js";
import ScheduleBlock from "../models/ScheduleBlock.js";
import Task from "../models/Task.js";
import User from "../models/User.js";
import { getDatabaseMode } from "../config/db.js";
import {
  autoScheduleLocalTasks,
  createLocalCalendarBlock,
  createLocalSubject,
  createLocalTask,
  deleteLocalCalendarBlock,
  deleteLocalSubject,
  deleteLocalTask,
  getLocalWorkspace,
  pauseLocalSession,
  reorderLocalTasks,
  resetLocalWorkspace,
  startLocalSession,
  stopLocalSession,
  updateLocalProfile,
  updateLocalSubject,
  updateLocalTask
} from "../services/localWorkspaceStore.js";
import { buildAutoSchedule, buildRecurringCalendarBlocks, buildWorkspaceAnalytics } from "../services/workspaceInsights.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function useLocalStore() {
  return getDatabaseMode() !== "mongo";
}

function getMongoUser(req) {
  return req.user;
}

async function loadMongoWorkspace(user) {
  const freshUser = await User.findById(user._id).lean();
  const [subjects, tasks, recentSessions, allSessions, calendarBlocks] = await Promise.all([
    Subject.find({ user: user._id }).sort({ createdAt: 1 }).lean(),
    Task.find({ user: user._id }).populate("subject", "name color").sort({ position: 1, createdAt: 1 }).lean(),
    StudySession.find({ user: user._id }).populate("subject", "name color").sort({ startedAt: -1 }).limit(12).lean(),
    StudySession.find({ user: user._id }).populate("subject", "name color").lean(),
    ScheduleBlock.find({ user: user._id }).populate("subject", "name color").sort({ startAt: 1 }).lean()
  ]);

  const analytics = buildWorkspaceAnalytics({
    sessions: allSessions.map((session) => ({
      ...session,
      subjectName: session.subject?.name,
      subjectColor: session.subject?.color
    })),
    tasks,
    studyGoalMinutes: freshUser.studyGoalMinutes,
    streak: freshUser.streak
  });

  const studiedMinutesBySubject = new Map(analytics.subjectBreakdown.map((entry) => [entry.name, entry.minutes]));
  const activeSession = await StudySession.findOne({ user: user._id, isActive: true })
    .populate("subject", "name color")
    .lean();

  return {
    profile: {
      id: user._id,
      username: freshUser.username,
      email: freshUser.email,
      avatar: freshUser.avatar,
      bio: freshUser.bio,
      studyGoalMinutes: freshUser.studyGoalMinutes,
      totalStudySeconds: freshUser.totalStudySeconds,
      streak: freshUser.streak,
      level: freshUser.level,
      xp: freshUser.xp,
      preferences: freshUser.preferences
    },
    subjects: subjects.map((subject) => ({
      ...subject,
      id: subject._id,
      studiedMinutes: studiedMinutesBySubject.get(subject.name) || 0
    })),
    tasks: tasks.map((task) => ({
      ...task,
      id: task._id,
      status: task.status === "todo" ? "backlog" : task.status,
      completed: task.status === "done"
    })),
    calendarBlocks: calendarBlocks.map((block) => ({
      ...block,
      id: block._id
    })),
    sessions: recentSessions.map((session) => ({
      ...session,
      id: session._id
    })),
    analytics,
    activeSession: activeSession
      ? {
          ...activeSession,
          id: activeSession._id
        }
      : null
  };
}

function calculateStreak(sessions) {
  const uniqueDays = new Set(
    sessions.map((session) => {
      const day = new Date(session.startedAt);
      day.setHours(0, 0, 0, 0);
      return day.toISOString();
    })
  );

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (uniqueDays.has(cursor.toISOString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

async function recalculateUserStats(userId) {
  const sessions = await StudySession.find({ user: userId, endedAt: { $ne: null } }).lean();
  const totalStudySeconds = sessions.reduce((sum, session) => sum + session.durationSeconds, 0);
  const xp = Math.round(totalStudySeconds / 60);
  const level = Math.max(1, Math.floor(xp / 300) + 1);
  const streak = calculateStreak(sessions);

  await User.findByIdAndUpdate(userId, {
    totalStudySeconds,
    xp,
    level,
    streak
  });
}

export const getWorkspace = asyncHandler(async (req, res) => {
  res.json(useLocalStore() ? await getLocalWorkspace() : await loadMongoWorkspace(getMongoUser(req)));
});

export const exportWorkspace = asyncHandler(async (req, res) => {
  const workspace = useLocalStore() ? await getLocalWorkspace() : await loadMongoWorkspace(getMongoUser(req));

  res.json({
    exportedAt: new Date().toISOString(),
    version: 1,
    workspace
  });
});

export const importWorkspace = asyncHandler(async (req, res) => {
  if (useLocalStore()) {
    res.status(501);
    throw new Error("Import is only available when MongoDB is connected.");
  }

  const user = getMongoUser(req);
  const payload = req.body?.workspace;

  if (!payload || typeof payload !== "object") {
    res.status(422);
    throw new Error("Import payload is invalid.");
  }

  const subjects = Array.isArray(payload.subjects) ? payload.subjects : [];
  const tasks = Array.isArray(payload.tasks) ? payload.tasks : [];
  const sessions = Array.isArray(payload.sessions) ? payload.sessions : [];
  const calendarBlocks = Array.isArray(payload.calendarBlocks) ? payload.calendarBlocks : [];
  const importedProfile = payload.profile || {};

  await Promise.all([
    Subject.deleteMany({ user: user._id }),
    Task.deleteMany({ user: user._id }),
    StudySession.deleteMany({ user: user._id }),
    ScheduleBlock.deleteMany({ user: user._id })
  ]);

  await User.findByIdAndUpdate(user._id, {
    bio: typeof importedProfile.bio === "string" ? importedProfile.bio : "Personal study workspace",
    studyGoalMinutes: Number(importedProfile.studyGoalMinutes) || 240,
    preferences: {
      theme: importedProfile.preferences?.theme || "system",
      websiteBlockingEnabled: Boolean(importedProfile.preferences?.websiteBlockingEnabled),
      pomodoroFocusMinutes: Number(importedProfile.preferences?.pomodoroFocusMinutes) || 25,
      pomodoroBreakMinutes: Number(importedProfile.preferences?.pomodoroBreakMinutes) || 5
    }
  });

  const subjectMap = new Map();

  if (subjects.length) {
    const createdSubjects = await Subject.insertMany(
      subjects.map((subject) => ({
        user: user._id,
        name: subject.name,
        color: subject.color,
        goalMinutes: Number(subject.goalMinutes) || 90,
        icon: subject.icon || "BookOpen"
      }))
    );

    subjects.forEach((subject, index) => {
      subjectMap.set(String(subject.id || subject._id || subject.name), createdSubjects[index]._id);
    });
  }

  if (tasks.length) {
    await Task.insertMany(
      tasks.map((task, index) => ({
        user: user._id,
        subject: task.subject?._id ? subjectMap.get(String(task.subject._id)) : undefined,
        title: task.title,
        priority: task.priority || "medium",
        category: task.category || "others",
        subtasks: Array.isArray(task.subtasks)
          ? task.subtasks.map((subtask) => ({
              title: subtask.title,
              completed: Boolean(subtask.completed)
            }))
          : [],
        status: task.completed || task.status === "done" ? "done" : task.status === "todo" ? "backlog" : task.status || "backlog",
        position: Number(task.position) || index
      }))
    );
  }

  if (sessions.length) {
    await StudySession.insertMany(
      sessions.map((session) => ({
        user: user._id,
        subject: session.subject?._id ? subjectMap.get(String(session.subject._id)) : undefined,
        mode: session.mode || "focus",
        startedAt: session.startedAt ? new Date(session.startedAt) : new Date(),
        endedAt: session.endedAt ? new Date(session.endedAt) : null,
        durationSeconds: Number(session.durationSeconds) || 0,
        isActive: Boolean(session.isActive),
        isPaused: Boolean(session.isPaused)
      }))
    );
  }

  if (calendarBlocks.length) {
    await ScheduleBlock.insertMany(
      calendarBlocks.map((block) => ({
        user: user._id,
        title: block.title,
        type: block.type || "study",
        source: block.source || "manual",
        subject: block.subject?._id ? subjectMap.get(String(block.subject._id)) : undefined,
        startAt: new Date(block.startAt),
        endAt: new Date(block.endAt),
        recurrence: block.recurrence || null
      }))
    );
  }

  await recalculateUserStats(user._id);
  return res.json(await loadMongoWorkspace(user));
});

export const updateProfile = asyncHandler(async (req, res) => {
  if (useLocalStore()) {
    return res.json(await updateLocalProfile(req.body));
  }

  const user = getMongoUser(req);
  const allowed = ["username", "bio", "studyGoalMinutes", "preferences", "avatar"];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));

  if (typeof updates.username === "string") {
    updates.username = updates.username.trim();

    if (updates.username.length < 3) {
      res.status(422);
      throw new Error("Username must be at least 3 characters.");
    }

    const existingUser = await User.findOne({
      username: updates.username,
      _id: { $ne: user._id }
    }).lean();

    if (existingUser) {
      res.status(409);
      throw new Error("That username is already taken.");
    }
  }

  await User.findByIdAndUpdate(user._id, updates, { new: true, runValidators: true });
  return res.json(await loadMongoWorkspace(user));
});

export const createSubject = asyncHandler(async (req, res) => {
  if (useLocalStore()) {
    return res.status(201).json(await createLocalSubject(req.body));
  }

  const user = getMongoUser(req);
  await Subject.create({
    user: user._id,
    name: req.body.name,
    color: req.body.color,
    goalMinutes: req.body.goalMinutes,
    icon: req.body.icon || "BookOpen"
  });
  return res.status(201).json(await loadMongoWorkspace(user));
});

export const updateSubject = asyncHandler(async (req, res) => {
  if (useLocalStore()) {
    return res.json(await updateLocalSubject(req.params.subjectId, req.body));
  }

  const user = getMongoUser(req);
  await Subject.findOneAndUpdate(
    { _id: req.params.subjectId, user: user._id },
    req.body,
    { new: true, runValidators: true }
  );
  return res.json(await loadMongoWorkspace(user));
});

export const deleteSubject = asyncHandler(async (req, res) => {
  if (useLocalStore()) {
    return res.json(await deleteLocalSubject(req.params.subjectId));
  }

  const user = getMongoUser(req);
  await Subject.findOneAndDelete({ _id: req.params.subjectId, user: user._id });
  await Task.updateMany({ user: user._id, subject: req.params.subjectId }, { $unset: { subject: 1 } });
  return res.json(await loadMongoWorkspace(user));
});

export const createTask = asyncHandler(async (req, res) => {
  if (useLocalStore()) {
    return res.status(201).json(await createLocalTask(req.body));
  }

  const user = getMongoUser(req);
  const position = await Task.countDocuments({ user: user._id });
  await Task.create({
    user: user._id,
    subject: req.body.subjectId || undefined,
    title: req.body.title,
    priority: req.body.priority || "medium",
    category: req.body.category || "others",
    subtasks: Array.isArray(req.body.subtasks)
      ? req.body.subtasks.map((subtask) => ({
          title: subtask.title,
          completed: Boolean(subtask.completed)
        }))
      : [],
    position,
    status: req.body.completed ? "done" : req.body.status === "todo" ? "backlog" : req.body.status || "backlog"
  });
  return res.status(201).json(await loadMongoWorkspace(user));
});

export const updateTask = asyncHandler(async (req, res) => {
  if (useLocalStore()) {
    return res.json(await updateLocalTask(req.params.taskId, req.body));
  }

  const user = getMongoUser(req);
  const updates = { ...req.body };

  if ("completed" in updates) {
    updates.status = updates.completed ? "done" : "backlog";
    delete updates.completed;
  }

  if ("subjectId" in updates) {
    updates.subject = updates.subjectId || undefined;
    delete updates.subjectId;
  }

  if ("status" in updates && updates.status === "todo") {
    updates.status = "backlog";
  }

  if (Array.isArray(updates.subtasks)) {
    updates.subtasks = updates.subtasks.map((subtask) => ({
      title: subtask.title,
      completed: Boolean(subtask.completed)
    }));
  }

  await Task.findOneAndUpdate(
    { _id: req.params.taskId, user: user._id },
    updates,
    { new: true, runValidators: true }
  );
  return res.json(await loadMongoWorkspace(user));
});

export const reorderTasks = asyncHandler(async (req, res) => {
  if (useLocalStore()) {
    return res.json(await reorderLocalTasks(req.body.orderedTaskIds));
  }

  const user = getMongoUser(req);
  const { orderedTaskIds } = req.body;

  await Promise.all(
    orderedTaskIds.map((taskId, index) =>
      Task.findOneAndUpdate({ _id: taskId, user: user._id }, { position: index })
    )
  );

  return res.json(await loadMongoWorkspace(user));
});

export const deleteTask = asyncHandler(async (req, res) => {
  if (useLocalStore()) {
    return res.json(await deleteLocalTask(req.params.taskId));
  }

  const user = getMongoUser(req);
  await Task.findOneAndDelete({ _id: req.params.taskId, user: user._id });
  return res.json(await loadMongoWorkspace(user));
});

export const startSession = asyncHandler(async (req, res) => {
  if (useLocalStore()) {
    return res.status(201).json(await startLocalSession(req.body));
  }

  const user = getMongoUser(req);
  await StudySession.updateMany({ user: user._id, isActive: true }, { isActive: false, isPaused: false });
  await StudySession.create({
    user: user._id,
    subject: req.body.subjectId || undefined,
    mode: req.body.mode || "standard",
    startedAt: new Date(),
    isActive: true,
    isPaused: false
  });
  return res.status(201).json(await loadMongoWorkspace(user));
});

export const pauseSession = asyncHandler(async (req, res) => {
  if (useLocalStore()) {
    return res.json(await pauseLocalSession(req.params.sessionId, Boolean(req.body.isPaused)));
  }

  const user = getMongoUser(req);
  const session = await StudySession.findOne({ _id: req.params.sessionId, user: user._id, isActive: true });

  if (session) {
    const shouldPause = Boolean(req.body.isPaused);
    const now = new Date();

    if (shouldPause && !session.isPaused) {
      session.durationSeconds =
        (session.durationSeconds || 0) +
        Math.max(0, Math.floor((now.getTime() - session.startedAt.getTime()) / 1000));
      session.isPaused = true;
      await session.save();
    } else if (!shouldPause && session.isPaused) {
      session.startedAt = now;
      session.isPaused = false;
      await session.save();
    }
  }

  return res.json(await loadMongoWorkspace(user));
});

export const stopSession = asyncHandler(async (req, res) => {
  if (useLocalStore()) {
    return res.json(await stopLocalSession(req.params.sessionId));
  }

  const user = getMongoUser(req);
  const session = await StudySession.findOne({ _id: req.params.sessionId, user: user._id, isActive: true });

  if (session) {
    const endedAt = new Date();
    const additionalSeconds = session.isPaused
      ? 0
      : Math.max(0, Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000));
    session.endedAt = endedAt;
    session.durationSeconds = (session.durationSeconds || 0) + additionalSeconds;
    session.isActive = false;
    session.isPaused = false;
    await session.save();
    await recalculateUserStats(user._id);
  }

  return res.json(await loadMongoWorkspace(user));
});

export const resetWorkspace = asyncHandler(async (req, res) => {
  if (useLocalStore()) {
    return res.json(await resetLocalWorkspace());
  }

  const user = getMongoUser(req);
  await Promise.all([
    Subject.deleteMany({ user: user._id }),
    Task.deleteMany({ user: user._id }),
    StudySession.deleteMany({ user: user._id }),
    ScheduleBlock.deleteMany({ user: user._id })
  ]);

  await User.findByIdAndUpdate(user._id, {
    bio: "Personal study workspace",
    studyGoalMinutes: 240,
    streak: 0,
    totalStudySeconds: 0,
    level: 1,
    xp: 0,
    badges: [],
    preferences: {
      theme: "system",
      websiteBlockingEnabled: false,
      pomodoroFocusMinutes: 25,
      pomodoroBreakMinutes: 5
    }
  });

  return res.json(await loadMongoWorkspace(user));
});

export const createCalendarBlock = asyncHandler(async (req, res) => {
  if (useLocalStore()) {
    return res.status(201).json(await createLocalCalendarBlock(req.body));
  }

  const user = getMongoUser(req);
  const blocks = buildRecurringCalendarBlocks(req.body);

  await ScheduleBlock.insertMany(
    blocks.map((block) => ({
      user: user._id,
      title: block.title,
      type: block.type,
      source: block.source,
      subject: block.subjectId || undefined,
      startAt: block.startAt,
      endAt: block.endAt,
      recurrence: block.recurrence
    }))
  );

  return res.status(201).json(await loadMongoWorkspace(user));
});

export const deleteCalendarBlock = asyncHandler(async (req, res) => {
  if (useLocalStore()) {
    return res.json(await deleteLocalCalendarBlock(req.params.blockId));
  }

  const user = getMongoUser(req);
  await ScheduleBlock.findOneAndDelete({ _id: req.params.blockId, user: user._id });
  return res.json(await loadMongoWorkspace(user));
});

export const autoScheduleTasks = asyncHandler(async (req, res) => {
  if (useLocalStore()) {
    return res.json(await autoScheduleLocalTasks());
  }

  const user = getMongoUser(req);
  const [tasks, blocks, subjects] = await Promise.all([
    Task.find({ user: user._id }).lean(),
    ScheduleBlock.find({ user: user._id }).lean(),
    Subject.find({ user: user._id }).lean()
  ]);

  const scheduledBlocks = buildAutoSchedule({
    tasks: tasks.map((task) => ({ ...task, id: task._id, subjectId: task.subject?.toString?.() || task.subject })),
    blocks: blocks.map((block) => ({
      ...block,
      id: block._id,
      taskId: block.task?.toString?.() || block.task,
      subjectId: block.subject?.toString?.() || block.subject
    })),
    subjects: subjects.map((subject) => ({ ...subject, id: subject._id }))
  });

  if (scheduledBlocks.length) {
    await ScheduleBlock.insertMany(
      scheduledBlocks.map((block) => ({
        user: user._id,
        title: block.title,
        type: block.type,
        source: block.source,
        startAt: block.startAt,
        endAt: block.endAt,
        task: block.taskId || undefined,
        subject: block.subjectId || undefined
      }))
    );
  }

  return res.json(await loadMongoWorkspace(user));
});
