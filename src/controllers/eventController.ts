import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";

const prisma = new PrismaClient();

export const createEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { title, type, petId, eventDate } = req.body;
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

    const event = await prisma.event.create({
      data: {
        title,
        type,
        petId,
        userId,
        eventDate: new Date(eventDate),
      },
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: "Error creating event" });
  }
};

export const getEventsByPet = async (req: AuthRequest, res: Response) => {
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
    const limit = parseInt(req.query.limit as string) || 5;
    const skip = (page - 1) * limit;

    // Get total count for pagination metadata
    const totalCount = await prisma.event.count({
      where: {
        petId,
      },
    });

    // Fetch paginated events
    const events = await prisma.event.findMany({
      where: {
        petId,
      },
      orderBy: {
        eventDate: "desc",
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      events,
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
    res.status(500).json({ message: "Error fetching events" });
  }
};

export const getAllEvents = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination metadata
    const totalCount = await prisma.event.count({
      where: {
        userId,
      },
    });

    // Fetch paginated events
    const events = await prisma.event.findMany({
      where: {
        userId,
      },
      include: {
        pet: true,
      },
      orderBy: {
        eventDate: "desc",
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      events,
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
    res.status(500).json({ message: "Error fetching events" });
  }
};

export const getEventById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const event = await prisma.event.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: "Error fetching event" });
  }
};

export const updateEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, type } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Verify that the event exists and belongs to the user
    const existingEvent = await prisma.event.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        title,
        type,
      },
    });

    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: "Error updating event" });
  }
};
