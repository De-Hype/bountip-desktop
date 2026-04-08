import { TableSchema } from "./types";

export const cartUpsertSql = `
  INSERT INTO cart (
    id,
    reference,
    status,
    createdAt,
    updatedAt,
    outletId,
    itemCount,
    totalQuantity,
    totalAmount,
    customerId,
    recordId,
    version
  ) VALUES (
    @id,
    @reference,
    @status,
    @createdAt,
    @updatedAt,
    @outletId,
    @itemCount,
    @totalQuantity,
    @totalAmount,
    @customerId,
    @recordId,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    reference = excluded.reference,
    status = excluded.status,
    updatedAt = excluded.updatedAt,
    outletId = excluded.outletId,
    itemCount = excluded.itemCount,
    totalQuantity = excluded.totalQuantity,
    totalAmount = excluded.totalAmount,
    customerId = excluded.customerId,
    recordId = excluded.recordId,
    version = excluded.version
  WHERE excluded.version >= cart.version OR excluded.updatedAt >= cart.updatedAt OR cart.updatedAt IS NULL
`;

export const buildCartUpsertParams = (c: any) => ({
  id: c.id,
  reference: c.reference,
  status: c.status,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
  outletId: c.outletId,
  itemCount: c.itemCount,
  totalQuantity: c.totalQuantity,
  totalAmount: c.totalAmount,
  customerId: c.customerId,
  recordId: c.recordId,
  version: c.version,
});

export const cartSchema: TableSchema = {
  name: "cart",

  create: `
    CREATE TABLE IF NOT EXISTS cart (
      id TEXT PRIMARY KEY,
      reference TEXT NOT NULL,
      status TEXT DEFAULT 'active' NOT NULL,
      createdAt TEXT,
      updatedAt TEXT,
      outletId TEXT,
      itemCount INTEGER DEFAULT 0 NOT NULL,
      totalQuantity INTEGER DEFAULT 0 NOT NULL,
      totalAmount REAL DEFAULT 0 NOT NULL,
      customerId TEXT,
      recordId TEXT,
      version INTEGER DEFAULT 0 NOT NULL DEFAULT 0
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_cart_outletId ON cart(outletId)",
    "CREATE INDEX IF NOT EXISTS idx_cart_customerId ON cart(customerId)",
  ],
};
