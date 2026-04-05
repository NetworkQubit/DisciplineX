import express from "express";
import {
  createTask,
  deleteTask,
  getTasks,
  reorderTasks,
  updateTask
} from "../controllers/taskController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/", getTasks);
router.post("/", createTask);
router.patch("/reorder", reorderTasks);
router.patch("/:taskId", updateTask);
router.delete("/:taskId", deleteTask);

export default router;
