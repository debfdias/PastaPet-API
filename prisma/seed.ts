import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

// Verified demo accounts so the app can be used locally without email verification.
const DEMO_PASSWORD = "pastapet123";
const DEMO_USERS = [
  { email: "owner@pastapet.local", fullName: "Demo Owner" },
  { email: "second@pastapet.local", fullName: "Demo Second User" },
];

async function seedDemoUsers() {
  const password = await bcrypt.hash(DEMO_PASSWORD, 10);
  for (const u of DEMO_USERS) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { isVerified: true },
      create: { ...u, password, isVerified: true },
    });
  }
  console.log(`✅ Demo users ready (password: ${DEMO_PASSWORD})`);
}


async function main() {
  await prisma.vaccineType.createMany({
    data: [
      {
        name: "V8",
        diseaseCovered: [
          "Cinomose",
          "Hepatite Infecciosa",
          "Adenovirose tipo 2",
          "Parainfluenza",
          "Parvovirose",
          "Coronavirose",
          "Leptospirose (2 tipos)",
        ],
        isCore: true,
        boosterRequired: true,
        boosterIntervalMonths: 12,
        totalRequiredDoses: 3,
      },
      {
        name: "V10",
        diseaseCovered: [
          "Cinomose",
          "Hepatite Infecciosa",
          "Adenovirose tipo 2",
          "Parainfluenza",
          "Parvovirose",
          "Coronavirose",
          "Leptospirose (4 tipos)",
        ],
        isCore: true,
        boosterRequired: true,
        boosterIntervalMonths: 12,
        totalRequiredDoses: 3,
      },
      {
        name: "Raiva",
        diseaseCovered: ["Raiva"],
        isCore: true,
        boosterRequired: true,
        boosterIntervalMonths: 36,
        totalRequiredDoses: 1,
      },
      {
        name: "Giárdia",
        diseaseCovered: ["Giardíase"],
        isCore: false,
        boosterRequired: true,
        boosterIntervalMonths: 12,
        totalRequiredDoses: 2,
      },
      {
        name: "Gripe Canina",
        diseaseCovered: ["Tosse dos Canis (Bordetella + Parainfluenza)"],
        isCore: false,
        boosterRequired: true,
        boosterIntervalMonths: 12,
        totalRequiredDoses: 1,
      },

      // 🐱 Vacinas para Gatos
      {
        name: "V3 (Tríplice Felina)",
        diseaseCovered: [
          "Panleucopenia Felina",
          "Rinotraqueíte Viral",
          "Calicivirose",
        ],
        isCore: true,
        boosterRequired: true,
        boosterIntervalMonths: 12,
        totalRequiredDoses: 3,
      },
      {
        name: "V4",
        diseaseCovered: [
          "Panleucopenia Felina",
          "Rinotraqueíte Viral",
          "Calicivirose",
          "Clamidiose",
        ],
        isCore: true,
        boosterRequired: true,
        boosterIntervalMonths: 12,
        totalRequiredDoses: 3,
      },
      {
        name: "V5",
        diseaseCovered: [
          "Panleucopenia Felina",
          "Rinotraqueíte Viral",
          "Calicivirose",
          "Clamidiose",
          "Leucemia Felina (FeLV)",
        ],
        isCore: true,
        boosterRequired: true,
        boosterIntervalMonths: 12,
        totalRequiredDoses: 3,
      },
      {
        name: "FeLV (Leucemia Felina)",
        diseaseCovered: ["Leucemia Felina (FeLV)"],
        isCore: false,
        boosterRequired: true,
        boosterIntervalMonths: 12,
        totalRequiredDoses: 2,
      },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Tipos de vacinas inseridos com sucesso!");

  await seedDemoUsers();
}

main()
  .catch((e) => {
    console.error("❌ Erro ao inserir vacinas:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
