import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import { sendPasswordResetEmail } from "../services/emailService.js";
import { seedWorkspaceForUser } from "../services/workspaceService.js";
import { generateToken } from "../utils/generateToken.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function requireFields(fields) {
  for (const field of fields) {
    if (!field.value) {
      const error = new Error(field.message);
      error.statusCode = 422;
      throw error;
    }
  }
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function buildGoogleAuthUrl() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return null;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    prompt: "consent",
    access_type: "offline"
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  requireFields([
    { value: username, message: "Username is required." },
    { value: email, message: "Enter a valid email address." },
    { value: password, message: "Password must be at least 6 characters." }
  ]);

  if (String(username).trim().length < 3) {
    res.status(422);
    throw new Error("Username must be at least 3 characters.");
  }

  if (!validateEmail(String(email))) {
    res.status(422);
    throw new Error("Enter a valid email address.");
  }

  if (String(password).length < 6) {
    res.status(422);
    throw new Error("Password must be at least 6 characters.");
  }

  const existingUser = await User.findOne({
    $or: [{ email: String(email).toLowerCase() }, { username: String(username).trim() }]
  });

  if (existingUser) {
    res.status(409);
    throw new Error("A user with that email or username already exists.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    username: String(username).trim(),
    email: String(email).toLowerCase().trim(),
    passwordHash,
    studyGoalMinutes: 240,
    bio: "Personal study workspace"
  });
  await seedWorkspaceForUser(user._id);

  res.status(201).json({
    token: generateToken(user._id.toString()),
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      studyGoalMinutes: user.studyGoalMinutes
    }
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  requireFields([
    { value: email, message: "Enter a valid email address." },
    { value: password, message: "Password is required." }
  ]);

  if (!validateEmail(String(email))) {
    res.status(422);
    throw new Error("Enter a valid email address.");
  }

  const user = await User.findOne({ email: String(email).toLowerCase().trim() });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401);
    throw new Error("Invalid email or password.");
  }

  res.json({
    token: generateToken(user._id.toString()),
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      studyGoalMinutes: user.studyGoalMinutes
    }
  });
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

export const getGoogleOAuthUrl = asyncHandler(async (req, res) => {
  const url = buildGoogleAuthUrl();

  res.json({
    provider: "google",
    enabled: Boolean(url),
    url
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  requireFields([
    { value: currentPassword, message: "Current password is required." },
    { value: newPassword, message: "New password must be at least 6 characters." }
  ]);

  if (String(newPassword).length < 6) {
    res.status(422);
    throw new Error("New password must be at least 6 characters.");
  }

  const user = await User.findById(req.user._id);

  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    res.status(401);
    throw new Error("Current password is incorrect.");
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.json({ message: "Password updated successfully." });
});

export const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;
  requireFields([{ value: email, message: "Enter a valid email address." }]);

  if (!validateEmail(String(email))) {
    res.status(422);
    throw new Error("Enter a valid email address.");
  }

  const user = await User.findOne({ email: String(email).toLowerCase().trim() });

  if (user) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    user.resetPasswordTokenHash = tokenHash;
    user.resetPasswordExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetUrl = `${clientUrl}/?resetToken=${rawToken}&email=${encodeURIComponent(user.email)}`;

    await sendPasswordResetEmail({
      to: user.email,
      username: user.username,
      resetUrl
    });
  }

  res.json({ message: "If an account exists for that email, a reset link has been sent." });
});

export const confirmPasswordReset = asyncHandler(async (req, res) => {
  const { email, token, newPassword } = req.body;
  requireFields([
    { value: email, message: "Email is required." },
    { value: token, message: "Reset token is required." },
    { value: newPassword, message: "New password must be at least 6 characters." }
  ]);

  if (String(newPassword).length < 6) {
    res.status(422);
    throw new Error("New password must be at least 6 characters.");
  }

  const tokenHash = crypto.createHash("sha256").update(String(token)).digest("hex");
  const user = await User.findOne({
    email: String(email).toLowerCase().trim(),
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpiresAt: { $gt: new Date() }
  });

  if (!user) {
    res.status(400);
    throw new Error("This password reset link is invalid or has expired.");
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.resetPasswordTokenHash = null;
  user.resetPasswordExpiresAt = null;
  await user.save();

  res.json({ message: "Password reset successfully." });
});
