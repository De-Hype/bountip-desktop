import { TableSchema } from "./types";

export const businessUserRolesBusinessRoleSchema: TableSchema = {
  name: "business_user_roles_business_role",

  create: `
    CREATE TABLE IF NOT EXISTS business_user_roles_business_role (
      businessUserId TEXT NOT NULL,
      businessRoleId TEXT NOT NULL,
      PRIMARY KEY (businessUserId, businessRoleId)
    );
  `,
};

