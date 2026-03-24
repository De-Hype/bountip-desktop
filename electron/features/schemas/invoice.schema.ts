import { TableSchema } from "./types";

export type InvoiceUpsertParams = {
  id: string;
  invoiceNumber: string | null;
  subTotal: number;
  totalAmount: number;
  totalItemCount: number;
  status: string | null;
  submittedBy: string | null;
  taxes: string | null;
  charges: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
  outletId: string | null;
  supplierId: string | null;
  recordId: string | null;
  version: number;
};

export const invoiceUpsertSql = `
  INSERT INTO invoices (
    id,
    invoiceNumber,
    subTotal,
    totalAmount,
    totalItemCount,
    status,
    submittedBy,
    taxes,
    charges,
    createdAt,
    updatedAt,
    deletedAt,
    outletId,
    supplierId,
    recordId,
    version
  ) VALUES (
    @id,
    @invoiceNumber,
    @subTotal,
    @totalAmount,
    @totalItemCount,
    @status,
    @submittedBy,
    @taxes,
    @charges,
    @createdAt,
    @updatedAt,
    @deletedAt,
    @outletId,
    @supplierId,
    @recordId,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    invoiceNumber = excluded.invoiceNumber,
    subTotal = excluded.subTotal,
    totalAmount = excluded.totalAmount,
    totalItemCount = excluded.totalItemCount,
    status = excluded.status,
    submittedBy = excluded.submittedBy,
    taxes = excluded.taxes,
    charges = excluded.charges,
    createdAt = excluded.createdAt,
    updatedAt = excluded.updatedAt,
    deletedAt = excluded.deletedAt,
    outletId = excluded.outletId,
    supplierId = excluded.supplierId,
    recordId = excluded.recordId,
    version = excluded.version
  WHERE excluded.version >= invoices.version
     OR excluded.updatedAt >= invoices.updatedAt
     OR invoices.updatedAt IS NULL
`;

export const buildInvoiceUpsertParams = (inv: any): InvoiceUpsertParams => ({
  id: inv.id,
  invoiceNumber: inv.invoiceNumber ?? null,
  subTotal: parseFloat(inv.subTotal || 0),
  totalAmount: parseFloat(inv.totalAmount || 0),
  totalItemCount: Number(inv.totalItemCount || 0),
  status: inv.status ?? null,
  submittedBy: inv.submittedBy ?? null,
  taxes:
    inv.taxes && typeof inv.taxes === "object"
      ? JSON.stringify(inv.taxes)
      : (inv.taxes ?? null),
  charges:
    inv.charges && typeof inv.charges === "object"
      ? JSON.stringify(inv.charges)
      : (inv.charges ?? null),
  createdAt: inv.createdAt ?? null,
  updatedAt: inv.updatedAt ?? inv.createdAt ?? null,
  deletedAt: inv.deletedAt ?? null,
  outletId: inv.outletId ?? null,
  supplierId: inv.supplierId ?? null,
  recordId: inv.recordId ?? null,
  version: Number(inv.version || 0),
});

export const invoiceSchema: TableSchema = {
  name: "invoices",
  create: `
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoiceNumber TEXT,
      subTotal REAL,
      totalAmount REAL,
      totalItemCount INTEGER,
      status TEXT,
      submittedBy TEXT,
      taxes TEXT,
      charges TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      deletedAt TEXT,
      outletId TEXT,
      supplierId TEXT,
      recordId TEXT,
      version INTEGER
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_invoices_outletId ON invoices(outletId);",
    "CREATE INDEX IF NOT EXISTS idx_invoices_supplierId ON invoices(supplierId);",
    "CREATE INDEX IF NOT EXISTS idx_invoices_createdAt ON invoices(createdAt);",
  ],
};

