import { TableSchema } from "./types";

export const productionV2ItemUpsertSql = `
  INSERT INTO production_v2_items (
    id,
    requestedQuantity,
    removedQuantity,
    finalQuantity,
    status,
    notes,
    createdAt,
    updatedAt,
    productionId,
    productId,
    recipeId,
    batchSize,
    batchesRequired,
    recordId,
    version
  ) VALUES (
    @id,
    @requestedQuantity,
    @removedQuantity,
    @finalQuantity,
    @status,
    @notes,
    @createdAt,
    @updatedAt,
    @productionId,
    @productId,
    @recipeId,
    @batchSize,
    @batchesRequired,
    @recordId,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    requestedQuantity = excluded.requestedQuantity,
    removedQuantity = excluded.removedQuantity,
    finalQuantity = excluded.finalQuantity,
    status = excluded.status,
    notes = excluded.notes,
    updatedAt = excluded.updatedAt,
    productionId = excluded.productionId,
    productId = excluded.productId,
    recipeId = excluded.recipeId,
    batchSize = excluded.batchSize,
    batchesRequired = excluded.batchesRequired,
    recordId = excluded.recordId,
    version = excluded.version
  WHERE excluded.version >= production_v2_items.version OR excluded.updatedAt >= production_v2_items.updatedAt OR production_v2_items.updatedAt IS NULL
`;

export const buildProductionV2ItemUpsertParams = (pi: any) => ({
  id: pi.id,
  requestedQuantity: Number(pi.requestedQuantity || 0),
  removedQuantity: Number(pi.removedQuantity || 0),
  finalQuantity: Number(pi.finalQuantity || 0),
  status: pi.status,
  notes: pi.notes,
  createdAt: pi.createdAt,
  updatedAt: pi.updatedAt,
  productionId: pi.productionId,
  productId: pi.productId,
  recipeId: pi.recipeId,
  batchSize: pi.batchSize,
  batchesRequired: pi.batchesRequired,
  recordId: pi.recordId,
  version: Number(pi.version || 0),
});

export const productionV2ItemSchema: TableSchema = {
  name: "production_v2_items",
  create: `
    CREATE TABLE IF NOT EXISTS production_v2_items (
      id TEXT PRIMARY KEY,
      requestedQuantity REAL,
      removedQuantity REAL,
      finalQuantity REAL,
      status TEXT,
      notes TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      productionId TEXT,
      productId TEXT,
      recipeId TEXT,
      batchSize TEXT,
      batchesRequired INTEGER,
      recordId TEXT,
      version INTEGER DEFAULT 0 NOT NULL
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_production_v2_items_productionId ON production_v2_items(productionId)",
    "CREATE INDEX IF NOT EXISTS idx_production_v2_items_productId ON production_v2_items(productId)",
  ],
};
