// ── Enums (mirrored from backend src/types/index.ts) ─────────────────────────

export enum Role {
  VIEWER   = 'VIEWER',
  ANALYST  = 'ANALYST',
  ADMIN    = 'ADMIN',
}

export enum Status {
  ACTIVE   = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum TxType {
  INCOME  = 'INCOME',
  EXPENSE = 'EXPENSE',
}

// ── Response envelope ─────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data:    T;
}

export interface ApiError {
  success: false;
  message: string;
}

export interface ApiValidationError {
  success: false;
  errors:  Array<{ field: string; message: string }>;
}

// ── User ──────────────────────────────────────────────────────────────────────

export interface SafeUser {
  id:        string;
  name:      string;
  email:     string;
  role:      Role;
  status:    Status;
  createdAt: string;
  updatedAt: string;
}

// ── Financial Record ──────────────────────────────────────────────────────────

export interface FinancialRecord {
  id:        string;
  amount:    string;  // Decimal serialized as string — always use parseFloat() for math
  type:      TxType;
  category:  string;
  date:      string;
  notes:     string | null;
  isDeleted: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ── Token Pair ────────────────────────────────────────────────────────────────

export interface TokenPair {
  accessToken:  string;
  refreshToken: string;
}

// ── Pagination ────────────────────────────────────────────────────────────────

export interface Pagination {
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

// ── Auth DTOs ─────────────────────────────────────────────────────────────────

export interface RegisterDto {
  name:     string;
  email:    string;
  password: string;
}

export interface LoginDto {
  email:    string;
  password: string;
}

export interface RefreshDto {
  refreshToken: string;
}

export interface LogoutDto {
  refreshToken: string;
}

// ── Auth Responses ────────────────────────────────────────────────────────────

export interface LoginResponse {
  user:         SafeUser;
  accessToken:  string;
  refreshToken: string;
}

export interface RegisterResponse {
  user: SafeUser;
}

// ── Record DTOs ───────────────────────────────────────────────────────────────

export interface CreateRecordDto {
  amount:   string;  // decimal string e.g. "1500.00"
  type:     TxType;
  category: string;
  date:     string;  // ISO 8601 datetime
  notes?:   string;
}

export interface UpdateRecordDto {
  amount?:  string;
  type?:    TxType;
  category?: string;
  date?:    string;
  notes?:   string | null;
}

export interface ListRecordsQuery {
  type?:      TxType;
  category?:  string;
  startDate?: string;
  endDate?:   string;
  search?:    string;
  minAmount?: number;
  maxAmount?: number;
  page?:      number;
  limit?:     number;
  sortBy?:    'date' | 'amount';
  order?:     'asc' | 'desc';
}

export interface ListRecordsResponse {
  records:    FinancialRecord[];
  pagination: Pagination;
}

// ── User DTOs ─────────────────────────────────────────────────────────────────

export interface CreateUserDto {
  name:     string;
  email:    string;
  password: string;
  role?:    Role;
}

export interface UpdateUserDto {
  name?:   string;
  role?:   Role;
  status?: Status;
}

export interface ListUsersQuery {
  page?:   number;
  limit?:  number;
  role?:   Role;
  status?: Status;
}

export interface ListUsersResponse {
  users:      SafeUser[];
  pagination: Pagination;
}

// ── Dashboard Response shapes ─────────────────────────────────────────────────

export interface DashboardSummary {
  totalIncome:    string;  // Decimal string
  totalExpenses:  string;
  netBalance:     string;
  recordCount:    number;
}

export interface CategoryBreakdown {
  category: string;
  type:     TxType;
  total:    string;  // Decimal string
  count:    number;
}

export interface TrendPoint {
  period:   string;  // "2024-01" or "2024-W03"
  income:   string;
  expenses: string;
  net:      string;
}
