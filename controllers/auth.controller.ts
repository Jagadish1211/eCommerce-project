import type { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import type { registerNewUserRequestBody } from '../interfaces/auth.ts'
import { isValidEmail, isValidPassword } from '../validators/auth.ts'
import prisma from '../prisma/prismaClient.ts'

export const registerNewUser = async (req: Request, res: Response) => {
  try {
    const { email, password, name, phoneNumber } =
      req.body as registerNewUserRequestBody

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
      })
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: 'Invalid email format',
      })
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        message:
          'Password must be at least 8 characters and include uppercase, lowercase, number, and special character',
      })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return res.status(409).json({
        message: 'User already exists with this email',
      })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        email,
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
    })

    return res.status(201).json({
      message: 'User registered successfully',
      user,
    })
  } catch (error) {
    console.error('Register error:', error)

    return res.status(500).json({
      message: 'Internal server error',
    })
  }
}
