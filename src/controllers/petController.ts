import { Response } from "express";
import { prisma } from "../lib/prisma";
import { PetType, PetGender, FivFelvStatus } from "../generated/prisma/client";
import { AuthRequest } from "../middleware/auth";


export const createPet = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      dob,
      weight,
      type,
      breed,
      image,
      gender,
      hasPetPlan,
      petPlanName,
      hasFuneraryPlan,
      funeraryPlanStartDate,
      fivStatus,
      felvStatus,
    } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!name || !type || !dob || weight === undefined || weight === null) {
      return res
        .status(400)
        .json({ message: "name, type, dob and weight are required" });
    }

    const pet = await prisma.pet.create({
      data: {
        name,
        dob: new Date(dob),
        weight: parseFloat(weight),
        type: type as PetType,
        breed,
        image,
        userId,
        gender: gender as PetGender,
        hasPetPlan: hasPetPlan || false,
        petPlanName,
        hasFuneraryPlan: hasFuneraryPlan || false,
        funeraryPlanStartDate: funeraryPlanStartDate
          ? new Date(funeraryPlanStartDate)
          : undefined,
        ...(fivStatus && { fivStatus: fivStatus as FivFelvStatus }),
        ...(felvStatus && { felvStatus: felvStatus as FivFelvStatus }),
      },
    });

    res.status(201).json(pet);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error creating pet" });
  }
};

export const getPets = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { type, name, orderByAge, underTreatment } = req.query;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const now = new Date();

    const pets = await prisma.pet.findMany({
      where: {
        userId,
        active: true,
        ...(type ? { type: type as PetType } : {}),
        ...(name
          ? { name: { contains: name as string, mode: "insensitive" } }
          : {}),
        // Only pets with at least one ongoing/open-ended treatment
        ...(underTreatment === "true"
          ? {
              Treatment: {
                some: {
                  OR: [{ endDate: null }, { endDate: { gte: now } }],
                },
              },
            }
          : {}),
      },
      orderBy: {
        ...(orderByAge
          ? { dob: orderByAge as "asc" | "desc" }
          : { createdAt: "desc" }),
      },
    });

    res.json(pets);
  } catch (error) {
    res.status(500).json({ message: "Error fetching pets" });
  }
};

export const getPetById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const pet = await prisma.pet.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!pet) {
      return res.status(404).json({ message: "Pet not found" });
    }

    res.json(pet);
  } catch (error) {
    res.status(500).json({ message: "Error fetching pet" });
  }
};

export const updatePet = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const {
      name,
      dob,
      weight,
      type,
      breed,
      image,
      active,
      hasPetPlan,
      petPlanName,
      hasFuneraryPlan,
      funeraryPlanStartDate,
      fivStatus,
      felvStatus,
    } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // First check if the pet exists and belongs to the user
    const existingPet = await prisma.pet.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingPet) {
      return res.status(404).json({ message: "Pet not found" });
    }

    const updatedPet = await prisma.pet.update({
      where: { id },
      data: {
        name,
        dob: dob ? new Date(dob) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        type: type as PetType,
        breed,
        image,
        ...(active !== undefined && { active }),
        ...(hasPetPlan !== undefined && { hasPetPlan }),
        petPlanName,
        ...(hasFuneraryPlan !== undefined && { hasFuneraryPlan }),
        ...(funeraryPlanStartDate !== undefined && {
          funeraryPlanStartDate: funeraryPlanStartDate
            ? new Date(funeraryPlanStartDate)
            : null,
        }),
        ...(fivStatus !== undefined && { fivStatus: fivStatus as FivFelvStatus }),
        ...(felvStatus !== undefined && {
          felvStatus: felvStatus as FivFelvStatus,
        }),
      },
    });

    res.json(updatedPet);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error updating pet" });
  }
};

export const getInactivePets = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { type, name, orderByAge } = req.query;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const pets = await prisma.pet.findMany({
      where: {
        userId,
        active: false,
        ...(type ? { type: type as PetType } : {}),
        ...(name
          ? { name: { contains: name as string, mode: "insensitive" } }
          : {}),
      },
      orderBy: {
        ...(orderByAge
          ? { dob: orderByAge as "asc" | "desc" }
          : { createdAt: "desc" }),
      },
    });

    res.json(pets);
  } catch (error) {
    res.status(500).json({ message: "Error fetching inactive pets" });
  }
};

export const deletePet = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // First check if the pet exists and belongs to the user
    const existingPet = await prisma.pet.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingPet) {
      return res.status(404).json({ message: "Pet not found" });
    }

    await prisma.pet.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Error deleting pet" });
  }
};
