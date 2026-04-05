import dotenv from "dotenv";
import { createApp } from "./app.js";
import { connectDatabase } from "./config/db.js";

dotenv.config({ path: "backend/.env" });

const app = createApp();
const port = process.env.PORT || 5000;

connectDatabase()
  .then((connection) => {
    if (connection?.connected === false) {
      console.warn("MongoDB unavailable. Falling back to local persistent workspace store.");
    }

    app.listen(port, () => {
  console.log(`DisciplineX backend listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  });
