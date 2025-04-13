import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import {
  createEvent,
  getEventsByPet,
  getEventById,
  updateEvent,
} from "../controllers/eventController";

const router = Router();

// Create a new event
router.post("/", authenticateToken, createEvent);

// Get all events for a specific pet
router.get("/pet/:petId", authenticateToken, getEventsByPet);

// Get a specific event by ID
router.get("/:id", authenticateToken, getEventById);

// Update an event
router.put("/:id", authenticateToken, updateEvent);

export default router;
