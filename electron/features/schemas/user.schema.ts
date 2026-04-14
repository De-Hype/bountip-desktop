import { TableSchema } from "./types";

export type UserUpsertParams = {
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

export const userCreateSql = `
  CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    fullName TEXT NOT NULL,
    password TEXT,
    pin TEXT NOT NULL,
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

export const userUpsertSql = `
  INSERT INTO user (
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
  ON CONFLICT(id) DO UPDATE SET
    email = excluded.email,
    fullName = excluded.fullName,
    password = excluded.password,
    pin = excluded.pin,
    otpCodeHash = excluded.otpCodeHash,
    otpCodeExpiry = excluded.otpCodeExpiry,
    failedLoginCount = excluded.failedLoginCount,
    failedLoginRetryTime = excluded.failedLoginRetryTime,
    lastFailedLogin = excluded.lastFailedLogin,
    isEmailVerified = excluded.isEmailVerified,
    isPin = excluded.isPin,
    isDeleted = excluded.isDeleted,
    lastLoginAt = excluded.lastLoginAt,
    status = excluded.status,
    authProvider = excluded.authProvider,
    providerId = excluded.providerId,
    publicId = excluded.publicId,
    providerData = excluded.providerData,
    createdAt = excluded.createdAt,
    updatedAt = excluded.updatedAt,
    lastSyncedAt = excluded.lastSyncedAt,
    version = excluded.version
  WHERE excluded.version >= user.version
     OR excluded.updatedAt >= user.updatedAt
     OR user.updatedAt IS NULL
`;

export const buildUserUpsertParams = (u: any): UserUpsertParams => ({
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

export const userSchema: TableSchema = {
  name: "user",
  create: userCreateSql,
  indexes: [
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_user_email ON user(email);`,
    `CREATE INDEX IF NOT EXISTS idx_user_status ON user(status);`,
    `CREATE INDEX IF NOT EXISTS idx_user_lastSyncedAt ON user(lastSyncedAt);`,
  ],
};
