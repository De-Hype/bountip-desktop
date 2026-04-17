import { TableSchema } from "./types";

export type ModifierUpsertParams = {
  id: string;
  modifierType: string | null;
  modifierMode: string | null;
  showInPos: number;
  name: string | null;
  limitTotalSelection: number;
  maximumQuantity: number;
  productId: string | null;
  outletId: string | null;
  reference: string | null;
  recordId: string | null;
  version: number;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
};

export const modifierUpsertSql = `
  INSERT INTO modifier (
    id,
    modifierType,
    modifierMode,
    showInPos,
    name,
    limitTotalSelection,
    maximumQuantity,
    productId,
    outletId,
    reference,
    recordId,
    version,
    createdAt,
    updatedAt,
    deletedAt
  ) VALUES (
    @id,
    @modifierType,
    @modifierMode,
    @showInPos,
    @name,
    @limitTotalSelection,
    @maximumQuantity,
    @productId,
    @outletId,
    @reference,
    @recordId,
    @version,
    @createdAt,
    @updatedAt,
    @deletedAt
  )
  ON CONFLICT(id) DO UPDATE SET
    modifierType = excluded.modifierType,
    modifierMode = excluded.modifierMode,
    showInPos = excluded.showInPos,
    name = excluded.name,
    limitTotalSelection = excluded.limitTotalSelection,
    maximumQuantity = excluded.maximumQuantity,
    productId = excluded.productId,
    outletId = excluded.outletId,
    reference = excluded.reference,
    recordId = excluded.recordId,
    version = excluded.version,
    createdAt = excluded.createdAt,
    updatedAt = excluded.updatedAt,
    deletedAt = excluded.deletedAt
  WHERE excluded.version >= modifier.version
     OR excluded.updatedAt >= modifier.updatedAt
     OR modifier.updatedAt IS NULL
`;

export const buildModifierUpsertParams = (m: any): ModifierUpsertParams => ({
  id: String(m.id || ""),
  modifierType: m.modifier_type ?? m.modifierType ?? null,
  modifierMode: m.modifier_mode ?? m.modifierMode ?? null,
  showInPos: m.show_in_pos ? 1 : m.showInPos ? 1 : 0,
  name: m.name ?? null,
  limitTotalSelection: m.limit_total_selection
    ? 1
    : m.limitTotalSelection
      ? 1
      : 0,
  maximumQuantity: Number(m.maximum_quantity ?? m.maximumQuantity ?? 0),
  productId: m.productId ?? m.product_id ?? null,
  outletId: m.outletId ?? m.outlet_id ?? null,
  reference: m.reference ?? null,
  recordId: m.recordId ?? m.record_id ?? null,
  version: Number(m.version ?? 0),
  createdAt: m.created_at ?? m.createdAt ?? null,
  updatedAt: m.updated_at ?? m.updatedAt ?? null,
  deletedAt: m.deleted_at ?? m.deletedAt ?? null,
});

export const modifierSchema: TableSchema = {
  name: "modifier",
  create: `
    CREATE TABLE IF NOT EXISTS modifier (
      id TEXT PRIMARY KEY,
      modifierType TEXT,
      modifierMode TEXT,
      showInPos INTEGER DEFAULT 0 NOT NULL,
      name TEXT,
      limitTotalSelection INTEGER DEFAULT 0 NOT NULL,
      maximumQuantity INTEGER DEFAULT 0 NOT NULL,
      productId TEXT,
      outletId TEXT,
      reference TEXT,
      recordId TEXT,
      version INTEGER DEFAULT 0 NOT NULL,
      createdAt TEXT,
      updatedAt TEXT,
      deletedAt TEXT
    );
  `,
  indexes: [
    `CREATE INDEX IF NOT EXISTS idx_modifier_outletId ON modifier(outletId);`,
    `CREATE INDEX IF NOT EXISTS idx_modifier_productId ON modifier(productId);`,
    `CREATE INDEX IF NOT EXISTS idx_modifier_type ON modifier(modifierType);`,
  ],
};
