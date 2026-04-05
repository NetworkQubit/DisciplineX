import express from "express";
import {
  createSubject,
  deleteSubject,
  getSubjects,
  updateSubject
} from "../controllers/subjectController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/", getSubjects);
router.post("/", createSubject);
router.patch("/:subjectId", updateSubject);
router.delete("/:subjectId", deleteSubject);

export default router;
