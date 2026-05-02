import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import { config } from '../config/env.js';
import { AppError } from './errorHandler.js';
import User from '../models/User.js';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

export const auth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = verify(token, config.jwt.secret);
      req.user = decoded as { userId: string };
    } catch {
      throw new AppError('Invalid or expired token', 401);
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      try {
        const decoded = verify(token, config.jwt.secret);
        req.user = decoded as { userId: string };
      } catch {
        // Token invalid, but we continue without auth
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

// Check if user exists in database
export const requireUser = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }
    
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    next();
  } catch (error) {
    next(error);
  }
};
