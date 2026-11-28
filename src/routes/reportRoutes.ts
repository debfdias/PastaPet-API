import express from "express";
import {
  getPetReport,
  getShare,
  createShare,
  revokeShare,
  getPublicReport,
} from "../controllers/reportController";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// Public, unauthenticated: shared report by token.
router.get("/public/:token", getPublicReport);

// Everything below requires authentication.
router.use(authenticateToken);
router.get("/pet/:petId", getPetReport);
router.get("/pet/:petId/share", getShare);
router.post("/pet/:petId/share", createShare);
router.delete("/pet/:petId/share", revokeShare);

export default router;
