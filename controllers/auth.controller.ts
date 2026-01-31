import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import type {
  loginUserRequestBody,
  registerNewUserRequestBody,
} from '../interfaces/auth.ts';
import { isValidEmail, isValidPassword } from '../validators/auth.ts';
import prisma from '../prisma/prismaClient.ts';
import { normalizeEmail } from '../utils/index.ts';

// register new user
export const registerNewUser = async (req: Request, res: Response) => {
  try {
    const { email, password, name, phoneNumber } =
      req.body as registerNewUserRequestBody;

    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
      });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        message: 'Invalid email format',
      });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        message:
          'Password must be at least 8 characters and include uppercase, lowercase, number, and special character',
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        message: 'User already exists with this email',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name,
        phone: phoneNumber,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: 'User registered successfully',
      user,
    });
  } catch (error) {
    console.error('Register error:', error);

    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

// login user
export const loginUser = async (req: Request, res: Response) => {
  // Implementation for user login goes here
  const { email, password } = req.body as loginUserRequestBody;

  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    return res.status(400).json({
      message: 'Email and password are both required',
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { normalizedEmail },
    });

    if (!user) {
      return res.status(401).json({
        message: 'User not found',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Password is incorrect',
      });
    }

    // Generate JWT token
    const payload = { id: user.id, email: user.email, role: user.role };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET as string, {
      expiresIn: '15m',
    });

    const refreshToken = crypto.randomBytes(64).toString('hex');
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days expiry

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: refreshTokenExpiry,
      },
    });

    // send refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: refreshTokenExpiry,
    });

    return res.status(200).json({
      message: 'Login successful',
      accessToken,
    });
  } catch (error) {
    console.error('Login error:', error);

    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

// refresh access token
export const refreshAccessToken = async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token missing' });
  }

  const storedRefreshToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!storedRefreshToken || storedRefreshToken.expiresAt < new Date()) {
    return res
      .status(401)
      .json({ message: 'Invalid or expired refresh token' });
  }

  const user = await prisma.user.findUnique({
    where: { id: storedRefreshToken.userId },
  });

  if (!user) {
    return res.status(401).json({ message: 'User not found' });
  }

  const payload = { id: user.id, email: user.email, role: user.role };

  const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: '15m',
  });

  return res.status(200).json({
    accessToken: newAccessToken,
  });
};

// logout user
export const logoutUser = async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken) {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  return res.status(204).json({ message: 'Logged out successfully' });
};
