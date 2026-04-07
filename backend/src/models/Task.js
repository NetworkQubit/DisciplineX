import mongoose from "mongoose";

const subtaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false }
  },
  { _id: true }
);

const taskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
    title: { type: String, required: true, trim: true },
    notes: { type: String, default: "" },
    dueDate: { type: Date },
    status: {
      type: String,
      enum: ["backlog", "in_progress", "will_see_later", "done"],
      default: "backlog"
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },
    category: {
      type: String,
      enum: ["coding", "debugging", "research", "writing", "learning", "planning", "ti_cohort", "backlogs", "others"],
      default: "others"
    },
    subtasks: { type: [subtaskSchema], default: [] },
    position: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);
