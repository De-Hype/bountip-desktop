import { DatabaseService } from "../../services/DatabaseService";

export const getBusinessRoles = async (
  db: DatabaseService,
  outletId?: string,
) => {
  if (outletId) {
    // If outletId is provided, we only show roles associated with that business
    // We get the businessId from the outlet first
    const outlets = db.query(
      "SELECT businessId FROM business_outlet WHERE id = ?",
      [outletId],
    ) as { businessId: string }[];
    if (outlets.length > 0) {
      return db.query("SELECT * FROM business_role WHERE businessId = ?", [
        outlets[0].businessId,
      ]) as any[];
    }
  }
  return db.query("SELECT * FROM business_role") as any[];
};

export const getBusinessUsersWithRoles = async (
  db: DatabaseService,
  outletId?: string,
) => {
  // We join users with their roles through the mapping table OR the direct roleId on business_user
  let sql = `
    SELECT 
      u.*,
      br.name as roleName,
      COALESCE(burbr.businessRoleId, bu.roleId) as roleId,
      COALESCE(bu.createdBy, 'System') as initiator,
      bu.outletId
    FROM users u
    JOIN business_user bu ON u.id = bu.userId
    LEFT JOIN business_user_roles_business_role burbr ON bu.id = burbr.businessUserId
    LEFT JOIN business_role br ON br.id = COALESCE(burbr.businessRoleId, bu.roleId)
  `;

  const params: any[] = [];
  if (outletId) {
    sql += " WHERE bu.outletId = ?";
    params.push(outletId);
  }

  return db.query(sql, params) as any[];
};
