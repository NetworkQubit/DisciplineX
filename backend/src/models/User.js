import mongoose from "mongoose";

const badgeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    title: { type: String, required: true },
    unlockedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const preferencesSchema = new mongoose.Schema(
  {
    theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
    websiteBlockingEnabled: { type: Boolean, default: false },
    pomodoroFocusMinutes: { type: Number, default: 25 },
    pomodoroBreakMinutes: { type: Number, default: 5 }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    avatar: { type: String, default: "" },
    bio: { type: String, default: "" },
    studyGoalMinutes: { type: Number, default: 240 },
    streak: { type: Number, default: 0 },
    totalStudySeconds: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    badges: [badgeSchema],
    resetPasswordTokenHash: { type: String, default: null },
    resetPasswordExpiresAt: { type: Date, default: null },
    preferences: { type: preferencesSchema, default: () => ({}) }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
