import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth";

export const createWeightEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { petId, weight, measuredAt, note } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const parsedWeight = Number(weight);
    if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
      return res.status(400).json({ message: "Invalid weight" });
    }

    // Verify that the pet belongs to the user
    const pet = await prisma.pet.findFirst({ where: { id: petId, userId } });
    if (!pet) {
      return res
        .status(404)
        .json({ message: "Pet not found or not owned by user" });
    }

    const measuredDate = measuredAt ? new Date(measuredAt) : new Date();

    // Record the history point, and keep Pet.weight in sync with the most
    // recent measurement so the rest of the app still shows the current value.
    const [entry] = await prisma.$transaction([
      prisma.weightEntry.create({
        data: { petId, weight: parsedWeight, measuredAt: measuredDate, note },
      }),
      prisma.pet.update({
        where: { id: petId },
        data: { weight: parsedWeight },
      }),
    ]);

    res.status(201).json(entry);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating weight entry" });
  }
};

export const getWeightsByPet = async (req: AuthRequest, res: Response) => {
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

    const weights = await prisma.weightEntry.findMany({
      where: { petId },
      orderBy: { measuredAt: "asc" },
    });

    res.json({ weights });
  } catch (error) {
    res.status(500).json({ message: "Error fetching weight entries" });
  }
};

export const deleteWeightEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const existing = await prisma.weightEntry.findFirst({
      where: { id, pet: { userId } },
    });
    if (!existing) {
      return res.status(404).json({ message: "Weight entry not found" });
    }

    await prisma.weightEntry.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Error deleting weight entry" });
  }
};
