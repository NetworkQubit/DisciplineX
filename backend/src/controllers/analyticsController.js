import User from "../models/User.js";
import { getHeatmap, getOverview, getSubjectBreakdown } from "../services/analyticsService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAnalyticsOverview = asyncHandler(async (req, res) => {
  const overview = await getOverview(req.user._id);
  res.json({ overview });
});

export const getAnalyticsHeatmap = asyncHandler(async (req, res) => {
  const heatmap = await getHeatmap(req.user._id);
  res.json({ heatmap });
});

export const getAnalyticsSubjects = asyncHandler(async (req, res) => {
  const subjects = await getSubjectBreakdown(req.user._id);
  res.json({ subjects });
});

export const getStreakStats = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("streak badges xp level");
  res.json({
    streak: user.streak,
    badges: user.badges,
    level: user.level,
    xp: user.xp
  });
});
