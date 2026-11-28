import express from "express";
import cors from "cors";
import { prisma } from "./lib/prisma";
import userRoutes from "./routes/userRoutes";
import authRoutes from "./routes/authRoutes";
import petRoutes from "./routes/petRoutes";
import noteRoutes from "./routes/noteRoutes";
import eventRoutes from "./routes/eventRoutes";
import vaccineRoutes from "./routes/vaccineRoutes";
import examRoutes from "./routes/examRoutes";
import treatmentRoutes from "./routes/treatmentRoutes";
import reminderRoutes from "./routes/reminderRoutes";
import symptomRoutes from "./routes/symptomRoutes";
import weightRoutes from "./routes/weightRoutes";
import reportRoutes from "./routes/reportRoutes";
import { startReminderCron } from "./jobs/reminderCron";

export const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*", // Allow all origins if CORS_ORIGIN is not set
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Pasta Pet API running, barking and meowing!!! 🐾");
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/pets", petRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/vaccines", vaccineRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/treatments", treatmentRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/symptoms", symptomRoutes);
app.use("/api/weights", weightRoutes);
app.use("/api/reports", reportRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Only start the server if this file is run directly
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    // Start reminder cron job
    startReminderCron();
  });
}

// Handle shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit();
});
