import bcrypt from 'bcrypt';
import crypto from 'crypto';

const BCRYPT_ROUNDS = 12;

/**
 * Hash a plain-text password using bcrypt with 12 rounds.
 */
export const hashPassword = (plain: string): Promise<string> => {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
};

/**
 * Compare a plain-text password against a bcrypt hash.
 */
export const comparePassword = (plain: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(plain, hash);
};

/**
 * Generate a cryptographically random refresh token (128-bit entropy, hex-encoded).
 */
export const generateRefreshToken = (): string => {
  return crypto.randomBytes(64).toString('hex');
};

/**
 * Hash a raw refresh token with SHA-256.
 * This hash is what gets stored in the database — never the raw token.
 */
export const hashRefreshToken = (rawToken: string): string => {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};
