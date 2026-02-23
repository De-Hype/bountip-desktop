import { TableSchema } from "./types";

export const productSchema: TableSchema = {
  name: "product",

  create: `
    CREATE TABLE IF NOT EXISTS product (
      id TEXT PRIMARY KEY,
      localId TEXT,
      name TEXT NOT NULL,
      isActive INTEGER DEFAULT 1 NOT NULL,
      description TEXT,
      category TEXT,
      price REAL,
      preparationArea TEXT,
      weight REAL,
      productCode TEXT,
      weightScale TEXT,
      productAvailableStock REAL,
      packagingMethod TEXT,
      priceTierId TEXT,
      allergenList TEXT,
      logoUrl TEXT,
      logoHash TEXT,
      leadTime INTEGER,
      availableAtStorefront INTEGER DEFAULT 0 NOT NULL,
      createdAtStorefront INTEGER DEFAULT 0 NOT NULL,
      isDeleted INTEGER DEFAULT 0 NOT NULL,
      createdAt TEXT,
      updatedAt TEXT,
      lastSyncedAt TEXT,
      outletId TEXT
    );
  `,

  indexes: [
    `CREATE INDEX IF NOT EXISTS idx_product_outlet ON product(outletId);`,
    `CREATE INDEX IF NOT EXISTS idx_product_category ON product(category);`,
    `CREATE INDEX IF NOT EXISTS idx_product_isActive ON product(isActive);`,
    `CREATE INDEX IF NOT EXISTS idx_product_lastSyncedAt ON product(lastSyncedAt);`,
  ],
};
