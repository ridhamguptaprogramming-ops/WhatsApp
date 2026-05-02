import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import User from '../models/User.js';
import { generateTokens, verifyRefreshToken } from '../services/auth.js';
import { AppError } from '../middleware/errorHandler.js';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(2).max(50),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Register new user
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = registerSchema.parse(req.body);
    
// Check if user already exists
    const query: any[] = [{ email: data.email }];
    if (data.phone) {
      query.push({ phone: data.phone });
    }
    const existingUser = await User.findOne({ 
      $or: query
    });
    
    if (existingUser) {
      throw new AppError('User already exists', 400);
    }
    
    // Create new user
    const user = new User({
      email: data.email,
      password: data.password,
      displayName: data.displayName,
      phone: data.phone,
      authProviders: ['local'],
    });
    
    await user.save();
    
    // Generate tokens
    const tokens = await generateTokens(user._id.toString());
    
    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
      },
      ...tokens,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(error.errors[0].message, 400));
      return;
    }
    next(error);
  }
};

// Login user
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = loginSchema.parse(req.body);
    
    // Find user
    const user = await User.findOne({ email: data.email });
    
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }
    
    // Check password
    const isMatch = await user.comparePassword(data.password);
    
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }
    
    // Update user status
    user.status = 'online';
    user.lastSeen = new Date();
    await user.save();
    
    // Generate tokens
    const tokens = await generateTokens(user._id.toString());
    
    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        status: user.status,
      },
      ...tokens,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(error.errors[0].message, 400));
      return;
    }
    next(error);
  }
};

// Refresh token
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    
    if (!token) {
      throw new AppError('Refresh token required', 400);
    }
    
    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    const tokens = await generateTokens(user._id.toString());
    
    res.json({
      message: 'Token refreshed',
      ...tokens,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(error.errors[0].message, 400));
      return;
    }
    next(error);
  }
};

// Logout user
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // In a full implementation, we'd invalidate the refresh token here
    // For now, we'll just update the user status
    
    res.json({
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    res.json({ user });
  } catch (error) {
    next(error);
  }
};
