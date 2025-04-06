import request from "supertest";
import { app } from "../index";
import { prisma } from "./setup";
import jwt from "jsonwebtoken";

describe("User Routes", () => {
  let authToken: string;
  const testUser = {
    email: "test@example.com",
    password: "password123",
    fullName: "Test User",
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

    // Generate auth token
    authToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || "test-secret",
      { expiresIn: "1h" }
    );
  });

  describe("GET /api/users/profile", () => {
    // it("should get user profile with valid token", async () => {
    //   const response = await request(app)
    //     .get("/api/users/profile")
    //     .set("Authorization", `Bearer ${authToken}`);
    //   expect(response.status).toBe(200);
    //   expect(response.body).toHaveProperty("email", testUser.email);
    //   expect(response.body).toHaveProperty("fullName", testUser.fullName);
    // });
    // it("should fail without auth token", async () => {
    //   const response = await request(app).get("/api/users/profile");
    //   expect(response.status).toBe(401);
    // });
    // it("should fail with invalid auth token", async () => {
    //   const response = await request(app)
    //     .get("/api/users/profile")
    //     .set("Authorization", "Bearer invalid-token");
    //   expect(response.status).toBe(401);
    // });
  });

  describe("POST /api/users", () => {
    const newUser = {
      email: "new@example.com",
      password: "newpassword123",
      fullName: "New User",
    };

    it("should create a new user", async () => {
      const response = await request(app).post("/api/users").send(newUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("email", newUser.email);
      expect(response.body).toHaveProperty("fullName", newUser.fullName);
      expect(response.body).not.toHaveProperty("password");
    });

    it("should fail when creating user with existing email", async () => {
      const response = await request(app).post("/api/users").send(testUser);

      expect(response.status).toBe(400);
    });
  });
});
