import StudySession from "../models/StudySession.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getSessions = asyncHandler(async (req, res) => {
  const sessions = await StudySession.find({ user: req.user._id })
    .populate("subject", "name color")
    .sort({ startedAt: -1 })
    .limit(50);

  res.json({ sessions });
});

export const startSession = asyncHandler(async (req, res) => {
  const { subject, mode = "standard" } = req.body;

  const session = await StudySession.create({
    user: req.user._id,
    subject,
    mode,
    startedAt: new Date(),
    isActive: true
  });

  res.status(201).json({ session });
});

export const stopSession = asyncHandler(async (req, res) => {
  const session = await StudySession.findOne({
    _id: req.params.sessionId,
    user: req.user._id
  });

  if (!session) {
    res.status(404);
    throw new Error("Session not found.");
  }

  const endedAt = new Date();
  const durationSeconds = Math.max(
    session.durationSeconds,
    Math.round((endedAt.getTime() - session.startedAt.getTime()) / 1000)
  );

  session.endedAt = endedAt;
  session.durationSeconds = durationSeconds;
  session.isActive = false;
  session.isPaused = false;
  await session.save();

  await User.findByIdAndUpdate(req.user._id, {
    $inc: {
      totalStudySeconds: durationSeconds,
      xp: Math.round(durationSeconds / 60)
    }
  });

  res.json({ session });
});

export const pauseSession = asyncHandler(async (req, res) => {
  const session = await StudySession.findOneAndUpdate(
    { _id: req.params.sessionId, user: req.user._id },
    { isPaused: req.body.isPaused },
    { new: true }
  );

  if (!session) {
    res.status(404);
    throw new Error("Session not found.");
  }

  res.json({ session });
});

export const startPomodoro = asyncHandler(async (req, res) => {
  const { subject, cycles = 4 } = req.body;

  const session = await StudySession.create({
    user: req.user._id,
    subject,
    mode: "pomodoro",
    pomodoroCycles: cycles,
    startedAt: new Date(),
    isActive: true
  });

  res.status(201).json({ session });
});
