import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import {
  createEvent,
  getEventsByPet,
  getEventById,
  updateEvent,
} from "../controllers/eventController";

const router = Router();

router.post("/", authenticateToken, createEvent);
router.get("/pet/:petId", authenticateToken, getEventsByPet);
router.get("/:id", authenticateToken, getEventById);
router.put("/:id", authenticateToken, updateEvent);

export default router;
