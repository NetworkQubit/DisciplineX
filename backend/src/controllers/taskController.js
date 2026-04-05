import Task from "../models/Task.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ user: req.user._id })
    .populate("subject", "name color")
    .sort({ position: 1, createdAt: 1 });

  res.json({ tasks });
});

export const createTask = asyncHandler(async (req, res) => {
  const count = await Task.countDocuments({ user: req.user._id });
  const task = await Task.create({
    ...req.body,
    user: req.user._id,
    position: count
  });

  res.status(201).json({ task });
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.taskId, user: req.user._id },
    req.body,
    { new: true, runValidators: true }
  ).populate("subject", "name color");

  if (!task) {
    res.status(404);
    throw new Error("Task not found.");
  }

  res.json({ task });
});

export const reorderTasks = asyncHandler(async (req, res) => {
  const { orderedTaskIds } = req.body;

  await Promise.all(
    orderedTaskIds.map((taskId, index) =>
      Task.findOneAndUpdate({ _id: taskId, user: req.user._id }, { position: index })
    )
  );

  const tasks = await Task.find({ user: req.user._id })
    .populate("subject", "name color")
    .sort({ position: 1 });

  res.json({ tasks });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({
    _id: req.params.taskId,
    user: req.user._id
  });

  if (!task) {
    res.status(404);
    throw new Error("Task not found.");
  }

  res.status(204).send();
});
