import { TableSchema } from "./types";

export const inventoryItemSchema: TableSchema = {
  name: "inventory_item",

  create: `
    CREATE TABLE IF NOT EXISTS inventory_item (
      id TEXT PRIMARY KEY,
      costMethod TEXT DEFAULT 'weighted_average' NOT NULL,
      costPrice REAL DEFAULT 0 NOT NULL,
      currentStockLevel REAL DEFAULT 0 NOT NULL,
      minimumStockLevel REAL DEFAULT 0 NOT NULL,
      reOrderLevel REAL DEFAULT 0 NOT NULL,
      isDeleted INTEGER DEFAULT 0 NOT NULL,
      addedBy TEXT,
      modifiedBy TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      itemMasterId TEXT NOT NULL,
      inventoryId TEXT
    );
  `,
};

