import { DatabaseService } from "../../services/DatabaseService";
import { v4 as uuidv4 } from "uuid";
import { SYNC_ACTIONS } from "../../types/action.types";
import {
  usersUpsertSql,
  buildUsersUpsertParams,
} from "../schemas/users.schema";
import {
  businessUserUpsertSql,
  buildBusinessUserUpsertParams,
} from "../schemas/business_user.schema";
import {
  businessUserRolesBusinessRoleUpsertSql,
  buildBusinessUserRolesBusinessRoleUpsertParams,
} from "../schemas/business_user_roles_business_role.schema";
import {
  businessRoleUpsertSql,
  buildBusinessRoleUpsertParams,
} from "../schemas/business-role.schema";

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

export const getUserById = async (db: DatabaseService, userId: string) => {
  const rows = db.query("SELECT * FROM users WHERE id = ? LIMIT 1", [
    userId,
  ]) as any[];
  return rows[0] || null;
};

export const upsertBusinessUser = async (
  db: DatabaseService,
  payload: {
    id?: string;
    userId?: string;
    outletId: string;
    firstName: string;
    lastName: string;
    email: string;
    roleName: string;
  },
) => {
  const userId = payload.userId || payload.id || uuidv4();

  const now = new Date().toISOString();

  const tx = db.transaction(() => {
    const outletRows = db.query(
      "SELECT businessId FROM business_outlet WHERE id = ? LIMIT 1",
      [payload.outletId],
    ) as { businessId: string }[];
    const businessId = outletRows[0]?.businessId;
    if (!businessId) throw new Error("Invalid outletId");

    const existingUserRows = db.query("SELECT * FROM users WHERE id = ?", [
      userId,
    ]) as any[];
    const existingUser = existingUserRows[0] || null;

    const fullName = `${payload.firstName} ${payload.lastName}`.trim();

    const userRow = {
      ...(existingUser || {}),
      id: userId,
      email: payload.email,
      fullName,
      updatedAt: now,
      createdAt: existingUser?.createdAt || now,
      status: existingUser?.status || "active",
      version: existingUser?.version ?? 0,
    };

    db.run(usersUpsertSql, db.sanitize(buildUsersUpsertParams(userRow)));
    db.addToQueue({
      table: "user",
      action: existingUser ? SYNC_ACTIONS.UPDATE : SYNC_ACTIONS.CREATE,
      data: userRow,
      id: userId,
    });

    const roleName = payload.roleName;
    let roleId: string | null = null;
    if (roleName && roleName !== "Unassigned") {
      const roleRows = businessId
        ? (db.query(
            "SELECT id FROM business_role WHERE name = ? AND businessId = ? LIMIT 1",
            [roleName, businessId],
          ) as { id: string }[])
        : (db.query("SELECT id FROM business_role WHERE name = ? LIMIT 1", [
            roleName,
          ]) as { id: string }[]);
      roleId = roleRows[0]?.id || null;
    }

    const existingBusinessUserRows = db.query(
      "SELECT * FROM business_user WHERE userId = ? AND outletId = ? LIMIT 1",
      [userId, payload.outletId],
    ) as any[];
    const existingBusinessUser = existingBusinessUserRows[0] || null;

    const businessUserId = existingBusinessUser?.id || uuidv4();
    const businessUserRow = {
      ...(existingBusinessUser || {}),
      id: businessUserId,
      userId,
      outletId: payload.outletId,
      businessId: existingBusinessUser?.businessId || businessId,
      roleId,
      updatedAt: now,
      createdAt: existingBusinessUser?.createdAt || now,
      status: existingBusinessUser?.status || "active",
      accessType: existingBusinessUser?.accessType || "super_admin",
      version: existingBusinessUser?.version ?? 0,
    };

    db.run(
      businessUserUpsertSql,
      db.sanitize(buildBusinessUserUpsertParams(businessUserRow)),
    );
    db.addToQueue({
      table: "business_user",
      action: existingBusinessUser ? SYNC_ACTIONS.UPDATE : SYNC_ACTIONS.CREATE,
      data: businessUserRow,
      id: businessUserId,
    });

    const existingMappings = db.query(
      "SELECT * FROM business_user_roles_business_role WHERE businessUserId = ?",
      [businessUserId],
    ) as any[];

    if (existingMappings.length > 0) {
      db.run(
        "DELETE FROM business_user_roles_business_role WHERE businessUserId = ?",
        [businessUserId],
      );

      // for (const m of existingMappings) {
      //   db.addToQueue({
      //     table: "business_user_roles_business_role",
      //     action: SYNC_ACTIONS.DELETE,
      //     data: m,
      //     id: `${m.businessUserId}:${m.businessRoleId}`,
      //   });
      // }
    }

    if (roleId) {
      const previous = existingMappings.find(
        (m) => m.businessRoleId === roleId,
      );
      const mappingRow = {
        businessUserId,
        businessRoleId: roleId,
        version: Number(previous?.version ?? 0) + 1,
      };

      db.run(
        businessUserRolesBusinessRoleUpsertSql,
        db.sanitize(buildBusinessUserRolesBusinessRoleUpsertParams(mappingRow)),
      );

      // db.addToQueue({
      //   table: "business_user_roles_business_role",
      //   action: previous ? SYNC_ACTIONS.UPDATE : SYNC_ACTIONS.CREATE,
      //   data: mappingRow,
      //   id: `${businessUserId}:${roleId}`,
      // });
    }

    return { userId, businessUserId };
  });

  return tx();
};

