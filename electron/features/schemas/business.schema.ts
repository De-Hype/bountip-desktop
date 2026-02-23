import { TableSchema } from "./types";

export const businessSchema: TableSchema = {
  name: "business",

  create: `
    CREATE TABLE IF NOT EXISTS business (
      id TEXT PRIMARY KEY,
      localId TEXT,
      name TEXT,
      slug TEXT,
      status TEXT DEFAULT 'active' NOT NULL,
      logoUrl TEXT,
      country TEXT,
      businessType TEXT,
      address TEXT,
      currency TEXT,
      revenueRange TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      lastSyncedAt TEXT,
      ownerId TEXT
    );
  `,

  indexes: [
    `CREATE INDEX IF NOT EXISTS idx_business_status ON business(status);`,
    `CREATE INDEX IF NOT EXISTS idx_business_slug ON business(slug);`,
    `CREATE INDEX IF NOT EXISTS idx_business_lastSyncedAt ON business(lastSyncedAt);`,
  ],
};
