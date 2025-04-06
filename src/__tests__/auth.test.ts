import request from "supertest";
import { app } from "../index";
import { prisma } from "./setup";
import bcrypt from "bcryptjs";

describe("Auth Routes", () => {
  const testUser = {
    email: "test@example.com",
    password: "password123",
    fullName: "Test User",
  };

  describe("POST /api/auth/login", () => {
    it("should login successfully with valid credentials", async () => {
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      await prisma.user.create({
        data: {
          email: testUser.email,
          password: hashedPassword,
          fullName: testUser.fullName,
        },
      });

      const response = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        password: testUser.password,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
    });

    it("should fail with invalid password", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        password: "wrongpassword",
      });

      expect(response.status).toBe(401);
    });

    it("should fail with non-existent user", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "nonexistent@example.com",
        password: testUser.password,
      });

      expect(response.status).toBe(401);
    });
  });
});
