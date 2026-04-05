import mongoose from "mongoose";

const recurrenceSchema = new mongoose.Schema(
  {
    frequency: { type: String, enum: ["daily", "weekly"], required: true },
    interval: { type: Number, default: 1 },
    count: { type: Number, default: 1 },
    seriesId: { type: String, required: true }
  },
  { _id: false }
);

const scheduleBlockSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["class", "study", "task", "personal"],
      default: "study"
    },
    source: {
      type: String,
      enum: ["manual", "auto"],
      default: "manual"
    },
    recurrence: { type: recurrenceSchema, default: null },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true }
  },
  { timestamps: true }
);

export default mongoose.model("ScheduleBlock", scheduleBlockSchema);
