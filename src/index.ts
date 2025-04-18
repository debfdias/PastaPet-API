import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import userRoutes from "./routes/userRoutes";
import authRoutes from "./routes/authRoutes";
import petRoutes from "./routes/petRoutes";
import noteRoutes from "./routes/noteRoutes";
import eventRoutes from "./routes/eventRoutes";

dotenv.config();

export const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*", // Allow all origins if CORS_ORIGIN is not set
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/pets", petRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/events", eventRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Only start the server if this file is run directly
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

// Handle shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit();
});
