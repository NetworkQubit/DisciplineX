import Subject from "../models/Subject.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getSubjects = asyncHandler(async (req, res) => {
  const subjects = await Subject.find({ user: req.user._id }).sort({ createdAt: 1 });
  res.json({ subjects });
});

export const createSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.create({
    ...req.body,
    user: req.user._id
  });

  res.status(201).json({ subject });
});

export const updateSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findOneAndUpdate(
    { _id: req.params.subjectId, user: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!subject) {
    res.status(404);
    throw new Error("Subject not found.");
  }

  res.json({ subject });
});

export const deleteSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findOneAndDelete({
    _id: req.params.subjectId,
    user: req.user._id
  });

  if (!subject) {
    res.status(404);
    throw new Error("Subject not found.");
  }

  res.status(204).send();
});
