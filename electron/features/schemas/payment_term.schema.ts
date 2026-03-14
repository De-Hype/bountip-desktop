import { TableSchema } from "./types";

export const paymentTermSchema: TableSchema = {
  name: "payment_terms",
  create: `
    CREATE TABLE IF NOT EXISTS payment_terms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      paymentType TEXT,
      instantPayment BOOLEAN DEFAULT 0,
      paymentOnDelivery BOOLEAN DEFAULT 0,
      paymentInInstallment TEXT, -- JSON string
      outletId TEXT,
      recordId TEXT,
      version INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      deletedAt DATETIME
    );
  `,
  indexes: ["CREATE INDEX IF NOT EXISTS idx_payment_terms_outletId ON payment_terms(outletId)"],
};
