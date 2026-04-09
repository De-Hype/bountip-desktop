import { TableSchema } from "./types";

export type BusinessRoleUpsertParams = {
  id: string;
  name: string;
  permissions: string;
  createdAt: string | null;
  updatedAt: string | null;
  businessId: string;
  version: number;
};

export const businessRoleUpsertSql = `
  INSERT OR REPLACE INTO business_role (
    id,
    name,
    permissions,
    createdAt,
    updatedAt,
    businessId,
    version
  ) VALUES (
    @id,
    @name,
    @permissions,
    @createdAt,
    @updatedAt,
    @businessId,
    @version
  )
`;

export const buildBusinessRoleUpsertParams = (
  r: any,
): BusinessRoleUpsertParams => ({
  id: r.id,
  name: r.name,
  permissions:
    typeof r.permissions === "object"
      ? JSON.stringify(r.permissions)
      : r.permissions,
  createdAt: r.createdAt || null,
  updatedAt: r.updatedAt || null,
  businessId: r.businessId,
  version: Number(r.version || 0),
});

export const businessRoleSchema: TableSchema = {
  name: "business_role",

  create: `
    CREATE TABLE IF NOT EXISTS business_role (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      permissions TEXT NOT NULL,
      createdAt TEXT,
      updatedAt TEXT,
      businessId TEXT NOT NULL,
      version INTEGER DEFAULT 0 NOT NULL
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
