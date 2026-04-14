import { TableSchema } from "./types";

export type ModifierOptionUpsertParams = {
  id: string;
  name: string | null;
  amount: number;
  maximumQuantity: number;
  limitQuantity: number;
  modifierId: string | null;
  reference: string | null;
  recordId: string | null;
  version: number;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
};

export const modifierOptionUpsertSql = `
  INSERT INTO modifier_option (
    id,
    name,
    amount,
    maximumQuantity,
    limitQuantity,
    modifierId,
    reference,
    recordId,
    version,
    createdAt,
    updatedAt,
    deletedAt
  ) VALUES (
    @id,
    @name,
    @amount,
    @maximumQuantity,
    @limitQuantity,
    @modifierId,
    @reference,
    @recordId,
    @version,
    @createdAt,
    @updatedAt,
    @deletedAt
  )
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    amount = excluded.amount,
    maximumQuantity = excluded.maximumQuantity,
    limitQuantity = excluded.limitQuantity,
    modifierId = excluded.modifierId,
    reference = excluded.reference,
    recordId = excluded.recordId,
    version = excluded.version,
    createdAt = excluded.createdAt,
    updatedAt = excluded.updatedAt,
    deletedAt = excluded.deletedAt
  WHERE excluded.version >= modifier_option.version
     OR excluded.updatedAt >= modifier_option.updatedAt
     OR modifier_option.updatedAt IS NULL
`;

export const buildModifierOptionUpsertParams = (
  mo: any,
): ModifierOptionUpsertParams => ({
  id: String(mo.id || ""),
  name: mo.name ?? null,
  amount: Number(mo.amount ?? 0),
  maximumQuantity: Number(mo.maximum_quantity ?? mo.maximumQuantity ?? 0),
  limitQuantity: mo.limit_quantity ? 1 : mo.limitQuantity ? 1 : 0,
  modifierId: mo.modifierId ?? mo.modifier_id ?? null,
  reference: mo.reference ?? null,
  recordId: mo.recordId ?? mo.record_id ?? null,
  version: Number(mo.version ?? 0),
  createdAt: mo.created_at ?? mo.createdAt ?? null,
  updatedAt: mo.updated_at ?? mo.updatedAt ?? null,
  deletedAt: mo.deleted_at ?? mo.deletedAt ?? null,
});

export const modifierOptionSchema: TableSchema = {
  name: "modifier_option",
  create: `
    CREATE TABLE IF NOT EXISTS modifier_option (
      id TEXT PRIMARY KEY,
      name TEXT,
      amount REAL DEFAULT 0 NOT NULL,
      maximumQuantity INTEGER DEFAULT 0 NOT NULL,
      limitQuantity INTEGER DEFAULT 0 NOT NULL,
      modifierId TEXT,
      reference TEXT,
      recordId TEXT,
      version INTEGER DEFAULT 0 NOT NULL,
      createdAt TEXT,
      updatedAt TEXT,
      deletedAt TEXT
    );
  `,
  indexes: [
    `CREATE INDEX IF NOT EXISTS idx_modifier_option_modifierId ON modifier_option(modifierId);`,
  ],
};
