import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { env } from '../../config/env';
import { Role, SafeUser, TokenPair } from '../../types';
import { hashPassword, comparePassword, generateRefreshToken, hashRefreshToken } from '../../utils/crypto';
import { authRepository } from './auth.repository';
import { liveService } from '../live/live.service';

/**
 * Compute the Date at which a refresh token expires (now + JWT_REFRESH_EXPIRY).
 * JWT_REFRESH_EXPIRY is in the format "7d", "30d", etc.
 */
const refreshExpiryDate = (): Date => {
  const expiry = env.JWT_REFRESH_EXPIRY; // e.g. "7d"
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid JWT_REFRESH_EXPIRY format: ${expiry}`);
  const amount = parseInt(match[1], 10);
  const unit = match[2];
  const ms: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return new Date(Date.now() + amount * ms[unit]);
};

const signAccessToken = (payload: { id: string; email: string; role: Role }): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY,
  } as jwt.SignOptions);
};

export const authService = {
  /**
   * Register a new user.
   * First user in the system is automatically assigned ADMIN role.
   */
  register: async (data: { name: string; email: string; password: string }): Promise<SafeUser> => {
    const count = await authRepository.countUsers();
    const role: Role = count === 0 ? Role.ADMIN : Role.VIEWER;
    const hashedPassword = await hashPassword(data.password);

    const user = await authRepository.createUser({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role,
    });

    liveService.emit({
      type: 'user.registered',
      actor: 'system',
      payload: { userId: user.id, email: user.email, role: user.role },
    });

    return user as SafeUser;
  },

  /**
   * Login — validate credentials, check status, issue token pair.
   */
  login: async (data: { email: string; password: string }): Promise<TokenPair & { user: SafeUser }> => {
    const userWithPassword = await authRepository.findUserByEmailWithPassword(data.email);

    if (!userWithPassword) {
      const err = Object.assign(new Error('Invalid credentials'), { name: 'InvalidCredentialsError', statusCode: 401 });
      throw err;
    }

    const passwordValid = await comparePassword(data.password, userWithPassword.password);
    if (!passwordValid) {
      const err = Object.assign(new Error('Invalid credentials'), { name: 'InvalidCredentialsError', statusCode: 401 });
      throw err;
    }

    if (userWithPassword.status === 'INACTIVE') {
      const err = Object.assign(new Error('Account is inactive'), { name: 'InactiveUserError', statusCode: 403 });
      throw err;
    }

    // Issue tokens
    const accessToken = signAccessToken({
      id: userWithPassword.id,
      email: userWithPassword.email,
      role: userWithPassword.role as Role,
    });
    const rawRefreshToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(rawRefreshToken);

    await authRepository.createRefreshToken({
      tokenHash,
      userId: userWithPassword.id,
      expiresAt: refreshExpiryDate(),
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pw, ...safeUser } = userWithPassword;

    liveService.emit({
      type: 'user.loggedIn',
      actor: { id: userWithPassword.id, email: userWithPassword.email, role: userWithPassword.role },
      payload: { userId: userWithPassword.id, email: userWithPassword.email },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: safeUser as SafeUser,
    };
  },

  /**
   * Refresh token rotation — validate old token, delete it, issue new pair.
   */
  refresh: async (rawRefreshToken: string): Promise<TokenPair> => {
    const tokenHash = hashRefreshToken(rawRefreshToken);
    const record = await authRepository.findRefreshTokenByHash(tokenHash);

    if (!record) {
      throw new JsonWebTokenError('Invalid refresh token');
    }

    if (record.expiresAt < new Date()) {
      await authRepository.deleteRefreshTokenById(record.id);
      throw new TokenExpiredError('Refresh token expired', record.expiresAt);
    }

    // Rotate: delete old, create new
    await authRepository.deleteRefreshTokenById(record.id);

    // Fetch user to sign new access token
    const user = await authRepository.findUserById(record.userId);

    if (!user) {
      throw new JsonWebTokenError('User not found for refresh token');
    }

    const newAccessToken = signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role as Role,
    });
    const newRawRefreshToken = generateRefreshToken();
    const newTokenHash = hashRefreshToken(newRawRefreshToken);

    await authRepository.createRefreshToken({
      tokenHash: newTokenHash,
      userId: user.id,
      expiresAt: refreshExpiryDate(),
    });

    liveService.emit({
      type: 'token.refreshed',
      actor: { id: user.id, email: user.email, role: user.role },
      payload: { userId: user.id },
    });

    return { accessToken: newAccessToken, refreshToken: newRawRefreshToken };
  },

  /**
   * Logout — delete refresh token from DB.
   */
  logout: async (rawRefreshToken: string): Promise<void> => {
    const tokenHash = hashRefreshToken(rawRefreshToken);
    // Look up before deleting to capture userId for telemetry
    const record = await authRepository.findRefreshTokenByHash(tokenHash);
    await authRepository.deleteRefreshTokenByHash(tokenHash);
    if (record) {
      liveService.emit({
        type: 'user.loggedOut',
        actor: 'system',
        payload: { userId: record.userId },
      });
    }
  },
};
