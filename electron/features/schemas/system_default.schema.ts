import { TableSchema } from "./types";

export const systemDefaultSchema: TableSchema = {
  name: "system_default",

  create: `
    CREATE TABLE IF NOT EXISTS system_default (
      id TEXT PRIMARY KEY,
      key TEXT DEFAULT 'category' NOT NULL,
      data TEXT DEFAULT '[]' NOT NULL,
      outletId TEXT
    );
  `,
};

