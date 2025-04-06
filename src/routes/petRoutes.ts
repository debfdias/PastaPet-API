import { Router, Request } from "express";
import { PrismaClient, PetType } from "@prisma/client";
import { authenticateToken } from "../middleware/auth";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

const router = Router();
const prisma = new PrismaClient();

// Create a new pet
router.post("/", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, dob, weight, type, breed } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const pet = await prisma.pet.create({
      data: {
        name,
        dob: new Date(dob),
        weight,
        type: type as PetType,
        breed,
        userId,
      },
    });

    res.status(201).json(pet);
  } catch (error) {
    res.status(400).json({ error: "Failed to create pet" });
  }
});

// Get all pets for the authenticated user
router.get("/", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { type } = req.query;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const pets = await prisma.pet.findMany({
      where: {
        userId,
        ...(type ? { type: type as PetType } : {}),
      },
    });

    res.json(pets);
  } catch (error) {
    res.status(400).json({ error: "Failed to fetch pets" });
  }
});

// Get a specific pet by ID (only if owned by the user)
router.get(
  "/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const pet = await prisma.pet.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!pet) {
        return res.status(404).json({ error: "Pet not found" });
      }

      res.json(pet);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch pet" });
    }
  }
);

// Update a pet (only if owned by the user)
router.put(
  "/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const { name, dob, weight, type, breed } = req.body;

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // First check if the pet exists and belongs to the user
      const existingPet = await prisma.pet.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!existingPet) {
        return res.status(404).json({ error: "Pet not found" });
      }

      const updatedPet = await prisma.pet.update({
        where: { id },
        data: {
          name,
          dob: dob ? new Date(dob) : undefined,
          weight,
          type: type as PetType,
          breed,
        },
      });

      res.json(updatedPet);
    } catch (error) {
      res.status(400).json({ error: "Failed to update pet" });
    }
  }
);

// Delete a pet (only if owned by the user)
router.delete(
  "/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // First check if the pet exists and belongs to the user
      const existingPet = await prisma.pet.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!existingPet) {
        return res.status(404).json({ error: "Pet not found" });
      }

      await prisma.pet.delete({
        where: { id },
      });

      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Failed to delete pet" });
    }
  }
);

export default router;
