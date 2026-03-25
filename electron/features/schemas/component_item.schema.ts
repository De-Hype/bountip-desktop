import { TableSchema } from "./types";

export type ComponentItemUpsertParams = {
  id: string;
  quantity: number;
  adjustWaste: number;
  isCritical: number;
  isRequired: number;
  costPrice: number;
  totalCost: number;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
  componentId: string | null;
  componentItemLotId: string | null;
  itemId: string | null;
  recordId: string | null;
  version: number;
};

export const componentItemUpsertSql = `
  INSERT INTO component_items (
    id,
    quantity,
    adjustWaste,
    isCritical,
    isRequired,
    costPrice,
    totalCost,
    createdAt,
    updatedAt,
    deletedAt,
    componentId,
    componentItemLotId,
    itemId,
    recordId,
    version
  ) VALUES (
    @id,
    @quantity,
    @adjustWaste,
    @isCritical,
    @isRequired,
    @costPrice,
    @totalCost,
    @createdAt,
    @updatedAt,
    @deletedAt,
    @componentId,
    @componentItemLotId,
    @itemId,
    @recordId,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    quantity = excluded.quantity,
    adjustWaste = excluded.adjustWaste,
    isCritical = excluded.isCritical,
    isRequired = excluded.isRequired,
    costPrice = excluded.costPrice,
    totalCost = excluded.totalCost,
    createdAt = excluded.createdAt,
    updatedAt = excluded.updatedAt,
    deletedAt = excluded.deletedAt,
    componentId = excluded.componentId,
    componentItemLotId = excluded.componentItemLotId,
    itemId = excluded.itemId,
    recordId = excluded.recordId,
    version = excluded.version
  WHERE excluded.version >= component_items.version
     OR excluded.updatedAt >= component_items.updatedAt
     OR component_items.updatedAt IS NULL
`;

export const buildComponentItemUpsertParams = (
  ci: any,
): ComponentItemUpsertParams => ({
  id: ci.id,
  quantity: parseFloat(ci.quantity || 0),
  adjustWaste: parseFloat(ci.adjustWaste || 0),
  isCritical: ci.isCritical ? 1 : 0,
  isRequired: ci.isRequired ? 1 : 0,
  costPrice: parseFloat(ci.costPrice || 0),
  totalCost: parseFloat(ci.totalCost || 0),
  createdAt: ci.createdAt ?? null,
  updatedAt: ci.updatedAt ?? ci.createdAt ?? null,
  deletedAt: ci.deletedAt ?? ci.deleted_at ?? null,
  componentId: ci.componentId ?? null,
  componentItemLotId: ci.componentItemLotId ?? null,
  itemId: ci.itemId ?? null,
  recordId: ci.recordId ?? null,
  version: Number(ci.version || 0),
});

export const componentItemSchema: TableSchema = {
  name: "component_items",
  create: `
    CREATE TABLE IF NOT EXISTS component_items (
      id TEXT PRIMARY KEY,
      quantity REAL,
      adjustWaste REAL,
      isCritical INTEGER,
      isRequired INTEGER,
      costPrice REAL,
      totalCost REAL,
      createdAt TEXT,
      updatedAt TEXT,
      deletedAt TEXT,
      componentId TEXT,
      componentItemLotId TEXT,
      itemId TEXT,
      recordId TEXT,
      version INTEGER
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_component_items_componentId ON component_items(componentId);",
    "CREATE INDEX IF NOT EXISTS idx_component_items_itemId ON component_items(itemId);",
  ],
};

