import { TableSchema } from "./types";

export type SupplierItemUpsertParams = {
  id: string;
  totalSupplied: number;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
  supplierId: string | null;
  itemId: string | null;
  recordId: string | null;
  version: number;
};

export const supplierItemUpsertSql = `
  INSERT INTO supplier_items (
    id,
    totalSupplied,
    createdAt,
    updatedAt,
    deletedAt,
    supplierId,
    itemId,
    recordId,
    version
  ) VALUES (
    @id,
    @totalSupplied,
    @createdAt,
    @updatedAt,
    @deletedAt,
    @supplierId,
    @itemId,
    @recordId,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    totalSupplied = excluded.totalSupplied,
    createdAt = excluded.createdAt,
    updatedAt = excluded.updatedAt,
    deletedAt = excluded.deletedAt,
    supplierId = excluded.supplierId,
    itemId = excluded.itemId,
    recordId = excluded.recordId,
    version = excluded.version
  WHERE excluded.version >= supplier_items.version
     OR excluded.updatedAt >= supplier_items.updatedAt
     OR supplier_items.updatedAt IS NULL
`;

export const buildSupplierItemUpsertParams = (si: any): SupplierItemUpsertParams => ({
  id: si.id,
  totalSupplied: parseFloat(si.totalSupplied || 0),
  createdAt: si.createdAt ?? null,
  updatedAt: si.updatedAt ?? si.createdAt ?? null,
  deletedAt: si.deletedAt ?? null,
  supplierId: si.supplierId ?? null,
  itemId: si.itemId ?? null,
  recordId: si.recordId ?? null,
  version: Number(si.version || 0),
});

export const supplierItemSchema: TableSchema = {
  name: "supplier_items",
  create: `
    CREATE TABLE IF NOT EXISTS supplier_items (
      id TEXT PRIMARY KEY,
      totalSupplied REAL,
      createdAt TEXT,
      updatedAt TEXT,
      deletedAt TEXT,
      supplierId TEXT,
      itemId TEXT,
      recordId TEXT,
      version INTEGER
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_supplier_items_supplierId ON supplier_items(supplierId);",
    "CREATE INDEX IF NOT EXISTS idx_supplier_items_itemId ON supplier_items(itemId);",
  ],
};

