import { Response } from "express";
import { PrismaClient, NoteSeverity, ReminderType } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";

const prisma = new PrismaClient();

export const createReminder = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      reminderDate,
      priority,
      reminderType,
      petId,
      relatedRecordId,
      relatedRecordType,
      medicationId,
    } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Verify pet belongs to user if petId is provided
    if (petId) {
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
    }

    const reminder = await prisma.reminder.create({
      data: {
        title,
        description,
        reminderDate: new Date(reminderDate),
        priority: (priority as NoteSeverity) || "MEDIUM",
        reminderType: reminderType as ReminderType,
        petId: petId || null,
        userId,
        relatedRecordId: relatedRecordId || null,
        relatedRecordType: relatedRecordType || null,
        medicationId: medicationId || null,
      },
    });

    res.status(201).json(reminder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating reminder" });
  }
};

export const getAllReminders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Parse filter parameters
    const petId = req.query.petId as string | undefined;
    const reminderType = req.query.reminderType as ReminderType | undefined;
    const isCompleted = req.query.isCompleted
      ? req.query.isCompleted === "true"
      : undefined;
    const priority = req.query.priority as NoteSeverity | undefined;
    const isUnread = req.query.isUnread
      ? req.query.isUnread === "true"
      : undefined;

    // Build where clause
    const where: any = {
      userId,
      ...(petId && { petId }),
      ...(reminderType && { reminderType }),
      ...(isCompleted !== undefined && { isCompleted }),
      ...(priority && { priority }),
      ...(isUnread === true && { viewedAt: null }),
      ...(isUnread === false && { viewedAt: { not: null } }),
    };

    // Get total count for pagination metadata
    const totalCount = await prisma.reminder.count({ where });

    // Fetch paginated reminders
    const reminders = await prisma.reminder.findMany({
      where,
      orderBy: {
        reminderDate: "asc",
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      reminders,
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
    res.status(500).json({ message: "Error fetching reminders" });
  }
};

export const getRemindersByPet = async (req: AuthRequest, res: Response) => {
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

    // Parse filter parameters
    const reminderType = req.query.reminderType as ReminderType | undefined;
    const isCompleted = req.query.isCompleted
      ? req.query.isCompleted === "true"
      : undefined;
    const priority = req.query.priority as NoteSeverity | undefined;

    // Build where clause
    const where: any = {
      userId,
      petId,
      ...(reminderType && { reminderType }),
      ...(isCompleted !== undefined && { isCompleted }),
      ...(priority && { priority }),
    };

    // Get total count for pagination metadata
    const totalCount = await prisma.reminder.count({ where });

    // Fetch paginated reminders
    const reminders = await prisma.reminder.findMany({
      where,
      orderBy: {
        reminderDate: "asc",
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      reminders,
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
    res.status(500).json({ message: "Error fetching reminders" });
  }
};

export const getReminderById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const reminder = await prisma.reminder.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!reminder) {
      return res.status(404).json({ message: "Reminder not found" });
    }

    res.json(reminder);
  } catch (error) {
    res.status(500).json({ message: "Error fetching reminder" });
  }
};

export const updateReminder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      reminderDate,
      priority,
      reminderType,
      petId,
      relatedRecordId,
      relatedRecordType,
      medicationId,
    } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Verify that the reminder exists and belongs to the user
    const existingReminder = await prisma.reminder.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingReminder) {
      return res.status(404).json({ message: "Reminder not found" });
    }

    // Verify pet belongs to user if petId is provided and changed
    if (petId && petId !== existingReminder.petId) {
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
    }

    const updatedReminder = await prisma.reminder.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(reminderDate !== undefined && {
          reminderDate: new Date(reminderDate),
        }),
        ...(priority !== undefined && { priority: priority as NoteSeverity }),
        ...(reminderType !== undefined && {
          reminderType: reminderType as ReminderType,
        }),
        ...(petId !== undefined && { petId: petId || null }),
        ...(relatedRecordId !== undefined && {
          relatedRecordId: relatedRecordId || null,
        }),
        ...(relatedRecordType !== undefined && {
          relatedRecordType: relatedRecordType || null,
        }),
        ...(medicationId !== undefined && {
          medicationId: medicationId || null,
        }),
      },
    });

    res.json(updatedReminder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating reminder" });
  }
};

export const markReminderAsCompleted = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Verify that the reminder exists and belongs to the user
    const existingReminder = await prisma.reminder.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingReminder) {
      return res.status(404).json({ message: "Reminder not found" });
    }

    const updatedReminder = await prisma.reminder.update({
      where: { id },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
    });

    res.json(updatedReminder);
  } catch (error) {
    res.status(500).json({ message: "Error marking reminder as completed" });
  }
};

export const markReminderAsIncomplete = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Verify that the reminder exists and belongs to the user
    const existingReminder = await prisma.reminder.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingReminder) {
      return res.status(404).json({ message: "Reminder not found" });
    }

    const updatedReminder = await prisma.reminder.update({
      where: { id },
      data: {
        isCompleted: false,
        completedAt: null,
      },
    });

    res.json(updatedReminder);
  } catch (error) {
    res.status(500).json({ message: "Error marking reminder as incomplete" });
  }
};

export const markReminderAsViewed = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Verify that the reminder exists and belongs to the user
    const existingReminder = await prisma.reminder.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingReminder) {
      return res.status(404).json({ message: "Reminder not found" });
    }

    const updatedReminder = await prisma.reminder.update({
      where: { id },
      data: {
        viewedAt: new Date(),
      },
    });

    res.json(updatedReminder);
  } catch (error) {
    res.status(500).json({ message: "Error marking reminder as viewed" });
  }
};

export const getUnreadReminders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Parse filter parameters
    const petId = req.query.petId as string | undefined;
    const reminderType = req.query.reminderType as ReminderType | undefined;
    const priority = req.query.priority as NoteSeverity | undefined;

    // Build where clause - only unread (viewedAt is null) and not completed
    const where: any = {
      userId,
      viewedAt: null,
      isCompleted: false,
      ...(petId && { petId }),
      ...(reminderType && { reminderType }),
      ...(priority && { priority }),
    };

    // Get total count for pagination metadata
    const totalCount = await prisma.reminder.count({ where });

    // Fetch paginated unread reminders
    const reminders = await prisma.reminder.findMany({
      where,
      orderBy: {
        reminderDate: "asc",
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      reminders,
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
    res.status(500).json({ message: "Error fetching unread reminders" });
  }
};

export const deleteReminder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Verify that the reminder exists and belongs to the user
    const existingReminder = await prisma.reminder.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingReminder) {
      return res.status(404).json({ message: "Reminder not found" });
    }

    await prisma.reminder.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Error deleting reminder" });
  }
};
