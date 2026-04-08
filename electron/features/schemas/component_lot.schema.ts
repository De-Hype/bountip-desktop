import { TableSchema } from "./types";

export type ComponentLotUpsertParams = {
  id: string;
  initialStockLevel: number;
  quantity: number;
  currentStockLevel: number;
  ref: string | null;
  unitCost: number;
  expiry: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
  preparedBy: string | null;
  updatedBy: string | null;
  componentId: string | null;
  recordId: string | null;
  version: number;
  totalCost: number;
};

export const componentLotUpsertSql = `
  INSERT INTO component_lots (
    id,
    initialStockLevel,
    quantity,
    currentStockLevel,
    ref,
    unitCost,
    expiry,
    createdAt,
    updatedAt,
    deletedAt,
    preparedBy,
    updatedBy,
    componentId,
    recordId,
    version,
    totalCost
  ) VALUES (
    @id,
    @initialStockLevel,
    @quantity,
    @currentStockLevel,
    @ref,
    @unitCost,
    @expiry,
    @createdAt,
    @updatedAt,
    @deletedAt,
    @preparedBy,
    @updatedBy,
    @componentId,
    @recordId,
    @version,
    @totalCost
  )
  ON CONFLICT(id) DO UPDATE SET
    initialStockLevel = excluded.initialStockLevel,
    quantity = excluded.quantity,
    currentStockLevel = excluded.currentStockLevel,
    ref = excluded.ref,
    unitCost = excluded.unitCost,
    expiry = excluded.expiry,
    createdAt = excluded.createdAt,
    updatedAt = excluded.updatedAt,
    deletedAt = excluded.deletedAt,
    preparedBy = excluded.preparedBy,
    updatedBy = excluded.updatedBy,
    componentId = excluded.componentId,
    recordId = excluded.recordId,
    version = excluded.version,
    totalCost = excluded.totalCost
  WHERE excluded.version >= component_lots.version
     OR excluded.updatedAt >= component_lots.updatedAt
     OR component_lots.updatedAt IS NULL
`;

export const buildComponentLotUpsertParams = (cl: any): ComponentLotUpsertParams => ({
  id: cl.id,
  initialStockLevel: Number(cl.initialStockLevel || 0),
  quantity: parseFloat(cl.quantity || 0),
  currentStockLevel: parseFloat(cl.currentStockLevel || 0),
  ref: cl.ref ?? null,
  unitCost: parseFloat(cl.unitCost || 0),
  expiry: cl.expiry ?? null,
  createdAt: cl.createdAt ?? null,
  updatedAt: cl.updatedAt ?? cl.createdAt ?? null,
  deletedAt: cl.deletedAt ?? cl.deleted_at ?? null,
  preparedBy: cl.preparedBy ?? null,
  updatedBy: cl.updatedBy ?? null,
  componentId: cl.componentId ?? null,
  recordId: cl.recordId ?? null,
  version: Number(cl.version || 0),
  totalCost: parseFloat(cl.totalCost || 0),
});

export const componentLotSchema: TableSchema = {
  name: "component_lots",
  create: `
    CREATE TABLE IF NOT EXISTS component_lots (
      id TEXT PRIMARY KEY,
      initialStockLevel REAL,
      quantity REAL,
      currentStockLevel REAL,
      ref TEXT,
      unitCost REAL,
      expiry TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      deletedAt TEXT,
      preparedBy TEXT,
      updatedBy TEXT,
      componentId TEXT,
      recordId TEXT,
      version INTEGER DEFAULT 0 NOT NULL,
      totalCost REAL
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_component_lots_componentId ON component_lots(componentId);",
    "CREATE INDEX IF NOT EXISTS idx_component_lots_ref ON component_lots(ref);",
    "CREATE INDEX IF NOT EXISTS idx_component_lots_expiry ON component_lots(expiry);",
  ],
};

