import { Router } from "express";
import { login, verifyEmail } from "../controllers/authController";

const router = Router();

router.post("/login", login);
router.get("/verify", verifyEmail);

export default router;