export const setUserStatus = async (
  db: DatabaseService,
  payload: { userId: string; status: string },
) => {
  const now = new Date().toISOString();

  const tx = db.transaction(() => {
    db.run("UPDATE users SET status = ?, updatedAt = ? WHERE id = ?", [
      payload.status,
      now,
      payload.userId,
    ]);

    const rows = db.query("SELECT * FROM users WHERE id = ? LIMIT 1", [
      payload.userId,
    ]) as any[];
    const updatedUser = rows[0] || null;
    if (!updatedUser) throw new Error("User not found");

    db.addToQueue({
      table: "user",
      action: SYNC_ACTIONS.UPDATE,
      data: updatedUser,
      id: payload.userId,
    });

    return { userId: payload.userId };
  });

  return tx();
};

export const upsertBusinessRole = async (
  db: DatabaseService,
  payload: {
    id?: string;
    outletId: string;
    name: string;
    description?: string;
    permissions?: any;
  },
) => {
  const now = new Date().toISOString();

  const tx = db.transaction(() => {
    const outletRows = db.query(
      "SELECT businessId FROM business_outlet WHERE id = ? LIMIT 1",
      [payload.outletId],
    ) as { businessId: string }[];
    const businessId = outletRows[0]?.businessId;
    if (!businessId) throw new Error("Invalid outletId");

    const existingById = payload.id
      ? (
          db.query("SELECT * FROM business_role WHERE id = ? LIMIT 1", [
            payload.id,
          ]) as any[]
        )[0] || null
      : null;

    const existingByName = !existingById
      ? (
          db.query(
            "SELECT * FROM business_role WHERE name = ? AND businessId = ? LIMIT 1",
            [payload.name, businessId],
          ) as any[]
        )[0] || null
      : null;

    const existingRole = existingById || existingByName;
    const id = existingRole?.id || payload.id || uuidv4();

    const roleRow = {
      ...(existingRole || {}),
      id,
      name: payload.name,
      permissions: payload.permissions ?? {},
      createdAt: existingRole?.createdAt || now,
      updatedAt: now,
      businessId,
      version: existingRole?.version ?? 0,
    };

    db.run(
      businessRoleUpsertSql,
      db.sanitize(buildBusinessRoleUpsertParams(roleRow)),
    );
    db.addToQueue({
      table: "business_role",
      action: existingRole ? SYNC_ACTIONS.UPDATE : SYNC_ACTIONS.CREATE,
      data: roleRow,
      id,
    });

    return { id };
  });

  return tx();
};
