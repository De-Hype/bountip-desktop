import { TableSchema } from "./types";

export const productionV2LotItemUpsertSql = `
  INSERT INTO production_v2_lot_items (
    id,
    quantityProduced,
    quantityDelivered,
    quantityRemaining,
    createdAt,
    updatedAt,
    lotId,
    productId,
    recordId,
    version
  ) VALUES (
    @id,
    @quantityProduced,
    @quantityDelivered,
    @quantityRemaining,
    @createdAt,
    @updatedAt,
    @lotId,
    @productId,
    @recordId,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    quantityProduced = excluded.quantityProduced,
    quantityDelivered = excluded.quantityDelivered,
    quantityRemaining = excluded.quantityRemaining,
    updatedAt = excluded.updatedAt,
    lotId = excluded.lotId,
    productId = excluded.productId,
    recordId = excluded.recordId,
    version = excluded.version
  WHERE excluded.version >= production_v2_lot_items.version OR excluded.updatedAt >= production_v2_lot_items.updatedAt OR production_v2_lot_items.updatedAt IS NULL
`;

export const buildProductionV2LotItemUpsertParams = (li: any) => ({
  id: li.id,
  quantityProduced: Number(li.quantityProduced || 0),
  quantityDelivered: Number(li.quantityDelivered || 0),
  quantityRemaining: Number(li.quantityRemaining || 0),
  createdAt: li.createdAt,
  updatedAt: li.updatedAt,
  lotId: li.lotId,
  productId: li.productId,
  recordId: li.recordId,
  version: Number(li.version || 0),
});

export const productionV2LotItemSchema: TableSchema = {
  name: "production_v2_lot_items",
  create: `
    CREATE TABLE IF NOT EXISTS production_v2_lot_items (
      id TEXT PRIMARY KEY,
      quantityProduced REAL,
      quantityDelivered REAL,
      quantityRemaining REAL,
      createdAt TEXT,
      updatedAt TEXT,
      lotId TEXT,
      productId TEXT,
      recordId TEXT,
      version INTEGER DEFAULT 0 NOT NULL
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_production_v2_lot_items_lotId ON production_v2_lot_items(lotId)",
    "CREATE INDEX IF NOT EXISTS idx_production_v2_lot_items_productId ON production_v2_lot_items(productId)",
  ],
};
