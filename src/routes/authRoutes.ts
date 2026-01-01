import { Router } from "express";
import {
  login,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
} from "../controllers/authController";

const router = Router();

router.post("/login", login);
router.get("/verify", verifyEmail);
router.post("/password/forgot", requestPasswordReset);
router.post("/password/reset", resetPassword);

export default router;
