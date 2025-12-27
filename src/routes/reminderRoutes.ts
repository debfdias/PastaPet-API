import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import {
  createReminder,
  getAllReminders,
  getRemindersByPet,
  getReminderById,
  getUnreadReminders,
  updateReminder,
  markReminderAsCompleted,
  markReminderAsIncomplete,
  markReminderAsViewed,
  deleteReminder,
} from "../controllers/reminderController";

const router = Router();

router.post("/", authenticateToken, createReminder);
router.get("/", authenticateToken, getAllReminders);
router.get("/unread", authenticateToken, getUnreadReminders);
router.get("/pet/:petId", authenticateToken, getRemindersByPet);
router.get("/:id", authenticateToken, getReminderById);
router.put("/:id", authenticateToken, updateReminder);
router.patch("/:id/complete", authenticateToken, markReminderAsCompleted);
router.patch("/:id/incomplete", authenticateToken, markReminderAsIncomplete);
router.patch("/:id/view", authenticateToken, markReminderAsViewed);
router.delete("/:id", authenticateToken, deleteReminder);

export default router;
