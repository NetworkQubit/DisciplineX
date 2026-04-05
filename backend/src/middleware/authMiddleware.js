import jwt from "jsonwebtoken";
import { getDatabaseMode } from "../config/db.js";
import User from "../models/User.js";

export async function protect(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.userId).select("-passwordHash");

    if (!req.user) {
      return res.status(401).json({ message: "User no longer exists." });
    }

    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

export function protectWhenMongo(req, res, next) {
  if (getDatabaseMode() !== "mongo") {
    return next();
  }

  return protect(req, res, next);
}
