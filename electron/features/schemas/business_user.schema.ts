import { TableSchema } from "./types";

export const businessUserSchema: TableSchema = {
  name: "business_user",

  create: `
    CREATE TABLE IF NOT EXISTS business_user (
      id TEXT PRIMARY KEY,
      accessType TEXT DEFAULT 'super_admin' NOT NULL,
      permissions TEXT,
      status TEXT DEFAULT 'active' NOT NULL,
      invitedBy TEXT,
      invitationToken TEXT,
      invitationExpiry TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      lastSyncedAt TEXT,
      userId TEXT,
      outletId TEXT NOT NULL,
      businessId TEXT NOT NULL
    );
  `,
};

