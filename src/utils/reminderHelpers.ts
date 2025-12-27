import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Parse and validate medication frequency string and return hours between doses
 * Examples: "A cada 12h" -> 12, "A cada 8h" -> 8, "Diariamente" -> 24
 * Returns: { hours: number, isValid: boolean, error?: string }
 */
export function parseFrequency(frequency: string | null | undefined): {
  hours: number;
  isValid: boolean;
  error?: string;
} {
  if (!frequency || frequency.trim() === "") {
    return { hours: 24, isValid: true }; // Default to daily if no frequency specified
  }

  const lowerFreq = frequency.toLowerCase().trim();

  // Check for "a cada Xh" or "a cada X h" pattern (e.g., "A cada 12h", "a cada 8 h")
  const match = lowerFreq.match(/a\s+cada\s+(\d+)\s*h/i);
  if (match) {
    const hours = parseInt(match[1], 10);
    if (hours > 0 && hours <= 24) {
      return { hours, isValid: true };
    } else {
      return {
        hours: 24,
        isValid: false,
        error: `Horas inválidas: ${hours}. Deve ser entre 1 e 24 horas.`,
      };
    }
  }

  // Check for "diariamente" or "daily"
  if (lowerFreq.includes("diariamente") || lowerFreq.includes("daily")) {
    return { hours: 24, isValid: true };
  }

  // Check for "X vezes ao dia" (X times per day)
  const timesPerDayMatch = lowerFreq.match(/(\d+)\s+vezes\s+ao\s+dia/i);
  if (timesPerDayMatch) {
    const timesPerDay = parseInt(timesPerDayMatch[1], 10);
    if (timesPerDay > 0 && timesPerDay <= 24) {
      return { hours: 24 / timesPerDay, isValid: true };
    } else {
      return {
        hours: 24,
        isValid: false,
        error: `Número de vezes inválido: ${timesPerDay}. Deve ser entre 1 e 24 vezes por dia.`,
      };
    }
  }

  // Check for simple number (assume hours)
  const numberMatch = lowerFreq.match(/^(\d+)\s*h?$/i);
  if (numberMatch) {
    const hours = parseInt(numberMatch[1], 10);
    if (hours > 0 && hours <= 24) {
      return { hours, isValid: true };
    }
  }

  // If no pattern matches, return error
  return {
    hours: 24,
    isValid: false,
    error: `Formato de frequência inválido: "${frequency}". Use formatos como "A cada 12h", "Diariamente", ou "3 vezes ao dia".`,
  };
}

/**
 * Generate reminders for a vaccine booster
 */
export async function createVaccineBoosterReminder(
  vaccineRecordId: string,
  petId: string,
  userId: string,
  nextDueDate: Date | null,
  vaccineTypeName: string
) {
  if (!nextDueDate) return;

  const reminder = await prisma.reminder.create({
    data: {
      title: `Booster: ${vaccineTypeName}`,
      description: `Lembrete para aplicar a dose de reforço da vacina ${vaccineTypeName}`,
      reminderDate: nextDueDate,
      priority: "HIGH",
      reminderType: "VACCINE_BOOSTER",
      relatedRecordId: vaccineRecordId,
      relatedRecordType: "vaccine",
      petId,
      userId,
    },
  });

  return reminder;
}

/**
 * Generate a reminder for treatment follow-up (at the end of treatment)
 */
export async function createTreatmentReminders(
  treatmentId: string,
  petId: string,
  userId: string,
  startDate: Date,
  endDate: Date | null,
  cause: string
) {
  // Create a single reminder at the end date for follow-up
  // If no end date, create reminder at start date to check on treatment
  const reminderDate = endDate ? new Date(endDate) : new Date(startDate);
  reminderDate.setHours(9, 0, 0, 0); // Set to 9 AM

  const reminder = await prisma.reminder.create({
    data: {
      title: `Tratamento: ${cause}${endDate ? " - Seguimento" : ""}`,
      description: endDate
        ? `Lembrete de seguimento após o término do tratamento`
        : `Lembrete para verificar o tratamento`,
      reminderDate,
      priority: "MEDIUM",
      reminderType: "TREATMENT_FOLLOWUP",
      relatedRecordId: treatmentId,
      relatedRecordType: "treatment",
      petId,
      userId,
    },
  });

  return reminder;
}

/**
 * Generate medication reminders based on frequency
 */
export async function createMedicationReminders(
  medicationId: string,
  treatmentId: string,
  petId: string,
  userId: string,
  medicationName: string,
  dosage: string | null,
  frequency: string | null,
  startDate: Date,
  endDate: Date | null,
  treatmentEndDate?: Date | null
) {
  const frequencyResult = parseFrequency(frequency);
  const hoursBetweenDoses = frequencyResult.hours;

  // Log warning if frequency is invalid but still create reminders with default
  if (!frequencyResult.isValid && frequency) {
    console.warn(
      `Invalid frequency format for medication ${medicationName}: ${frequencyResult.error}. Using default: ${hoursBetweenDoses} hours.`
    );
  }

  const reminders = [];

  const currentDate = new Date(startDate);
  // Use medication endDate, or treatment endDate, or 30 days from start as fallback
  let end: Date;
  if (endDate) {
    end = new Date(endDate);
  } else if (treatmentEndDate) {
    end = new Date(treatmentEndDate);
  } else {
    // Default to 30 days from start if no end date
    end = new Date(startDate);
    end.setDate(end.getDate() + 30);
  }
  end.setHours(23, 59, 59, 999); // End of day

  // Limit to prevent creating too many reminders (max 1000)
  let reminderCount = 0;
  const maxReminders = 1000;

  // Create reminders based on frequency
  while (currentDate <= end && reminderCount < maxReminders) {
    const reminder = await prisma.reminder.create({
      data: {
        title: `Medicamento: ${medicationName}${dosage ? ` (${dosage})` : ""}`,
        description: `Lembrete para administrar ${medicationName}${
          dosage ? ` - ${dosage}` : ""
        }${frequency ? ` - ${frequency}` : ""}`,
        reminderDate: new Date(currentDate),
        priority: "HIGH",
        reminderType: "MEDICATION",
        relatedRecordId: treatmentId,
        relatedRecordType: "medication",
        medicationId,
        petId,
        userId,
      },
    });
    reminders.push(reminder);
    reminderCount++;

    // Move to next dose time
    currentDate.setHours(currentDate.getHours() + hoursBetweenDoses);
  }

  return reminders;
}

/**
 * Delete reminders related to a record
 */
export async function deleteRelatedReminders(
  relatedRecordId: string,
  relatedRecordType: string
) {
  await prisma.reminder.deleteMany({
    where: {
      relatedRecordId,
      relatedRecordType,
    },
  });
}

/**
 * Delete medication reminders for a specific medication
 */
export async function deleteMedicationReminders(medicationId: string) {
  await prisma.reminder.deleteMany({
    where: {
      medicationId,
    },
  });
}
