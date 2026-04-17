import { TableSchema } from "./types";

export const productionV2ApprovalLogUpsertSql = `
  INSERT INTO production_v2_approval_logs (
    id,
    status,
    approvedBy,
    rejectedBy,
    approvedAt,
    rejectedAt,
    notes,
    createdAt,
    updatedAt,
    productionId,
    recordId,
    version
  ) VALUES (
    @id,
    @status,
    @approvedBy,
    @rejectedBy,
    @approvedAt,
    @rejectedAt,
    @notes,
    @createdAt,
    @updatedAt,
    @productionId,
    @recordId,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    status = excluded.status,
    approvedBy = excluded.approvedBy,
    rejectedBy = excluded.rejectedBy,
    approvedAt = excluded.approvedAt,
    rejectedAt = excluded.rejectedAt,
    notes = excluded.notes,
    createdAt = excluded.createdAt,
    updatedAt = excluded.updatedAt,
    productionId = excluded.productionId,
    recordId = excluded.recordId,
    version = excluded.version
  WHERE excluded.version >= production_v2_approval_logs.version
     OR excluded.updatedAt >= production_v2_approval_logs.updatedAt
     OR production_v2_approval_logs.updatedAt IS NULL
`;

export const buildProductionV2ApprovalLogUpsertParams = (log: any) => ({
  id: log.id,
  status: log.status,
  approvedBy: log.approvedBy,
  rejectedBy: log.rejectedBy,
  approvedAt: log.approvedAt,
  rejectedAt: log.rejectedAt,
  notes: log.notes,
  createdAt: log.createdAt,
  updatedAt: log.updatedAt,
  productionId: log.productionId,
  recordId: log.recordId,
  version: Number(log.version || 0),
});

export const productionV2ApprovalLogSchema: TableSchema = {
  name: "production_v2_approval_logs",
  create: `
    CREATE TABLE IF NOT EXISTS production_v2_approval_logs (
      id TEXT PRIMARY KEY,
      status TEXT,
      approvedBy TEXT,
      rejectedBy TEXT,
      approvedAt TEXT,
      rejectedAt TEXT,
      notes TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      productionId TEXT,
      recordId TEXT,
      version INTEGER DEFAULT 0 NOT NULL
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_production_v2_approval_logs_productionId ON production_v2_approval_logs(productionId)",
    "CREATE INDEX IF NOT EXISTS idx_production_v2_approval_logs_status ON production_v2_approval_logs(status)",
  ],
};

