import { TableSchema } from "./types";

export const productionItemUpsertSql = `
  INSERT INTO production_items (
    id,
    createdAt,
    updatedAt,
    outletId,
    productionId,
    orderId,
    recordId,
    version
  ) VALUES (
    @id,
    @createdAt,
    @updatedAt,
    @outletId,
    @productionId,
    @orderId,
    @recordId,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    updatedAt = excluded.updatedAt,
    outletId = excluded.outletId,
    productionId = excluded.productionId,
    orderId = excluded.orderId,
    recordId = excluded.recordId,
    version = excluded.version
  WHERE excluded.version >= production_items.version OR excluded.updatedAt >= production_items.updatedAt OR production_items.updatedAt IS NULL
`;

export const buildProductionItemUpsertParams = (pi: any) => ({
  id: pi.id,
  createdAt: pi.createdAt,
  updatedAt: pi.updatedAt,
  outletId: pi.outletId,
  productionId: pi.productionId,
  orderId: pi.orderId,
  recordId: pi.recordId,
  version: pi.version,
});

export const productionItemSchema: TableSchema = {
  name: "production_items",
  create: `
    CREATE TABLE IF NOT EXISTS production_items (
      id TEXT PRIMARY KEY,
      createdAt TEXT,
      updatedAt TEXT,
      outletId TEXT,
      productionId TEXT,
      orderId TEXT,
      recordId TEXT,
      version INTEGER
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_production_items_productionId ON production_items(productionId)",
    "CREATE INDEX IF NOT EXISTS idx_production_items_orderId ON production_items(orderId)",
  ],
};
