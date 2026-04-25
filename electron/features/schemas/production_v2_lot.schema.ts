import { TableSchema } from "./types";

export const productionV2LotUpsertSql = `
  INSERT INTO production_v2_lots (
    id,
    lotNumber,
    expiryDate,
    notes,
    createdAt,
    updatedAt,
    productionId,
    recordId,
    version
  ) VALUES (
    @id,
    @lotNumber,
    @expiryDate,
    @notes,
    @createdAt,
    @updatedAt,
    @productionId,
    @recordId,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    lotNumber = excluded.lotNumber,
    expiryDate = excluded.expiryDate,
    notes = excluded.notes,
    updatedAt = excluded.updatedAt,
    productionId = excluded.productionId,
    recordId = excluded.recordId,
    version = excluded.version
  WHERE excluded.version >= production_v2_lots.version OR excluded.updatedAt >= production_v2_lots.updatedAt OR production_v2_lots.updatedAt IS NULL
`;

export const buildProductionV2LotUpsertParams = (l: any) => ({
  id: l.id,
  lotNumber: l.lotNumber,
  expiryDate: l.expiryDate,
  notes: l.notes,
  createdAt: l.createdAt,
  updatedAt: l.updatedAt,
  productionId: l.productionId,
  recordId: l.recordId,
  version: Number(l.version || 0),
});

export const productionV2LotSchema: TableSchema = {
  name: "production_v2_lots",
  create: `
    CREATE TABLE IF NOT EXISTS production_v2_lots (
      id TEXT PRIMARY KEY,
      lotNumber TEXT,
      expiryDate TEXT,
      notes TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      productionId TEXT,
      recordId TEXT,
      version INTEGER DEFAULT 0 NOT NULL
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_production_v2_lots_productionId ON production_v2_lots(productionId)",
  ],
};
