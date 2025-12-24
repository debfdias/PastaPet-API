import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";

const prisma = new PrismaClient();

export const createVaccineRecord = async (req: AuthRequest, res: Response) => {
  try {
    const {
      petId,
      vaccineTypeId,
      administrationDate,
      nextDueDate,
      validUntil,
      lotNumber,
      administeredBy,
      notes,
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

    const vaccineRecord = await prisma.vaccineRecord.create({
      data: {
        petId,
        vaccineTypeId,
        administrationDate: new Date(administrationDate),
        nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
        lotNumber,
        administeredBy,
        notes,
      },
      include: {
        vaccineType: true,
      },
    });

    res.status(201).json(vaccineRecord);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating vaccine record" });
  }
};

export const getVaccineRecordsByPet = async (
  req: AuthRequest,
  res: Response
) => {
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
    const totalCount = await prisma.vaccineRecord.count({
      where: {
        petId,
      },
    });

    // Fetch paginated vaccine records
    const vaccineRecords = await prisma.vaccineRecord.findMany({
      where: {
        petId,
      },
      include: {
        vaccineType: true,
      },
      orderBy: {
        administrationDate: "desc",
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      vaccineRecords,
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
    res.status(500).json({ message: "Error fetching vaccine records" });
  }
};

export const getVaccineRecordById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const vaccineRecord = await prisma.vaccineRecord.findFirst({
      where: {
        id,
        pet: {
          userId,
        },
      },
      include: {
        vaccineType: true,
      },
    });

    if (!vaccineRecord) {
      return res.status(404).json({ message: "Vaccine record not found" });
    }

    res.json(vaccineRecord);
  } catch (error) {
    res.status(500).json({ message: "Error fetching vaccine record" });
  }
};

export const updateVaccineRecord = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      administrationDate,
      nextDueDate,
      validUntil,
      lotNumber,
      administeredBy,
      notes,
    } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Verify that the vaccine record exists and belongs to the user's pet
    const existingRecord = await prisma.vaccineRecord.findFirst({
      where: {
        id,
        pet: {
          userId,
        },
      },
    });

    if (!existingRecord) {
      return res.status(404).json({ message: "Vaccine record not found" });
    }

    const updatedVaccineRecord = await prisma.vaccineRecord.update({
      where: { id },
      data: {
        administrationDate: administrationDate
          ? new Date(administrationDate)
          : undefined,
        nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
        lotNumber,
        administeredBy,
        notes,
      },
      include: {
        vaccineType: true,
      },
    });

    res.json(updatedVaccineRecord);
  } catch (error) {
    res.status(500).json({ message: "Error updating vaccine record" });
  }
};

export const deleteVaccineRecord = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Verify that the vaccine record exists and belongs to the user's pet
    const existingRecord = await prisma.vaccineRecord.findFirst({
      where: {
        id,
        pet: {
          userId,
        },
      },
    });

    if (!existingRecord) {
      return res.status(404).json({ message: "Vaccine record not found" });
    }

    await prisma.vaccineRecord.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Error deleting vaccine record" });
  }
};

export const getAllVaccineTypes = async (req: AuthRequest, res: Response) => {
  try {
    const vaccineTypes = await prisma.vaccineType.findMany({
      orderBy: {
        name: "asc",
      },
    });

    res.json(vaccineTypes);
  } catch (error) {
    res.status(500).json({ message: "Error fetching vaccine types" });
  }
};
