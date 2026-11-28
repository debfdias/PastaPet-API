import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth";

const SYMPTOM_TYPES = [
  "VOMITING",
  "DIARRHEA",
  "APPETITE_LOSS",
  "LETHARGY",
  "COUGHING",
  "SNEEZING",
  "ITCHING",
  "LIMPING",
  "SEIZURE",
  "OTHER",
];
const SEVERITIES = ["LOW", "MEDIUM", "HIGH"];

export const createSymptom = async (req: AuthRequest, res: Response) => {
  try {
    const { petId, type, severity, notes, observedAt } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    if (!SYMPTOM_TYPES.includes(type)) {
      return res.status(400).json({ message: "Invalid symptom type" });
    }

    // Verify that the pet belongs to the user
    const pet = await prisma.pet.findFirst({ where: { id: petId, userId } });
    if (!pet) {
      return res
        .status(404)
        .json({ message: "Pet not found or not owned by user" });
    }

    const symptom = await prisma.symptom.create({
      data: {
        petId,
        userId,
        type,
        severity: SEVERITIES.includes(severity) ? severity : "MEDIUM",
        notes,
        observedAt: observedAt ? new Date(observedAt) : new Date(),
      },
    });

    res.status(201).json(symptom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating symptom" });
  }
};

export const getSymptomsByPet = async (req: AuthRequest, res: Response) => {
  try {
    const { petId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const pet = await prisma.pet.findFirst({ where: { id: petId, userId } });
    if (!pet) {
      return res
        .status(404)
        .json({ message: "Pet not found or not owned by user" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const totalCount = await prisma.symptom.count({ where: { petId } });
    const symptoms = await prisma.symptom.findMany({
      where: { petId },
      orderBy: { observedAt: "desc" },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalCount / limit);
    res.json({
      symptoms,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching symptoms" });
  }
};

export const updateSymptom = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { type, severity, notes, observedAt } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const existing = await prisma.symptom.findFirst({
      where: { id, pet: { userId } },
    });
    if (!existing) {
      return res.status(404).json({ message: "Symptom not found" });
    }
    if (type !== undefined && !SYMPTOM_TYPES.includes(type)) {
      return res.status(400).json({ message: "Invalid symptom type" });
    }

    const updated = await prisma.symptom.update({
      where: { id },
      data: {
        ...(type && { type }),
        ...(SEVERITIES.includes(severity) && { severity }),
        ...(notes !== undefined && { notes }),
        ...(observedAt && { observedAt: new Date(observedAt) }),
      },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error updating symptom" });
  }
};

export const deleteSymptom = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const existing = await prisma.symptom.findFirst({
      where: { id, pet: { userId } },
    });
    if (!existing) {
      return res.status(404).json({ message: "Symptom not found" });
    }

    await prisma.symptom.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Error deleting symptom" });
  }
};
