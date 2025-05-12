import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import {
  createVaccineRecord,
  getVaccineRecordsByPet,
  getVaccineRecordById,
  updateVaccineRecord,
  deleteVaccineRecord,
  getAllVaccineTypes,
} from "../controllers/vaccineController";

const router = Router();

// Vaccine Types endpoint
router.get("/types", authenticateToken, getAllVaccineTypes);

// Vaccine Records endpoints
router.post("/", authenticateToken, createVaccineRecord);
router.get("/pet/:petId", authenticateToken, getVaccineRecordsByPet);
router.get("/:id", authenticateToken, getVaccineRecordById);
router.put("/:id", authenticateToken, updateVaccineRecord);
router.delete("/:id", authenticateToken, deleteVaccineRecord);

export default router;
