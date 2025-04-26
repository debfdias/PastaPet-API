import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import {
  createPet,
  getPets,
  getPetById,
  updatePet,
  deletePet,
} from "../controllers/petController";

const router = Router();

router.post("/", authenticateToken, createPet);
router.get("/", authenticateToken, getPets);
router.get("/:id", authenticateToken, getPetById);
router.put("/:id", authenticateToken, updatePet);
router.delete("/:id", authenticateToken, deletePet);

export default router;
