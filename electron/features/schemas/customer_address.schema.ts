import { TableSchema } from "./types";

export const customerAddressSchema: TableSchema = {
  name: "customer_address",

  create: `
    CREATE TABLE IF NOT EXISTS customer_address (
      id TEXT PRIMARY KEY,
      address TEXT,
      isDefault INTEGER DEFAULT 0 NOT NULL,
      createdAt TEXT,
      updatedAt TEXT,
      customerId TEXT
    );
  `,
};

