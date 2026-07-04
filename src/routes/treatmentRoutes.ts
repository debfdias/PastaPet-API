import express from "express";
import {
  createTreatment,
  getTreatmentsByPet,
  getActiveTreatments,
  getTreatmentById,
  updateTreatment,
  deleteTreatment,
} from "../controllers/treatmentController";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);

router.post("/", createTreatment);
router.get("/active", getActiveTreatments);
router.get("/pet/:petId", getTreatmentsByPet);
router.get("/:id", getTreatmentById);
router.put("/:id", updateTreatment);
router.delete("/:id", deleteTreatment);

export default router;
