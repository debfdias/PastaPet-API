import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/userController";

const router = Router();

router.post("/", createUser);

// Apply authentication middleware to all routes
router.use(authenticateToken);

router.get("/", getUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
