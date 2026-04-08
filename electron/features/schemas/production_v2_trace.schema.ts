import { TableSchema } from "./types";

export const productionV2TraceUpsertSql = `
  INSERT INTO production_v2_traces (
    id,
    event,
    fromStatus,
    toStatus,
    actorId,
    metadata,
    createdAt,
    productionId,
    recordId,
    version
  ) VALUES (
    @id,
    @event,
    @fromStatus,
    @toStatus,
    @actorId,
    @metadata,
    @createdAt,
    @productionId,
    @recordId,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    event = excluded.event,
    fromStatus = excluded.fromStatus,
    toStatus = excluded.toStatus,
    actorId = excluded.actorId,
    metadata = excluded.metadata,
    productionId = excluded.productionId,
    recordId = excluded.recordId,
    version = excluded.version
  WHERE excluded.version >= production_v2_traces.version OR production_v2_traces.version IS NULL
`;

export const buildProductionV2TraceUpsertParams = (pt: any) => ({
  id: pt.id,
  event: pt.event,
  fromStatus: pt.fromStatus,
  toStatus: pt.toStatus,
  actorId: pt.actorId,
  metadata: pt.metadata && typeof pt.metadata === "object" ? JSON.stringify(pt.metadata) : pt.metadata,
  createdAt: pt.createdAt,
  productionId: pt.productionId,
  recordId: pt.recordId,
  version: Number(pt.version || 0),
});

export const productionV2TraceSchema: TableSchema = {
  name: "production_v2_traces",
  create: `
    CREATE TABLE IF NOT EXISTS production_v2_traces (
      id TEXT PRIMARY KEY,
      event TEXT,
      fromStatus TEXT,
      toStatus TEXT,
      actorId TEXT,
      metadata TEXT,
      createdAt TEXT,
      productionId TEXT,
      recordId TEXT,
      version INTEGER DEFAULT 0 NOT NULL
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_production_v2_traces_productionId ON production_v2_traces(productionId)",
  ],
};
