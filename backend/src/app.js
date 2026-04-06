import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";
import { protectWhenMongo } from "./middleware/authMiddleware.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

dotenv.config();
dotenv.config({ path: "backend/.env" });

function buildAllowedOrigins() {
  const configuredOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return Array.from(new Set([...configuredOrigins, "http://localhost:5173", "http://127.0.0.1:5173"]));
}

function isAllowedOrigin(origin, allowedOrigins) {
  if (!origin) {
    return true;
  }

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  try {
    const { hostname } = new URL(origin);
    return hostname.endsWith(".netlify.app");
  } catch {
    return false;
  }
}

export function createApp() {
  const app = express();
  const allowedOrigins = buildAllowedOrigins();

  app.use(
    cors({
      origin(origin, callback) {
        if (isAllowedOrigin(origin, allowedOrigins)) {
          callback(null, true);
          return;
        }

        callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true
    })
  );
  app.use(express.json({ limit: "10mb" }));
  app.use(morgan("dev"));

  app.get("/", (req, res) => {
    res.json({
      name: "DisciplineX API",
      status: "ok",
      health: "/api/health"
    });
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/workspace", protectWhenMongo, workspaceRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
