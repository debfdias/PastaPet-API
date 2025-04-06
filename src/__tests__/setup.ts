import { PrismaClient } from "@prisma/client";
import { app } from "../index";

export const prisma = new PrismaClient();

beforeAll(async () => {
  // Connect to the test database
  await prisma.$connect();
});

afterAll(async () => {
  // Clean up all data after tests
  const tables = ["Pet", "User"];
  for (const table of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
  }
  // Disconnect from the database
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean up the test database before each test
  const tables = ["Pet", "User"];
  for (const table of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
  }
});
