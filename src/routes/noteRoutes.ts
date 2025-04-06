import { Router, Request } from "express";
import { PrismaClient, NoteSeverity } from "@prisma/client";
import { authenticateToken } from "../middleware/auth";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

const router = Router();
const prisma = new PrismaClient();

// Create a new note
router.post("/", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { title, description, severity, petId } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Verify that the pet belongs to the user
    const pet = await prisma.pet.findFirst({
      where: {
        id: petId,
        userId,
      },
    });

    if (!pet) {
      return res
        .status(404)
        .json({ error: "Pet not found or not owned by user" });
    }

    const note = await prisma.note.create({
      data: {
        title,
        description,
        severity: severity as NoteSeverity,
        petId,
        authorId: userId,
      },
    });

    res.status(201).json(note);
  } catch (error) {
    res.status(400).json({ error: "Failed to create note" });
  }
});

// Get all notes for a specific pet
router.get(
  "/pet/:petId",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { petId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Verify that the pet belongs to the user
      const pet = await prisma.pet.findFirst({
        where: {
          id: petId,
          userId,
        },
      });

      if (!pet) {
        return res
          .status(404)
          .json({ error: "Pet not found or not owned by user" });
      }

      const notes = await prisma.note.findMany({
        where: {
          petId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.json(notes);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch notes" });
    }
  }
);

// Get a specific note by ID
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

      const note = await prisma.note.findFirst({
        where: {
          id,
          author: {
            id: userId,
          },
        },
      });

      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }

      res.json(note);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch note" });
    }
  }
);

// Update a note
router.put(
  "/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { title, description, severity } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Verify that the note exists and belongs to the user
      const existingNote = await prisma.note.findFirst({
        where: {
          id,
          author: {
            id: userId,
          },
        },
      });

      if (!existingNote) {
        return res.status(404).json({ error: "Note not found" });
      }

      const updatedNote = await prisma.note.update({
        where: { id },
        data: {
          title,
          description,
          severity: severity as NoteSeverity,
        },
      });

      res.json(updatedNote);
    } catch (error) {
      res.status(400).json({ error: "Failed to update note" });
    }
  }
);

// Delete a note
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

      // Verify that the note exists and belongs to the user
      const existingNote = await prisma.note.findFirst({
        where: {
          id,
          author: {
            id: userId,
          },
        },
      });

      if (!existingNote) {
        return res.status(404).json({ error: "Note not found" });
      }

      await prisma.note.delete({
        where: { id },
      });

      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Failed to delete note" });
    }
  }
);

export default router;
