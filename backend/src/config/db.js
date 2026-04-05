import mongoose from "mongoose";

let databaseMode = "local";

export async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    databaseMode = "local";
    return { connected: false, mode: databaseMode };
  }

  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000
    });
    databaseMode = "mongo";
    return mongoose.connection;
  } catch (error) {
    databaseMode = "local";
    return { connected: false, mode: databaseMode, error };
  }
}

export function getDatabaseMode() {
  return databaseMode;
}
