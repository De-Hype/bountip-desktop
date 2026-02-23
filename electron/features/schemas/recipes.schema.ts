import { TableSchema } from "./types";

export const recipesSchema: TableSchema = {
  name: "recipes",

  create: `
    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      productReference TEXT NOT NULL,
      productName TEXT NOT NULL,
      outletId TEXT NOT NULL,
      mix TEXT DEFAULT 'standard' NOT NULL,
      totalPortions REAL NOT NULL,
      totalMixCost REAL DEFAULT 0 NOT NULL,
      preparationTime REAL DEFAULT 0 NOT NULL,
      difficulty_level TEXT DEFAULT 'Medium' NOT NULL,
      instructions TEXT NOT NULL,
      imageUrl TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      createdBy TEXT NOT NULL,
      isDeleted INTEGER DEFAULT 0 NOT NULL,
      inventoryId TEXT
    );
  `,
};

