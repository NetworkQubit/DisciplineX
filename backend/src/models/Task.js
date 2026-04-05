import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
    title: { type: String, required: true, trim: true },
    notes: { type: String, default: "" },
    dueDate: { type: Date },
    status: {
      type: String,
      enum: ["todo", "in_progress", "done"],
      default: "todo"
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },
    position: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);
