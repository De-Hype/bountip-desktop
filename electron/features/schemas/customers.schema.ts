import { TableSchema } from "./types";

export type CustomerUpsertParams = {
  id: string;
  email: string | null;
  name: string | null;
  phoneNumber: string | null;
  customerCode: string | null;
  status: string;
  verificationCode: string | null;
  verificationCodeExpiry: string | null;
  emailVerified: number;
  phoneVerfied: number;
  reference: string | null;
  createdAt: string | null;
  outletId: string | null;
  otherEmails: string | null;
  otherNames: string | null;
  otherPhoneNumbers: string | null;
  customerType: string;
  pricingTier: string | null;
  paymentTermId: string | null;
  organizationName: string | null;
  addedBy: string | null;
  updatedBy: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
  reason: string | null;
  recordId: string | null;
  version: number;
};

export const customerUpsertSql = `
  INSERT OR REPLACE INTO customers (
    id,
    email,
    name,
    phoneNumber,
    customerCode,
    status,
    verificationCode,
    verificationCodeExpiry,
    emailVerified,
    phoneVerfied,
    reference,
    createdAt,
    outletId,
    otherEmails,
    otherNames,
    otherPhoneNumbers,
    customerType,
    pricingTier,
    paymentTermId,
    organizationName,
    addedBy,
    updatedBy,
    updatedAt,
    deletedAt,
    reason,
    recordId,
    version
  ) VALUES (
    @id,
    @email,
    @name,
    @phoneNumber,
    @customerCode,
    @status,
    @verificationCode,
    @verificationCodeExpiry,
    @emailVerified,
    @phoneVerfied,
    @reference,
    @createdAt,
    @outletId,
    @otherEmails,
    @otherNames,
    @otherPhoneNumbers,
    @customerType,
    @pricingTier,
    @paymentTermId,
    @organizationName,
    @addedBy,
    @updatedBy,
    @updatedAt,
    @deletedAt,
    @reason,
    @recordId,
    @version
  )
`;

export const buildCustomerUpsertParams = (c: any): CustomerUpsertParams => ({
  id: c.id,
  email: c.email ?? null,
  name: c.name ?? null,
  phoneNumber: c.phoneNumber ?? null,
  customerCode: c.customerCode ?? null,
  status: c.status ?? "active",
  verificationCode: c.verificationCode ?? null,
  verificationCodeExpiry: c.verificationCodeExpiry ?? null,
  emailVerified: c.emailVerified ? 1 : 0,
  phoneVerfied: c.phoneVerfied ? 1 : 0,
  reference: c.reference ?? null,
  createdAt: c.createdAt ?? null,
  outletId: c.outletId ?? null,
  otherEmails: Array.isArray(c.otherEmails)
    ? JSON.stringify(c.otherEmails)
    : (c.otherEmails ?? null),
  otherNames: Array.isArray(c.otherNames)
    ? JSON.stringify(c.otherNames)
    : (c.otherNames ?? null),
  otherPhoneNumbers: Array.isArray(c.otherPhoneNumbers)
    ? JSON.stringify(c.otherPhoneNumbers)
    : (c.otherPhoneNumbers ?? null),
  customerType: c.customerType ?? "individual",
  pricingTier: c.pricingTier ?? null,
  paymentTermId: c.paymentTermId ?? null,
  organizationName: c.organizationName ?? null,
  addedBy: c.addedBy ?? null,
  updatedBy: c.updatedBy ?? null,
  updatedAt: c.updatedAt ?? null,
  deletedAt: c.deletedAt ?? null,
  reason: c.reason ?? null,
  recordId: c.recordId ?? null,
  version: c.version ?? 0,
});

export const customersSchema: TableSchema = {
  name: "customers",

  create: `
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      email TEXT,
      name TEXT,
      phoneNumber TEXT,
      customerCode TEXT,
      status TEXT DEFAULT 'active' NOT NULL,
      verificationCode TEXT,
      verificationCodeExpiry TEXT,
      emailVerified INTEGER DEFAULT 0 NOT NULL,
      phoneVerfied INTEGER DEFAULT 0 NOT NULL,
      reference TEXT,
      createdAt TEXT,
      outletId TEXT,
      otherEmails TEXT,
      otherNames TEXT,
      otherPhoneNumbers TEXT,
      customerType TEXT DEFAULT 'individual' NOT NULL,
      pricingTier TEXT,
      paymentTermId TEXT,
      organizationName TEXT,
      addedBy TEXT,
      updatedBy TEXT,
      updatedAt TEXT,
      deletedAt TEXT,
      reason TEXT,
      recordId TEXT,
      version INTEGER DEFAULT 0
    );
  `,
  indexes: [
    `CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);`,
    `CREATE INDEX IF NOT EXISTS idx_customers_phoneNumber ON customers(phoneNumber);`,
    `CREATE INDEX IF NOT EXISTS idx_customers_outletId ON customers(outletId);`,
  ],
};
