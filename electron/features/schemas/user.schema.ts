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
    lastSyncedAt TEXT
  );
`;

export const userUpsertSql = `
  INSERT OR REPLACE INTO user (
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
    lastSyncedAt
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
    @lastSyncedAt
  )
`;

export const buildUserUpsertParams = (u: any): UserUpsertParams => ({
  id: u.id,
  email: u.email ?? null,
  fullName: u.fullName ?? null,
  password: u.password ?? null,
  pin: u.pin ?? null,
  otpCodeHash: u.otpCodeHash ?? null,
  otpCodeExpiry: u.otpCodeExpiry ?? null,
  failedLoginCount: u.failedLoginCount ?? 0,
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
  providerData:
    u.providerData && typeof u.providerData === "object"
      ? JSON.stringify(u.providerData)
      : (u.providerData ?? null),
  createdAt: u.createdAt ?? null,
  updatedAt: u.updatedAt ?? null,
  lastSyncedAt: u.lastSyncedAt ?? null,
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
