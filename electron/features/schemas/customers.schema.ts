import { TableSchema } from "./types";

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
      deletedAt TEXT
    );
  `,
};

