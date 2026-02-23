import { TableSchema } from "./types";

export const syncSessionSchema: TableSchema = {
  name: "sync_session",

  create: `
    CREATE TABLE IF NOT EXISTS sync_session (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      deviceId TEXT,
      deviceName TEXT,
      status TEXT DEFAULT 'initial' NOT NULL,
      direction TEXT DEFAULT 'pull' NOT NULL,
      scope TEXT,
      recordsPulled INTEGER DEFAULT 0 NOT NULL,
      recordsPushed INTEGER DEFAULT 0 NOT NULL,
      tableStats TEXT,
      startedAt TEXT,
      completedAt TEXT,
      nextSyncFrom TEXT,
      conflicts TEXT,
      errorMessage TEXT,
      errorDetails TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );
  `,
};

