import { TableSchema } from "./types";

export const productionUpsertSql = `
  INSERT INTO productions (
    id,
    status,
    previousStatus,
    productionDate,
    additionalInformation,
    productionTime,
    initiator,
    cancelReason,
    batchId,
    scheduleId,
    createdAt,
    updatedAt,
    metadata,
    outletId,
    recordId,
    version,
    productionDueDate,
    productionManager
  ) VALUES (
    @id,
    @status,
    @previousStatus,
    @productionDate,
    @additionalInformation,
    @productionTime,
    @initiator,
    @cancelReason,
    @batchId,
    @scheduleId,
    @createdAt,
    @updatedAt,
    @metadata,
    @outletId,
    @recordId,
    @version,
    @productionDueDate,
    @productionManager
  )
  ON CONFLICT(id) DO UPDATE SET
    status = excluded.status,
    previousStatus = excluded.previousStatus,
    productionDate = excluded.productionDate,
    additionalInformation = excluded.additionalInformation,
    productionTime = excluded.productionTime,
    initiator = excluded.initiator,
    cancelReason = excluded.cancelReason,
    batchId = excluded.batchId,
    scheduleId = excluded.scheduleId,
    updatedAt = excluded.updatedAt,
    metadata = excluded.metadata,
    outletId = excluded.outletId,
    recordId = excluded.recordId,
    version = excluded.version,
    productionDueDate = excluded.productionDueDate,
    productionManager = excluded.productionManager
  WHERE excluded.version >= productions.version OR excluded.updatedAt >= productions.updatedAt OR productions.updatedAt IS NULL
`;

export const buildProductionUpsertParams = (p: any) => ({
  id: p.id,
  status: p.status,
  previousStatus: p.previousStatus,
  productionDate: p.productionDate,
  additionalInformation: p.additionalInformation,
  productionTime: p.productionTime,
  initiator: p.initiator,
  cancelReason: p.cancelReason,
  batchId: p.batchId,
  scheduleId: p.scheduleId,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
  metadata:
    typeof p.metadata === "object" ? JSON.stringify(p.metadata) : p.metadata,
  outletId: p.outletId,
  recordId: p.recordId,
  version: p.version,
  productionDueDate: p.productionDueDate,
  productionManager: p.productionManager,
});

export const productionSchema: TableSchema = {
  name: "productions",
  create: `
    CREATE TABLE IF NOT EXISTS productions (
      id TEXT PRIMARY KEY,
      status TEXT,
      previousStatus TEXT,
      productionDate TEXT,
      additionalInformation TEXT,
      productionTime TEXT,
      initiator TEXT,
      cancelReason TEXT,
      batchId TEXT,
      scheduleId TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      metadata TEXT,
      outletId TEXT,
      recordId TEXT,
      version INTEGER,
      productionDueDate TEXT,
      productionManager TEXT
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_productions_outletId ON productions(outletId)",
    "CREATE INDEX IF NOT EXISTS idx_productions_status ON productions(status)",
    "CREATE INDEX IF NOT EXISTS idx_productions_batchId ON productions(batchId)",
    "CREATE INDEX IF NOT EXISTS idx_productions_scheduleId ON productions(scheduleId)",
  ],
};
