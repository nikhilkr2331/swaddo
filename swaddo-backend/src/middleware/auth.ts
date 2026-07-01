import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: number; role: string };
    req.user = payload;
    next();
  } catch (err: any) {
    console.error('JWT Verify Error:', err.message, 'Token:', token);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const requireRole = (role: string) => (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== role) {
    return res.status(403).json({ message: 'Forbidden: Insufficient privileges' });
  }
  next();
};

export const requireCustomer = requireRole('customer');
export const requireVendor = requireRole('vendor');
export const requireDelivery = requireRole('delivery');
export const requireAdmin = requireRole('admin');
