import { TableSchema } from "./types";

export const inventoryItemUpsertSql = `
  INSERT INTO inventory_item (
    id,
    costMethod,
    costPrice,
    currentStockLevel,
    minimumStockLevel,
    reOrderLevel,
    isDeleted,
    addedBy,
    modifiedBy,
    createdAt,
    updatedAt,
    itemMasterId,
    inventoryId,
    recordId,
    version
  ) VALUES (
    @id,
    @costMethod,
    @costPrice,
    @currentStockLevel,
    @minimumStockLevel,
    @reOrderLevel,
    @isDeleted,
    @addedBy,
    @modifiedBy,
    @createdAt,
    @updatedAt,
    @itemMasterId,
    @inventoryId,
    @recordId,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    costMethod = excluded.costMethod,
    costPrice = excluded.costPrice,
    currentStockLevel = excluded.currentStockLevel,
    minimumStockLevel = excluded.minimumStockLevel,
    reOrderLevel = excluded.reOrderLevel,
    isDeleted = excluded.isDeleted,
    addedBy = excluded.addedBy,
    modifiedBy = excluded.modifiedBy,
    updatedAt = excluded.updatedAt,
    itemMasterId = excluded.itemMasterId,
    inventoryId = excluded.inventoryId,
    recordId = excluded.recordId,
    version = excluded.version
  WHERE excluded.version >= inventory_item.version OR excluded.updatedAt >= inventory_item.updatedAt OR inventory_item.updatedAt IS NULL
`;

export const buildInventoryItemUpsertParams = (i: any) => ({
  id: i.id,
  costMethod: i.costMethod,
  costPrice: parseFloat(i.costPrice || 0),
  currentStockLevel: parseFloat(i.currentStockLevel || 0),
  minimumStockLevel: parseFloat(i.minimumStockLevel || 0),
  reOrderLevel: parseFloat(i.reOrderLevel || 0),
  isDeleted: i.isDeleted ? 1 : 0,
  addedBy: i.addedBy,
  modifiedBy: i.modifiedBy,
  createdAt: i.createdAt,
  updatedAt: i.updatedAt,
  itemMasterId: i.itemMasterId,
  inventoryId: i.inventoryId,
  recordId: i.recordId,
  version: i.version,
});

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
      inventoryId TEXT,
      recordId TEXT,
      version INTEGER
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_inventory_item_inventoryId ON inventory_item(inventoryId)",
    "CREATE INDEX IF NOT EXISTS idx_inventory_item_itemMasterId ON inventory_item(itemMasterId)",
  ],
};

