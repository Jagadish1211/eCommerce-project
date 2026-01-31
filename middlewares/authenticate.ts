import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

// middleware to verify JWT token

export const verifyToken = (req: Request, res: Response, next: any) => {
  const authHeader = req.headers?.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token missing' });
  }

  const jswToken = authHeader.split(' ')[1] ?? '';

  try {
    const decoded = jwt.verify(jswToken, process.env.JWT_SECRET as string);
    (req as any).user = decoded;

    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
