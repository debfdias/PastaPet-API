import express from "express";
import {
  createExam,
  getExamsByPet,
  getExamById,
  updateExam,
  deleteExam,
} from "../controllers/examController";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);
router.post("/", createExam);
router.get("/pet/:petId", getExamsByPet);
router.get("/:id", getExamById);
router.put("/:id", updateExam);
router.delete("/:id", deleteExam);

export default router;
