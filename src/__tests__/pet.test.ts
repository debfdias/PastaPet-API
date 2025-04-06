import request from "supertest";
import { app } from "../index";
import { prisma } from "./setup";
import jwt from "jsonwebtoken";
import { PetType } from "@prisma/client";

describe("Pet Routes", () => {
  let authToken: string;
  let userId: string;
  let testPetId: string;

  const testUser = {
    email: "test@example.com",
    password: "password123",
    fullName: "Test User",
  };

  const testPet = {
    name: "Fluffy",
    type: PetType.CAT,
    breed: "Persian",
    dob: new Date("2020-01-01"),
    weight: 4.5,
  };

  beforeEach(async () => {
    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: testUser.email,
        password: testUser.password,
        fullName: testUser.fullName,
      },
    });
    userId = user.id;

    // Create a test pet
    const pet = await prisma.pet.create({
      data: {
        ...testPet,
        userId: user.id,
      },
    });
    testPetId = pet.id;

    // Generate auth token
    authToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || "test-secret",
      { expiresIn: "1h" }
    );
  });

  describe("GET /api/pets", () => {
    // it("should get all pets", async () => {
    //   const response = await request(app)
    //     .get("/api/pets")
    //     .set("Authorization", `Bearer ${authToken}`);

    //   expect(response.status).toBe(200);
    //   expect(Array.isArray(response.body)).toBe(true);
    //   expect(response.body.length).toBeGreaterThan(0);
    //   expect(response.body[0]).toHaveProperty("name", testPet.name);
    // });

    it("should fail without auth token", async () => {
      const response = await request(app).get("/api/pets");

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/pets/:id", () => {
    it("should get a specific pet", async () => {
      const response = await request(app)
        .get(`/api/pets/${testPetId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("name", testPet.name);
      expect(response.body).toHaveProperty("type", testPet.type);
    });

    it("should return 404 for non-existent pet", async () => {
      const response = await request(app)
        .get("/api/pets/nonexistent-id")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/pets", () => {
    const newPet = {
      name: "Buddy",
      type: PetType.DOG,
      breed: "Golden Retriever",
      dob: new Date("2022-01-01"),
      weight: 30.0,
    };

    it("should create a new pet", async () => {
      const response = await request(app)
        .post("/api/pets")
        .set("Authorization", `Bearer ${authToken}`)
        .send(newPet);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("name", newPet.name);
      expect(response.body).toHaveProperty("userId", userId);
    });

    it("should fail without required fields", async () => {
      const response = await request(app)
        .post("/api/pets")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Incomplete Pet" });

      expect(response.status).toBe(400);
    });
  });

  describe("PUT /api/pets/:id", () => {
    const updatedInfo = {
      name: "Updated Fluffy",
      weight: 5.0,
    };

    it("should update a pet", async () => {
      const response = await request(app)
        .put(`/api/pets/${testPetId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updatedInfo);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("name", updatedInfo.name);
      expect(response.body).toHaveProperty("weight", updatedInfo.weight);
    });

    it("should fail to update non-existent pet", async () => {
      const response = await request(app)
        .put("/api/pets/nonexistent-id")
        .set("Authorization", `Bearer ${authToken}`)
        .send(updatedInfo);

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/pets/:id", () => {
    it("should delete a pet", async () => {
      const response = await request(app)
        .delete(`/api/pets/${testPetId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      // Verify pet is deleted
      const verifyResponse = await request(app)
        .get(`/api/pets/${testPetId}`)
        .set("Authorization", `Bearer ${authToken}`);
      expect(verifyResponse.status).toBe(404);
    });

    it("should fail to delete non-existent pet", async () => {
      const response = await request(app)
        .delete("/api/pets/nonexistent-id")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});
