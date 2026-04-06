import express from "express";
import {
  autoScheduleTasks,
  createCalendarBlock,
  createSubject,
  createTask,
  deleteCalendarBlock,
  deleteSubject,
  deleteTask,
  exportWorkspace,
  getWorkspace,
  importWorkspace,
  pauseSession,
  reorderTasks,
  resetWorkspace,
  startSession,
  stopSession,
  updateProfile,
  updateSubject,
  updateTask
} from "../controllers/workspaceController.js";

const router = express.Router();

router.get("/", getWorkspace);
router.get("/export", exportWorkspace);
router.post("/import", importWorkspace);
router.patch("/profile", updateProfile);
router.post("/subjects", createSubject);
router.patch("/subjects/:subjectId", updateSubject);
router.delete("/subjects/:subjectId", deleteSubject);
router.post("/tasks", createTask);
router.patch("/tasks/reorder", reorderTasks);
router.patch("/tasks/:taskId", updateTask);
router.delete("/tasks/:taskId", deleteTask);
router.post("/calendar/blocks", createCalendarBlock);
router.delete("/calendar/blocks/:blockId", deleteCalendarBlock);
router.post("/schedule/auto", autoScheduleTasks);
router.post("/sessions/start", startSession);
router.patch("/sessions/:sessionId/pause", pauseSession);
router.patch("/sessions/:sessionId/stop", stopSession);
router.delete("/reset", resetWorkspace);

export default router;
