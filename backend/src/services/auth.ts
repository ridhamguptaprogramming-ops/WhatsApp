import { sign, verify } from 'jsonwebtoken';
import { config } from '../config/env.js';

export interface TokenPayload {
  userId: string;
}

export interface RefreshPayload {
  userId: string;
  tokenId: string;
}

export const generateAccessToken = (userId: string): string => {
  return sign({ userId }, config.jwt.secret, {
    expiresIn: '15m',
  });
};

export const generateRefreshToken = (userId: string, tokenId: string): string => {
  return sign({ userId, tokenId }, config.jwt.refreshSecret, {
    expiresIn: '7d',
  });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return verify(token, config.jwt.secret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshPayload => {
  return verify(token, config.jwt.refreshSecret) as RefreshPayload;
};

export const generateTokens = async (userId: string) => {
  const accessToken = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId, 'default');
  
  return {
    accessToken,
    refreshToken,
    expiresIn: 15 * 60, // 15 minutes in seconds
  };
};

// Token validation for socket.io
export const validateToken = (token: string): TokenPayload | null => {
  try {
    return verify(token, config.jwt.secret) as TokenPayload;
  } catch {
    return null;
  }
};
