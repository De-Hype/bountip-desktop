import { TableSchema } from "./types";

export const productionV2DeliveryUpsertSql = `
  INSERT INTO production_v2_deliveries (
    id,
    quantityDelivered,
    status,
    deliveredAt,
    deliveryReference,
    createdAt,
    updatedAt,
    lotId,
    orderId,
    productId,
    recordId,
    version
  ) VALUES (
    @id,
    @quantityDelivered,
    @status,
    @deliveredAt,
    @deliveryReference,
    @createdAt,
    @updatedAt,
    @lotId,
    @orderId,
    @productId,
    @recordId,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    quantityDelivered = excluded.quantityDelivered,
    status = excluded.status,
    deliveredAt = excluded.deliveredAt,
    deliveryReference = excluded.deliveryReference,
    updatedAt = excluded.updatedAt,
    lotId = excluded.lotId,
    orderId = excluded.orderId,
    productId = excluded.productId,
    recordId = excluded.recordId,
    version = excluded.version
  WHERE excluded.version >= production_v2_deliveries.version OR excluded.updatedAt >= production_v2_deliveries.updatedAt OR production_v2_deliveries.updatedAt IS NULL
`;

export const buildProductionV2DeliveryUpsertParams = (d: any) => ({
  id: d.id,
  quantityDelivered: Number(d.quantityDelivered || 0),
  status: d.status,
  deliveredAt: d.deliveredAt,
  deliveryReference: d.deliveryReference,
  createdAt: d.createdAt,
  updatedAt: d.updatedAt,
  lotId: d.lotId,
  orderId: d.orderId,
  productId: d.productId,
  recordId: d.recordId,
  version: Number(d.version || 0),
});

export const productionV2DeliverySchema: TableSchema = {
  name: "production_v2_deliveries",
  create: `
    CREATE TABLE IF NOT EXISTS production_v2_deliveries (
      id TEXT PRIMARY KEY,
      quantityDelivered REAL,
      status TEXT,
      deliveredAt TEXT,
      deliveryReference TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      lotId TEXT,
      orderId TEXT,
      productId TEXT,
      recordId TEXT,
      version INTEGER DEFAULT 0 NOT NULL
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_production_v2_deliveries_lotId ON production_v2_deliveries(lotId)",
    "CREATE INDEX IF NOT EXISTS idx_production_v2_deliveries_orderId ON production_v2_deliveries(orderId)",
    "CREATE INDEX IF NOT EXISTS idx_production_v2_deliveries_productId ON production_v2_deliveries(productId)",
  ],
};
