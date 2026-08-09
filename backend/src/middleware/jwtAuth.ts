import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

export interface JwtAuthenticatedRequest extends Request {
  jwtUser?: JwtPayload;
}

const JWT_SECRET = process.env.JWT_SECRET || 'skrillpay_dev_jwt_secret_change_in_production';

export function authenticateJwt(
  req: JwtAuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ status: false, message: 'Unauthorized: Missing JWT token' });
    return;
  }

  const token = authHeader.split(' ')[1].trim();

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.jwtUser = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ status: false, message: 'Unauthorized: Token expired, please log in again' });
    } else {
      res.status(401).json({ status: false, message: 'Unauthorized: Invalid token' });
    }
  }
}

export function requireAdmin(
  req: JwtAuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.jwtUser?.isAdmin) {
    res.status(403).json({ status: false, message: 'Forbidden: Admin access required' });
    return;
  }
  next();
}

export function signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
