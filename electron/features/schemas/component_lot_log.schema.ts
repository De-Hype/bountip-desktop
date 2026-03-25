import { TableSchema } from "./types";

export type ComponentLotLogUpsertParams = {
  id: string;
  changeType: string | null;
  previousLevel: number;
  currentLevel: number;
  actionTakenBy: string | null;
  changeAmount: number;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
  lotId: string | null;
  recordId: string | null;
  version: number;
};

export const componentLotLogUpsertSql = `
  INSERT INTO component_lot_logs (
    id,
    changeType,
    previousLevel,
    currentLevel,
    actionTakenBy,
    changeAmount,
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
    createdAt = excluded.createdAt,
    updatedAt = excluded.updatedAt,
    deletedAt = excluded.deletedAt,
    lotId = excluded.lotId,
    recordId = excluded.recordId,
    version = excluded.version
  WHERE excluded.version >= component_lot_logs.version
     OR excluded.updatedAt >= component_lot_logs.updatedAt
     OR component_lot_logs.updatedAt IS NULL
`;

export const buildComponentLotLogUpsertParams = (
  cll: any,
): ComponentLotLogUpsertParams => ({
  id: cll.id,
  changeType: cll.changeType ?? null,
  previousLevel: parseFloat(cll.previousLevel || 0),
  currentLevel: parseFloat(cll.currentLevel || 0),
  actionTakenBy: cll.actionTakenBy ?? null,
  changeAmount: parseFloat(cll.changeAmount || 0),
  createdAt: cll.createdAt ?? null,
  updatedAt: cll.updatedAt ?? cll.createdAt ?? null,
  deletedAt: cll.deletedAt ?? cll.deleted_at ?? null,
  lotId: cll.lotId ?? null,
  recordId: cll.recordId ?? null,
  version: Number(cll.version || 0),
});

export const componentLotLogSchema: TableSchema = {
  name: "component_lot_logs",
  create: `
    CREATE TABLE IF NOT EXISTS component_lot_logs (
      id TEXT PRIMARY KEY,
      changeType TEXT,
      previousLevel REAL,
      currentLevel REAL,
      actionTakenBy TEXT,
      changeAmount REAL,
      createdAt TEXT,
      updatedAt TEXT,
      deletedAt TEXT,
      lotId TEXT,
      recordId TEXT,
      version INTEGER
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_component_lot_logs_lotId ON component_lot_logs(lotId);",
    "CREATE INDEX IF NOT EXISTS idx_component_lot_logs_createdAt ON component_lot_logs(createdAt);",
  ],
};

