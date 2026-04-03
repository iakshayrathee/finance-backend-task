// Shared enums mirroring Prisma schema enums for use outside Prisma context

export enum Role {
  VIEWER = 'VIEWER',
  ANALYST = 'ANALYST',
  ADMIN = 'ADMIN',
}

export enum Status {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum TxType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

// Payload attached to JWT access token
export interface JwtPayload {
  id: string;
  email: string;
  role: Role;
}

// Safe user shape (no password)
export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}

// Token pair returned from auth operations
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
