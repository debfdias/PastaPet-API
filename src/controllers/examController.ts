import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";

const prisma = new PrismaClient();

export const createExam = async (req: AuthRequest, res: Response) => {
  try {
    const { petId, title, cause, administeredBy, fileUrl, resultSummary } =
      req.body;
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

    const exam = await prisma.exam.create({
      data: {
        petId,
        title,
        cause,
        administeredBy,
        fileUrl,
        resultSummary,
      },
    });

    res.status(201).json(exam);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating exam record" });
  }
};

export const getExamsByPet = async (req: AuthRequest, res: Response) => {
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
    const totalCount = await prisma.exam.count({
      where: {
        petId,
      },
    });

    // Fetch paginated exams
    const exams = await prisma.exam.findMany({
      where: {
        petId,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      exams,
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
    res.status(500).json({ message: "Error fetching exam records" });
  }
};

export const getExamById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const exam = await prisma.exam.findFirst({
      where: {
        id,
        pet: {
          userId,
        },
      },
    });

    if (!exam) {
      return res.status(404).json({ message: "Exam record not found" });
    }

    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: "Error fetching exam record" });
  }
};

export const updateExam = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, cause, administeredBy, fileUrl, resultSummary } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Verify that the exam record exists and belongs to the user's pet
    const existingExam = await prisma.exam.findFirst({
      where: {
        id,
        pet: {
          userId,
        },
      },
    });

    if (!existingExam) {
      return res.status(404).json({ message: "Exam record not found" });
    }

    const updatedExam = await prisma.exam.update({
      where: { id },
      data: {
        title,
        cause,
        administeredBy,
        fileUrl,
        resultSummary,
      },
    });

    res.json(updatedExam);
  } catch (error) {
    res.status(500).json({ message: "Error updating exam record" });
  }
};

export const deleteExam = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Verify that the exam record exists and belongs to the user's pet
    const existingExam = await prisma.exam.findFirst({
      where: {
        id,
        pet: {
          userId,
        },
      },
    });

    if (!existingExam) {
      return res.status(404).json({ message: "Exam record not found" });
    }

    await prisma.exam.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Error deleting exam record" });
  }
};
