import { TableSchema } from "./types";

export const businessRoleSchema: TableSchema = {
  name: "business_role",

  create: `
    CREATE TABLE IF NOT EXISTS business_role (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      permissions TEXT NOT NULL,
      createdAt TEXT,
      updatedAt TEXT,
      businessId TEXT NOT NULL
    );
  `,

  indexes: [
    // Speeds up queries like: get roles for a business
    `CREATE INDEX IF NOT EXISTS idx_business_role_businessId 
     ON business_role(businessId);`,

    // Optional but useful if you search roles by name inside a business
    `CREATE INDEX IF NOT EXISTS idx_business_role_name 
     ON business_role(name);`,
  ],
};
