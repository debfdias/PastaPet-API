import { PrismaClient } from "@prisma/client";
import cron from "node-cron";

const prisma = new PrismaClient();

/**
 * Check for upcoming reminders and send notifications
 * Runs every hour to check for reminders in the next hour
 */
export function startReminderCron() {
  // Run every hour at minute 0 (e.g., 9:00, 10:00, 11:00)
  cron.schedule("0 * * * *", async () => {
    try {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

      // Find reminders that are due in the next hour and not completed
      const upcomingReminders = await prisma.reminder.findMany({
        where: {
          reminderDate: {
            gte: now,
            lte: oneHourLater,
          },
          isCompleted: false,
        },
        include: {
          pet: {
            select: {
              name: true,
            },
          },
        },
      });

      console.log(
        `[Reminder Cron] Found ${upcomingReminders.length} upcoming reminders`
      );

      // Process each reminder
      for (const reminder of upcomingReminders) {
        await processReminder(reminder);
      }
    } catch (error) {
      console.error("[Reminder Cron] Error processing reminders:", error);
    }
  });

  console.log("[Reminder Cron] Started - checking reminders every hour");
}

/**
 * Process a single reminder (send notification, etc.)
 * This is where you would integrate with your notification service
 * (email, push notifications, SMS, etc.)
 */
async function processReminder(reminder: any) {
  try {
    // TODO: Integrate with your notification service here
    // Examples:
    // - Send email notification
    // - Send push notification
    // - Send SMS
    // - Create in-app notification

    console.log(
      `[Reminder] Processing reminder: ${reminder.title} for pet: ${reminder.pet?.name || "N/A"}`
    );

    // Example: You could mark reminders as "notified" with a new field
    // For now, we just log it
    // await prisma.reminder.update({
    //   where: { id: reminder.id },
    //   data: { notifiedAt: new Date() }
    // });
  } catch (error) {
    console.error(
      `[Reminder Cron] Error processing reminder ${reminder.id}:`,
      error
    );
  }
}

/**
 * Get reminders due now (for immediate processing)
 */
export async function getDueReminders() {
  const now = new Date();
  const fiveMinutesLater = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes buffer

  return await prisma.reminder.findMany({
    where: {
      reminderDate: {
        gte: now,
        lte: fiveMinutesLater,
      },
      isCompleted: false,
    },
    include: {
      pet: {
        select: {
          name: true,
        },
      },
    },
  });
}


