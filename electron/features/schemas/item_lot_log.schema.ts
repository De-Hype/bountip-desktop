import { TableSchema } from "./types";

export type ItemLotLogUpsertParams = {
  id: string;
  changeType: string | null;
  previousLevel: number;
  currentLevel: number;
  actionTakenBy: string | null;
  changeAmount: number;
  reason: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
  lotId: string | null;
  recordId: string | null;
  version: number;
};

export const itemLotLogUpsertSql = `
  INSERT INTO item_lot_logs (
    id,
    changeType,
    previousLevel,
    currentLevel,
    actionTakenBy,
    changeAmount,
    reason,
    createdAt,
    updatedAt,
    deletedAt,
    lotId,
    recordId,
    version
  ) VALUES (
    @id,
    @changeType,
    @previousLevel,
    @currentLevel,
    @actionTakenBy,
    @changeAmount,
    @reason,
    @createdAt,
    @updatedAt,
    @deletedAt,
    @lotId,
    @recordId,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    changeType = excluded.changeType,
    previousLevel = excluded.previousLevel,
    currentLevel = excluded.currentLevel,
    actionTakenBy = excluded.actionTakenBy,
    changeAmount = excluded.changeAmount,
    reason = excluded.reason,
    createdAt = excluded.createdAt,
    updatedAt = excluded.updatedAt,
    deletedAt = excluded.deletedAt,
    lotId = excluded.lotId,
    recordId = excluded.recordId,
    version = excluded.version
  WHERE excluded.version >= item_lot_logs.version
     OR excluded.updatedAt >= item_lot_logs.updatedAt
     OR item_lot_logs.updatedAt IS NULL
`;

export const buildItemLotLogUpsertParams = (ill: any): ItemLotLogUpsertParams => ({
  id: ill.id,
  changeType: ill.changeType ?? null,
  previousLevel: parseFloat(ill.previousLevel || 0),
  currentLevel: parseFloat(ill.currentLevel || 0),
  actionTakenBy: ill.actionTakenBy ?? null,
  changeAmount: parseFloat(ill.changeAmount || 0),
  reason: ill.reason ?? null,
  createdAt: ill.createdAt ?? null,
  updatedAt: ill.updatedAt ?? ill.createdAt ?? null,
  deletedAt: ill.deletedAt ?? ill.deleted_at ?? null,
  lotId: ill.lotId ?? null,
  recordId: ill.recordId ?? null,
  version: Number(ill.version || 0),
});

export const itemLotLogSchema: TableSchema = {
  name: "item_lot_logs",
  create: `
    CREATE TABLE IF NOT EXISTS item_lot_logs (
      id TEXT PRIMARY KEY,
      changeType TEXT,
      previousLevel REAL,
      currentLevel REAL,
      actionTakenBy TEXT,
      changeAmount REAL,
      reason TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      deletedAt TEXT,
      lotId TEXT,
      recordId TEXT,
      version INTEGER DEFAULT 0 NOT NULL
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_item_lot_logs_lotId ON item_lot_logs(lotId);",
    "CREATE INDEX IF NOT EXISTS idx_item_lot_logs_createdAt ON item_lot_logs(createdAt);",
  ],
};

