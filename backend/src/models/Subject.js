import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    color: { type: String, default: "#22C55E" },
    icon: { type: String, default: "BookOpen" },
    goalMinutes: { type: Number, default: 90 },
    archived: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model("Subject", subjectSchema);
