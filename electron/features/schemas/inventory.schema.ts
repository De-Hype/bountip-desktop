import { TableSchema } from "./types";

export const inventoryUpsertSql = `
  INSERT INTO inventory (
    id,
    type,
    allowProcurement,
    location,
    reference,
    externalReference,
    createdAt,
    updatedAt,
    recordId,
    version,
    outletId,
    businessId
  ) VALUES (
    @id,
    @type,
    @allowProcurement,
    @location,
    @reference,
    @externalReference,
    @createdAt,
    @updatedAt,
    @recordId,
    @version,
    @outletId,
    @businessId
  )
  ON CONFLICT(id) DO UPDATE SET
    type = excluded.type,
    allowProcurement = excluded.allowProcurement,
    location = excluded.location,
    reference = excluded.reference,
    externalReference = excluded.externalReference,
    updatedAt = excluded.updatedAt,
    recordId = excluded.recordId,
    version = excluded.version,
    outletId = excluded.outletId,
    businessId = excluded.businessId
  WHERE excluded.version >= inventory.version OR excluded.updatedAt >= inventory.updatedAt OR inventory.updatedAt IS NULL
`;

export const buildInventoryUpsertParams = (i: any) => ({
  id: i.id,
  type: i.type,
  allowProcurement: i.allowProcurement ? 1 : 0,
  location: i.location,
  reference: i.reference,
  externalReference: i.externalReference,
  createdAt: i.createdAt,
  updatedAt: i.updatedAt,
  recordId: i.recordId,
  version: i.version,
  outletId: i.outletId,
  businessId: i.businessId,
});

export const inventorySchema: TableSchema = {
  name: "inventory",

  create: `
    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      type TEXT DEFAULT 'central' NOT NULL,
      allowProcurement INTEGER DEFAULT 1 NOT NULL,
      location TEXT,
      reference TEXT,
      externalReference TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      recordId TEXT,
      version INTEGER DEFAULT 0 NOT NULL,
      businessId TEXT,
      outletId TEXT
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_inventory_outletId ON inventory(outletId)",
    "CREATE INDEX IF NOT EXISTS idx_inventory_businessId ON inventory(businessId)",
  ],
};

