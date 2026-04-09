import { TableSchema } from "./types";

export type BusinessUserRolesBusinessRoleUpsertParams = {
  businessUserId: string;
  businessRoleId: string;
  version: number;
};

export const businessUserRolesBusinessRoleUpsertSql = `
  INSERT OR REPLACE INTO business_user_roles_business_role (
    businessUserId,
    businessRoleId,
    version
  ) VALUES (
    @businessUserId,
    @businessRoleId,
    @version
  )
`;

export const buildBusinessUserRolesBusinessRoleUpsertParams = (
  r: any,
): BusinessUserRolesBusinessRoleUpsertParams => ({
  businessUserId: r.businessUserId,
  businessRoleId: r.businessRoleId,
  version: Number(r.version || 0),
});

export const businessUserRolesBusinessRoleSchema: TableSchema = {
  name: "business_user_roles_business_role",

  create: `
    CREATE TABLE IF NOT EXISTS business_user_roles_business_role (
      businessUserId TEXT NOT NULL,
      businessRoleId TEXT NOT NULL,
      version INTEGER DEFAULT 0 NOT NULL,
      PRIMARY KEY (businessUserId, businessRoleId)
    );
  `,
};
