import { TableSchema } from "./types";

export const inventorySchema: TableSchema = {
  name: "inventory",

  create: `
    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      type TEXT DEFAULT 'central' NOT NULL,
      allowProcurement INTEGER DEFAULT 1 NOT NULL,
      location TEXT,
      reference TEXT,
      externalReference TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      businessId TEXT,
      outletId TEXT
    );
  `,
};

