import { TableSchema } from "./types";

export const itemLotSchema: TableSchema = {
  name: "item_lot",

  create: `
    CREATE TABLE IF NOT EXISTS item_lot (
      id TEXT PRIMARY KEY,
      lotNumber TEXT NOT NULL,
      quantityPurchased REAL NOT NULL,
      supplierName TEXT,
      supplierSesrialNumber TEXT,
      supplierAddress TEXT,
      currentStockLevel REAL NOT NULL,
      initialStockLevel REAL NOT NULL,
      expiryDate TEXT,
      costPrice REAL NOT NULL,
      createdAt TEXT,
      updatedAt TEXT,
      itemId TEXT
    );
  `,
};

