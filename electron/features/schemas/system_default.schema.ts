import { TableSchema } from "./types";

export type SystemDefaultUpsertParams = {
  id: string;
  key: string;
  data: string;
  outletId: string | null;
  recordId: string | null;
  version: number;
};

export const systemDefaultUpsertSql = `
  INSERT OR REPLACE INTO system_default (
    id,
    key,
    data,
    outletId,
    recordId,
    version
  ) VALUES (
    @id,
    @key,
    @data,
    @outletId,
    @recordId,
    @version
  )
`;

export const buildSystemDefaultUpsertParams = (
  s: any,
): SystemDefaultUpsertParams => ({
  id: s.id,
  key: s.key || "category",
  data: Array.isArray(s.data) ? JSON.stringify(s.data) : s.data || "[]",
  outletId: s.outletId || null,
  recordId: s.recordId || null,
  version: s.version || 0,
});

export const systemDefaultSchema: TableSchema = {
  name: "system_default",

  create: `
    CREATE TABLE IF NOT EXISTS system_default (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL,
      data TEXT NOT NULL,
      outletId TEXT,
      recordId TEXT,
      version INTEGER DEFAULT 0
    );
  `,
  indexes: [
    `CREATE INDEX IF NOT EXISTS idx_system_default_key ON system_default(key);`,
    `CREATE INDEX IF NOT EXISTS idx_system_default_outletId ON system_default(outletId);`,
  ],
};
