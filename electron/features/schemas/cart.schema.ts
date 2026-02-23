import { TableSchema } from "./types";

export const cartSchema: TableSchema = {
  name: "cart",

  create: `
    CREATE TABLE IF NOT EXISTS cart (
      id TEXT PRIMARY KEY,
      reference TEXT NOT NULL,
      status TEXT DEFAULT 'active' NOT NULL,
      createdAt TEXT,
      updatedAt TEXT,
      outletId TEXT,
      itemCount INTEGER DEFAULT 0 NOT NULL,
      totalQuantity INTEGER DEFAULT 0 NOT NULL,
      totalAmount REAL DEFAULT 0 NOT NULL,
      customerId TEXT
    );
  `,
};

