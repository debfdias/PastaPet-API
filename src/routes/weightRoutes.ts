import express from "express";
import {
  createWeightEntry,
  getWeightsByPet,
  deleteWeightEntry,
} from "../controllers/weightController";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);
router.post("/", createWeightEntry);
router.get("/pet/:petId", getWeightsByPet);
router.delete("/:id", deleteWeightEntry);

export default router;
