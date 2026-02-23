import { TableSchema } from "./types";

export const itemMasterSchema: TableSchema = {
  name: "item_master",

  create: `
    CREATE TABLE IF NOT EXISTS item_master (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      itemCode TEXT NOT NULL,
      businessId TEXT NOT NULL,
      category TEXT NOT NULL,
      itemType TEXT NOT NULL,
      unitOfPurchase TEXT NOT NULL,
      unitOfTransfer TEXT NOT NULL,
      unitOfConsumption TEXT NOT NULL,
      displayedUnitOfMeasure TEXT NOT NULL,
      transferPerPurchase REAL DEFAULT 0 NOT NULL,
      consumptionPerTransfer REAL DEFAULT 0 NOT NULL,
      isTraceable INTEGER DEFAULT 0 NOT NULL,
      isTrackable INTEGER DEFAULT 0 NOT NULL,
      createdAt TEXT,
      updatedAt TEXT
    );
  `,
};

