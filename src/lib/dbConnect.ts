import mongoose from "mongoose";
import chalk from "chalk"; // remove in production

type ConnectionObject = {
  isConnected?: number;
};

const connection: ConnectionObject = {};

async function dbConnect(): Promise<void> {
  const now = new Date(); // remove in production
  const time = now.toLocaleTimeString(); // remove in production
  console.log(chalk.bold.cyanBright(`[${time}] Current Time`)); // remove in production

  if (connection.isConnected) {
    console.log("MongoDB is already connected");
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI || "", {});
    connection.isConnected = db.connections[0].readyState;
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

export default dbConnect;
