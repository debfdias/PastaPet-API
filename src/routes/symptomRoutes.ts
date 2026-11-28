import express from "express";
import {
  createSymptom,
  getSymptomsByPet,
  updateSymptom,
  deleteSymptom,
} from "../controllers/symptomController";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);
router.post("/", createSymptom);
router.get("/pet/:petId", getSymptomsByPet);
router.put("/:id", updateSymptom);
router.delete("/:id", deleteSymptom);

export default router;
