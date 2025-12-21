import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import {
  createPet,
  getPets,
  getInactivePets,
  getPetById,
  updatePet,
  deletePet,
} from "../controllers/petController";

const router = Router();

router.post("/", authenticateToken, createPet);
router.get("/", authenticateToken, getPets);
router.get("/inactive", authenticateToken, getInactivePets);
router.get("/:id", authenticateToken, getPetById);
router.put("/:id", authenticateToken, updatePet);
router.delete("/:id", authenticateToken, deletePet);

export default router;
