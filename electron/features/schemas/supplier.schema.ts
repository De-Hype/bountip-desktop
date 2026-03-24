import { TableSchema } from "./types";

export type SupplierUpsertParams = {
  id: string;
  isActive: number;
  name: string | null;
  representativeName: string | null;
  phoneNumbers: string | null;
  emailAddress: string | null;
  address: string | null;
  supplierCode: string | null;
  notes: string | null;
  taxNumber: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
  outletId: string | null;
  recordId: string | null;
  version: number;
};

export const supplierUpsertSql = `
  INSERT INTO suppliers (
    id,
    isActive,
    name,
    representativeName,
    phoneNumbers,
    emailAddress,
    address,
    supplierCode,
    notes,
    taxNumber,
    createdAt,
    updatedAt,
    deletedAt,
    outletId,
    recordId,
    version
  ) VALUES (
    @id,
    @isActive,
    @name,
    @representativeName,
    @phoneNumbers,
    @emailAddress,
    @address,
    @supplierCode,
    @notes,
    @taxNumber,
    @createdAt,
    @updatedAt,
    @deletedAt,
    @outletId,
    @recordId,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    isActive = excluded.isActive,
    name = excluded.name,
    representativeName = excluded.representativeName,
    phoneNumbers = excluded.phoneNumbers,
    emailAddress = excluded.emailAddress,
    address = excluded.address,
    supplierCode = excluded.supplierCode,
    notes = excluded.notes,
    taxNumber = excluded.taxNumber,
    createdAt = excluded.createdAt,
    updatedAt = excluded.updatedAt,
    deletedAt = excluded.deletedAt,
    outletId = excluded.outletId,
    recordId = excluded.recordId,
    version = excluded.version
  WHERE excluded.version >= suppliers.version
     OR excluded.updatedAt >= suppliers.updatedAt
     OR suppliers.updatedAt IS NULL
`;

export const buildSupplierUpsertParams = (s: any): SupplierUpsertParams => ({
  id: s.id,
  isActive: s.isActive ? 1 : 0,
  name: s.name ?? null,
  representativeName:
    s.representativeName && typeof s.representativeName === "object"
      ? JSON.stringify(s.representativeName)
      : (s.representativeName ?? null),
  phoneNumbers:
    s.phoneNumbers && typeof s.phoneNumbers === "object"
      ? JSON.stringify(s.phoneNumbers)
      : (s.phoneNumbers ?? null),
  emailAddress:
    s.emailAddress && typeof s.emailAddress === "object"
      ? JSON.stringify(s.emailAddress)
      : (s.emailAddress ?? null),
  address: s.address ?? null,
  supplierCode: s.supplierCode ?? null,
  notes: s.notes ?? null,
  taxNumber: s.taxNumber ?? null,
  createdAt: s.createdAt ?? null,
  updatedAt: s.updatedAt ?? s.createdAt ?? null,
  deletedAt: s.deletedAt ?? null,
  outletId: s.outletId ?? null,
  recordId: s.recordId ?? null,
  version: Number(s.version || 0),
});

export const supplierSchema: TableSchema = {
  name: "suppliers",
  create: `
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      isActive INTEGER DEFAULT 1 NOT NULL,
      name TEXT,
      representativeName TEXT,
      phoneNumbers TEXT,
      emailAddress TEXT,
      address TEXT,
      supplierCode TEXT,
      notes TEXT,
      taxNumber TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      deletedAt TEXT,
      outletId TEXT,
      recordId TEXT,
      version INTEGER
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_suppliers_outletId ON suppliers(outletId);",
    "CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);",
    "CREATE INDEX IF NOT EXISTS idx_suppliers_supplierCode ON suppliers(supplierCode);",
  ],
};

