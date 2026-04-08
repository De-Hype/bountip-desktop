import { TableSchema } from "./types";

export type InvoiceItemUpsertParams = {
  id: string;
  description: string | null;
  barcode: string | null;
  quantity: number;
  unitPrice: number;
  inventoryItemId: string | null;
  lineTotal: number;
  invoiceId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
  recordId: string | null;
  version: number;
};

export const invoiceItemUpsertSql = `
  INSERT INTO invoice_items (
    id,
    description,
    barcode,
    quantity,
    unitPrice,
    inventoryItemId,
    lineTotal,
    invoiceId,
    createdAt,
    updatedAt,
    deletedAt,
    recordId,
    version
  ) VALUES (
    @id,
    @description,
    @barcode,
    @quantity,
    @unitPrice,
    @inventoryItemId,
    @lineTotal,
    @invoiceId,
    @createdAt,
    @updatedAt,
    @deletedAt,
    @recordId,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    description = excluded.description,
    barcode = excluded.barcode,
    quantity = excluded.quantity,
    unitPrice = excluded.unitPrice,
    inventoryItemId = excluded.inventoryItemId,
    lineTotal = excluded.lineTotal,
    invoiceId = excluded.invoiceId,
    createdAt = excluded.createdAt,
    updatedAt = excluded.updatedAt,
    deletedAt = excluded.deletedAt,
    recordId = excluded.recordId,
    version = excluded.version
  WHERE excluded.version >= invoice_items.version
     OR excluded.updatedAt >= invoice_items.updatedAt
     OR invoice_items.updatedAt IS NULL
`;

export const buildInvoiceItemUpsertParams = (
  ii: any,
): InvoiceItemUpsertParams => ({
  id: ii.id,
  description: ii.description ?? null,
  barcode: ii.barcode ?? null,
  quantity: parseFloat(ii.quantity || 0),
  unitPrice: parseFloat(ii.unitPrice || 0),
  inventoryItemId: ii.inventoryItemId ?? null,
  lineTotal: parseFloat(ii.lineTotal || 0),
  invoiceId: ii.invoiceId ?? null,
  createdAt: ii.createdAt ?? null,
  updatedAt: ii.updatedAt ?? ii.createdAt ?? null,
  deletedAt: ii.deletedAt ?? null,
  recordId: ii.recordId ?? null,
  version: Number(ii.version || 0),
});

export const invoiceItemSchema: TableSchema = {
  name: "invoice_items",
  create: `
    CREATE TABLE IF NOT EXISTS invoice_items (
      id TEXT PRIMARY KEY,
      description TEXT,
      barcode TEXT,
      quantity REAL,
      unitPrice REAL,
      inventoryItemId TEXT,
      lineTotal REAL,
      invoiceId TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      deletedAt TEXT,
      recordId TEXT,
      version INTEGER DEFAULT 0 NOT NULL
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_invoice_items_invoiceId ON invoice_items(invoiceId);",
    "CREATE INDEX IF NOT EXISTS idx_invoice_items_inventoryItemId ON invoice_items(inventoryItemId);",
  ],
};

