import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";
import {
  createTreatmentReminders,
  createMedicationReminders,
  deleteRelatedReminders,
  deleteMedicationReminders,
} from "../utils/reminderHelpers";

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

    if (!treatment) {
      return res
        .status(500)
        .json({ message: "Error creating treatment record" });
    }

    // Create reminders AFTER transaction completes (to avoid timeout)
    // Wrap in try-catch so reminder failures don't break the response
    try {
      // Create treatment reminder
      await createTreatmentReminders(
        treatment.id,
        petId,
        userId,
        treatment.startDate,
        treatment.endDate,
        cause
      );

      // Create medication reminders
      if (treatment.medications && treatment.medications.length > 0) {
        for (const medication of treatment.medications) {
          await createMedicationReminders(
            medication.id,
            treatment.id,
            petId,
            userId,
            medication.name,
            medication.dosage,
            medication.frequency,
            medication.startDate,
            medication.endDate,
            treatment.endDate
          );
        }
      }
    } catch (reminderError) {
      // Log error but don't fail the request - treatment is already created
      console.error(
        "Error creating reminders for treatment:",
        treatment.id,
        reminderError
      );
    }

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

    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination metadata
    const totalCount = await prisma.treatment.count({
      where: {
        petId,
      },
    });

    // Fetch paginated treatments
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
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      treatments,
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
    res.status(500).json({ message: "Error fetching treatment records" });
  }
};

// Returns the user's pets that are currently under treatment, i.e. have at least
// one ongoing/open-ended treatment (endDate is null or still in the future),
// grouped by pet with a count of active treatments.
export const getActiveTreatments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // limit is optional: when omitted, return every pet under treatment
    // (used by the dashboard to populate its "view all" modal).
    const limitParam = req.query.limit as string | undefined;
    const limit = limitParam ? parseInt(limitParam) : undefined;
    const now = new Date();

    const treatments = await prisma.treatment.findMany({
      where: {
        pet: { userId, active: true },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      include: {
        pet: { select: { id: true, name: true, image: true } },
      },
      orderBy: { startDate: "desc" },
    });

    // Group by pet, preserving first-seen order, counting active treatments.
    // Treatments are ordered by startDate desc, so the first one seen for a pet
    // is its most recent active treatment — use its cause as the row's reason.
    const petsMap = new Map<
      string,
      {
        id: string;
        name: string;
        image: string | null;
        cause: string;
        activeTreatmentCount: number;
      }
    >();

    for (const treatment of treatments) {
      const existing = petsMap.get(treatment.pet.id);
      if (existing) {
        existing.activeTreatmentCount += 1;
      } else {
        petsMap.set(treatment.pet.id, {
          id: treatment.pet.id,
          name: treatment.pet.name,
          image: treatment.pet.image,
          cause: treatment.cause,
          activeTreatmentCount: 1,
        });
      }
    }

    const pets = Array.from(petsMap.values());

    res.json({
      pets: limit ? pets.slice(0, limit) : pets,
      totalCount: pets.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching active treatments" });
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

    // Update treatment reminders if dates changed
    if (startDate || endDate !== undefined) {
      // Delete old treatment reminders
      await deleteRelatedReminders(id, "treatment");
      // Create new reminders
      await createTreatmentReminders(
        id,
        updatedTreatment.petId,
        userId,
        updatedTreatment.startDate,
        updatedTreatment.endDate,
        updatedTreatment.cause
      );
    }

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

    // Get medications before deletion to delete their reminders
    const medications = await prisma.medication.findMany({
      where: { treatmentId: id },
    });

    // Delete medication reminders
    for (const medication of medications) {
      await deleteMedicationReminders(medication.id);
    }

    // Delete treatment reminders
    await deleteRelatedReminders(id, "treatment");

    // Delete treatment (this will cascade delete medications due to the relation)
    await prisma.treatment.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Error deleting treatment record" });
  }
};
