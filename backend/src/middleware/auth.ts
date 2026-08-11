import { Request, Response, NextFunction } from 'express';
import db from '../db';
import { AuthUtils } from '../utils/auth';
import { User } from '../types';

export interface AuthenticatedRequest extends Request {
  merchant?: User;
}

export async function authenticateApiKey(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ status: false, message: 'Unauthorized: Missing or invalid Authorization header' });
    return;
  }

  const rawApiKey = authHeader.split(' ')[1].trim();
  if (!rawApiKey) {
    res.status(401).json({ status: false, message: 'Unauthorized: Empty API key provided' });
    return;
  }

  try {
    const keyHash = AuthUtils.hashApiKey(rawApiKey);
    let result = await db.query('SELECT * FROM users WHERE api_key_hash = $1 OR api_key = $2', [keyHash, rawApiKey]);

    if (result.rows.length === 0) {
      res.status(401).json({ status: false, message: 'Unauthorized: Invalid API key' });
      return;
    }

    const merchant: User = result.rows[0];

    if (merchant.status === 'suspended' || merchant.kyc_status === 'suspended') {
      res.status(403).json({ status: false, message: 'Forbidden: Merchant account is suspended' });
      return;
    }

    req.merchant = merchant;
    next();
  } catch (error: any) {
    console.error('API key auth middleware error:', error);
    res.status(500).json({ status: false, message: 'Internal server error during authentication' });
  }
}
