import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes, createHash } from "crypto";
import { sendResetPasswordEmail } from "../services/emailService";

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Email not verified" });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || "",
      { expiresIn: "30d" }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "Error during login" });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string | undefined;

    if (!token) {
      return res
        .status(400)
        .json({ message: "Verification token is required" });
    }

    const user = await prisma.user.findUnique({
      where: { verificationToken: token },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid verification token" });
    }

    if (
      user.verificationTokenExpires &&
      user.verificationTokenExpires.getTime() < Date.now()
    ) {
      return res
        .status(400)
        .json({ message: "Verification token has expired" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationTokenExpires: null,
      },
    });

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error verifying email" });
  }
};

const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email?: string };

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always respond 200 to avoid enumeration
    if (!user || !user.isVerified) {
      return res.json({
        message: "If this email exists, a reset link was sent",
      });
    }

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: tokenHash,
        passwordResetTokenExpires: expires,
        passwordResetTokenUsed: false,
      } as any,
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";
    const resetLink = `${frontendUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(
      email
    )}`;

    try {
      await sendResetPasswordEmail(user.email, resetLink, user.fullName);
    } catch (emailErr) {
      console.error("Failed to send reset password email:", emailErr);
    }

    return res.json({ message: "If this email exists, a reset link was sent" });
  } catch (error) {
    res.status(500).json({ message: "Error requesting password reset" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, token, newPassword } = req.body as {
      email?: string;
      token?: string;
      newPassword?: string;
    };

    if (!email || !token || !newPassword) {
      return res
        .status(400)
        .json({ message: "Email, token, and new password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    const userWithReset = user as any;

    if (
      !user ||
      !userWithReset.passwordResetToken ||
      !userWithReset.passwordResetTokenExpires
    ) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    if (userWithReset.passwordResetTokenUsed) {
      return res.status(400).json({ message: "Token already used" });
    }

    if (userWithReset.passwordResetTokenExpires.getTime() < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const tokenHash = hashToken(token);
    if (tokenHash !== userWithReset.passwordResetToken) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetTokenExpires: null,
        passwordResetTokenUsed: true,
      } as any,
    });

    return res.json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error resetting password" });
  }
};
