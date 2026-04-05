import express from "express";
import {
  getSessions,
  pauseSession,
  startPomodoro,
  startSession,
  stopSession
} from "../controllers/sessionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/", getSessions);
router.post("/start", startSession);
router.post("/pomodoro", startPomodoro);
router.patch("/:sessionId/stop", stopSession);
router.patch("/:sessionId/pause", pauseSession);

export default router;
