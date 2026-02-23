import { TableSchema } from "./types";

export const userSchema: TableSchema = {
  name: "user",

  create: `
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
  `,

  indexes: [
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_user_email ON user(email);`,
    `CREATE INDEX IF NOT EXISTS idx_user_status ON user(status);`,
    `CREATE INDEX IF NOT EXISTS idx_user_lastSyncedAt ON user(lastSyncedAt);`,
  ],
};
