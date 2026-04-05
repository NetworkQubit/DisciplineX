import express from "express";
import {
  getAnalyticsHeatmap,
  getAnalyticsOverview,
  getAnalyticsSubjects,
  getStreakStats
} from "../controllers/analyticsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/overview", getAnalyticsOverview);
router.get("/heatmap", getAnalyticsHeatmap);
router.get("/subjects", getAnalyticsSubjects);
router.get("/streak", getStreakStats);

export default router;
