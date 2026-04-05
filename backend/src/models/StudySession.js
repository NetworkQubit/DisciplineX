import mongoose from "mongoose";

const studySessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
    mode: {
      type: String,
      enum: ["standard", "pomodoro", "focus"],
      default: "standard"
    },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date },
    durationSeconds: { type: Number, default: 0 },
    pomodoroCycles: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isPaused: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model("StudySession", studySessionSchema);
