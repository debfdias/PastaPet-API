import { Request, Response } from "express";
import { randomBytes } from "crypto";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth";

/**
 * Aggregates the full health record for a single pet. Deliberately omits
 * owner identifiers (userId / user) so the same shape is safe to serve on the
 * public share endpoint.
 */
async function buildPetReport(petId: string) {
  const pet = await prisma.pet.findUnique({
    where: { id: petId },
    select: {
      id: true,
      name: true,
      dob: true,
      weight: true,
      type: true,
      breed: true,
      gender: true,
      image: true,
      active: true,
      hasPetPlan: true,
      petPlanName: true,
      fivStatus: true,
      felvStatus: true,
      createdAt: true,
    },
  });

  if (!pet) return null;

  const [weightEntries, symptoms, treatments, exams, vaccines, notes] =
    await Promise.all([
      prisma.weightEntry.findMany({
        where: { petId },
        orderBy: { measuredAt: "asc" },
      }),
      prisma.symptom.findMany({
        where: { petId },
        orderBy: { observedAt: "desc" },
      }),
      prisma.treatment.findMany({
        where: { petId },
        orderBy: { startDate: "desc" },
        include: { medications: true },
      }),
      prisma.exam.findMany({
        where: { petId },
        orderBy: { examDate: "desc" },
      }),
      prisma.vaccineRecord.findMany({
        where: { petId },
        orderBy: { administrationDate: "desc" },
        include: { vaccineType: true },
      }),
      prisma.note.findMany({
        where: { petId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  return { pet, weightEntries, symptoms, treatments, exams, vaccines, notes };
}

// GET /api/reports/pet/:petId  (authenticated, owner only)
export const getPetReport = async (req: AuthRequest, res: Response) => {
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

    const report = await buildPetReport(petId);
    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error building report" });
  }
};

// GET /api/reports/pet/:petId/share  (authenticated) — current active link, if any
export const getShare = async (req: AuthRequest, res: Response) => {
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

    const share = await prisma.reportShare.findFirst({
      where: { petId, enabled: true },
      orderBy: { createdAt: "desc" },
    });

    res.json({ share });
  } catch (error) {
    res.status(500).json({ message: "Error fetching share link" });
  }
};

// POST /api/reports/pet/:petId/share  (authenticated) — create/return a link
export const createShare = async (req: AuthRequest, res: Response) => {
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

    // Reuse an existing active link so the shared URL stays stable.
    const existing = await prisma.reportShare.findFirst({
      where: { petId, enabled: true },
      orderBy: { createdAt: "desc" },
    });
    if (existing) {
      return res.status(200).json(existing);
    }

    const token = randomBytes(24).toString("hex");
    const share = await prisma.reportShare.create({
      data: { petId, token },
    });

    res.status(201).json(share);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating share link" });
  }
};

// DELETE /api/reports/pet/:petId/share  (authenticated) — revoke all links
export const revokeShare = async (req: AuthRequest, res: Response) => {
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

    await prisma.reportShare.updateMany({
      where: { petId, enabled: true },
      data: { enabled: false },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Error revoking share link" });
  }
};

// GET /api/reports/public/:token  (PUBLIC, no auth)
export const getPublicReport = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const share = await prisma.reportShare.findUnique({ where: { token } });
    if (
      !share ||
      !share.enabled ||
      (share.expiresAt && share.expiresAt < new Date())
    ) {
      return res.status(404).json({ message: "Report not found" });
    }

    const report = await buildPetReport(share.petId);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: "Error loading shared report" });
  }
};
