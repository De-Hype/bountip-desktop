import { TableSchema } from "./types";

export type UsersUpsertParams = {
  id: string;
  email: string | null;
  fullName: string | null;
  password: string | null;
  pin: string | null;
  otpCodeHash: string | null;
  otpCodeExpiry: string | null;
  failedLoginCount: number;
  failedLoginRetryTime: string | null;
  lastFailedLogin: string | null;
  isEmailVerified: number;
  isPin: number;
  isDeleted: number;
  lastLoginAt: string | null;
  status: string;
  authProvider: string | null;
  providerId: string | null;
  publicId: string | null;
  providerData: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  lastSyncedAt: string | null;
  version: number;
};

export const usersCreateSql = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    fullName TEXT NOT NULL,
    password TEXT,
    pin TEXT,
    otpCodeHash TEXT,
    otpCodeExpiry TEXT,
    failedLoginCount INTEGER DEFAULT 0,
    failedLoginRetryTime TEXT,
    lastFailedLogin TEXT,
    isEmailVerified INTEGER DEFAULT 0 NOT NULL,
    isPin INTEGER DEFAULT 0 NOT NULL,
    isDeleted INTEGER DEFAULT 0 NOT NULL,
    lastLoginAt TEXT,
    status TEXT DEFAULT 'inactive' NOT NULL,
    authProvider TEXT,
    providerId TEXT,
    publicId TEXT,
    providerData TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    lastSyncedAt TEXT,
    version INTEGER DEFAULT 0 NOT NULL
  );
`;

export const usersUpsertSql = `
  INSERT OR REPLACE INTO users (
    id,
    email,
    fullName,
    password,
    pin,
    otpCodeHash,
    otpCodeExpiry,
    failedLoginCount,
    failedLoginRetryTime,
    lastFailedLogin,
    isEmailVerified,
    isPin,
    isDeleted,
    lastLoginAt,
    status,
    authProvider,
    providerId,
    publicId,
    providerData,
    createdAt,
    updatedAt,
    lastSyncedAt,
    version
  ) VALUES (
    @id,
    @email,
    @fullName,
    @password,
    @pin,
    @otpCodeHash,
    @otpCodeExpiry,
    @failedLoginCount,
    @failedLoginRetryTime,
    @lastFailedLogin,
    @isEmailVerified,
    @isPin,
    @isDeleted,
    @lastLoginAt,
    @status,
    @authProvider,
    @providerId,
    @publicId,
    @providerData,
    @createdAt,
    @updatedAt,
    @lastSyncedAt,
    @version
  )
`;

export const buildUsersUpsertParams = (u: any): UsersUpsertParams => ({
  id: u.id,
  email: u.email ?? null,
  fullName: u.fullName ?? null,
  password: u.password ?? null,
  pin: u.pin ?? null,
  otpCodeHash: u.otpCodeHash ?? null,
  otpCodeExpiry: u.otpCodeExpiry ?? null,
  failedLoginCount: Number(u.failedLoginCount ?? 0),
  failedLoginRetryTime: u.failedLoginRetryTime ?? null,
  lastFailedLogin: u.lastFailedLogin ?? null,
  isEmailVerified: u.isEmailVerified ? 1 : 0,
  isPin: u.isPin ? 1 : 0,
  isDeleted: u.isDeleted ? 1 : 0,
  lastLoginAt: u.lastLoginAt ?? null,
  status: u.status ?? "inactive",
  authProvider: u.authProvider ?? null,
  providerId: u.providerId ?? null,
  publicId: u.publicId ?? null,
  providerData: u.providerData ? JSON.stringify(u.providerData) : null,
  createdAt: u.createdAt ?? null,
  updatedAt: u.updatedAt ?? null,
  lastSyncedAt: u.lastSyncedAt ?? null,
  version: Number(u.version ?? 0),
});

export const usersSchema: TableSchema = {
  name: "users",
  create: usersCreateSql,
  indexes: [
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_id ON users(id);`,
    `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`,
  ],
};
