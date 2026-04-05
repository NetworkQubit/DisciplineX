import express from "express";
import {
  changePassword,
  confirmPasswordReset,
  getCurrentUser,
  getGoogleOAuthUrl,
  login,
  requestPasswordReset,
  register
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", requestPasswordReset);
router.post("/forgot-password/confirm", confirmPasswordReset);

router.get("/me", protect, getCurrentUser);
router.post("/password/reset", protect, changePassword);
router.get("/oauth/google/url", getGoogleOAuthUrl);

export default router;
