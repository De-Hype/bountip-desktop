import { TableSchema } from "./types";

export const customerAddressSchema: TableSchema = {
  name: "customer_address",

  create: `
    CREATE TABLE IF NOT EXISTS customer_address (
      id TEXT PRIMARY KEY,
      address TEXT,
      isDefault INTEGER DEFAULT 0 NOT NULL,
      createdAt TEXT,
      updatedAt TEXT,
      customerId TEXT,
      recordId TEXT,
      version INTEGER DEFAULT 0 NOT NULL DEFAULT 0
    );
  `,
};

export const customerAddressUpsertSql = `
  INSERT INTO customer_address (
    id, address, isDefault, createdAt, updatedAt, customerId, recordId, version
  ) VALUES (
    @id, @address, @isDefault, @createdAt, @updatedAt, @customerId, @recordId, @version
  ) ON CONFLICT(id) DO UPDATE SET
    address = excluded.address,
    isDefault = excluded.isDefault,
    createdAt = excluded.createdAt,
    updatedAt = excluded.updatedAt,
    customerId = excluded.customerId,
    recordId = excluded.recordId,
    version = excluded.version
  WHERE excluded.version >= customer_address.version OR excluded.updatedAt >= customer_address.updatedAt OR customer_address.updatedAt IS NULL
`;

export function buildCustomerAddressUpsertParams(data: any) {
  return {
    id: data.id,
    address: data.address,
    isDefault: data.isDefault ? 1 : 0,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    customerId: data.customerId,
    recordId: data.recordId || null,
    version: data.version || 0,
  };
}

