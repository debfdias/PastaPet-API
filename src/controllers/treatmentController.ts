import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";

const prisma = new PrismaClient();

export const createTreatment = async (req: AuthRequest, res: Response) => {
  try {
    const {
      petId,
      cause,
      description,
      startDate,
      endDate,
      medications, // Array of medication objects
    } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
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
        .json({ message: "Pet not found or not owned by user" });
    }

    // Create treatment and medications in a single transaction
    const treatment = await prisma.$transaction(async (tx) => {
      // Create the treatment
      const newTreatment = await tx.treatment.create({
        data: {
          petId,
          cause,
          description,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
        },
      });

      // Create medications if provided
      if (medications && medications.length > 0) {
        await tx.medication.createMany({
          data: medications.map((med: any) => ({
            treatmentId: newTreatment.id,
            name: med.name,
            dosage: med.dosage,
            frequency: med.frequency,
            notes: med.notes,
            startDate: new Date(med.startDate),
            endDate: med.endDate ? new Date(med.endDate) : null,
          })),
        });
      }

      // Return treatment with medications
      return tx.treatment.findUnique({
        where: { id: newTreatment.id },
        include: {
          medications: true,
        },
      });
    });

    res.status(201).json(treatment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating treatment record" });
  }
};

export const getTreatmentsByPet = async (req: AuthRequest, res: Response) => {
  try {
    const { petId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
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
        .json({ message: "Pet not found or not owned by user" });
    }

    const treatments = await prisma.treatment.findMany({
      where: {
        petId,
      },
      include: {
        medications: true,
        exams: true,
      },
      orderBy: {
        startDate: "desc",
      },
    });

    res.json(treatments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching treatment records" });
  }
};

export const getTreatmentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const treatment = await prisma.treatment.findFirst({
      where: {
        id,
        pet: {
          userId,
        },
      },
      include: {
        medications: true,
        exams: true,
      },
    });

    if (!treatment) {
      return res.status(404).json({ message: "Treatment record not found" });
    }

    res.json(treatment);
  } catch (error) {
    res.status(500).json({ message: "Error fetching treatment record" });
  }
};

export const updateTreatment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { cause, description, startDate, endDate } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Verify that the treatment record exists and belongs to the user's pet
    const existingTreatment = await prisma.treatment.findFirst({
      where: {
        id,
        pet: {
          userId,
        },
      },
    });

    if (!existingTreatment) {
      return res.status(404).json({ message: "Treatment record not found" });
    }

    const updatedTreatment = await prisma.treatment.update({
      where: { id },
      data: {
        cause,
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        medications: true,
        exams: true,
      },
    });

    res.json(updatedTreatment);
  } catch (error) {
    res.status(500).json({ message: "Error updating treatment record" });
  }
};

export const deleteTreatment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Verify that the treatment record exists and belongs to the user's pet
    const existingTreatment = await prisma.treatment.findFirst({
      where: {
        id,
        pet: {
          userId,
        },
      },
    });

    if (!existingTreatment) {
      return res.status(404).json({ message: "Treatment record not found" });
    }

    // Delete treatment (this will cascade delete medications due to the relation)
    await prisma.treatment.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Error deleting treatment record" });
  }
};
