import { TableSchema } from "./types";

export const syncTableLogSchema: TableSchema = {
  name: "sync_table_log",

  create: `
    CREATE TABLE IF NOT EXISTS sync_table_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionId TEXT NOT NULL,
      userId TEXT NOT NULL,
      businessId TEXT,
      outletId TEXT,
      tableName TEXT NOT NULL,
      operation TEXT DEFAULT 'pull' NOT NULL,
      recordsProcessed INTEGER DEFAULT 0 NOT NULL,
      syncVersion INTEGER DEFAULT 1 NOT NULL,
      syncedAt TEXT NOT NULL,
      lastRecordTimestamp TEXT,
      cursorState TEXT,
      filterState TEXT,
      conflictsDetected INTEGER DEFAULT 0 NOT NULL,
      conflictsResolved INTEGER DEFAULT 0 NOT NULL,
      createdAt TEXT
    );
  `,
};

