import { TableSchema } from "./types";

export type BusinessUserUpsertParams = {
  id: string;
  accessType: string;
  permissions: string | null;
  status: string;
  invitedBy: string | null;
  invitationToken: string | null;
  invitationExpiry: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  lastSyncedAt: string | null;
  userId: string | null;
  outletId: string;
  businessId: string;
  roleId: string | null;
  createdBy: string | null;
  version: number;
};

export const businessUserUpsertSql = `
  INSERT INTO business_user (
    id,
    accessType,
    permissions,
    status,
    invitedBy,
    invitationToken,
    invitationExpiry,
    createdAt,
    updatedAt,
    lastSyncedAt,
    userId,
    outletId,
    businessId,
    roleId,
    createdBy,
    version
  ) VALUES (
    @id,
    @accessType,
    @permissions,
    @status,
    @invitedBy,
    @invitationToken,
    @invitationExpiry,
    @createdAt,
    @updatedAt,
    @lastSyncedAt,
    @userId,
    @outletId,
    @businessId,
    @roleId,
    @createdBy,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    accessType = excluded.accessType,
    permissions = excluded.permissions,
    status = excluded.status,
    invitedBy = excluded.invitedBy,
    invitationToken = excluded.invitationToken,
    invitationExpiry = excluded.invitationExpiry,
    createdAt = excluded.createdAt,
    updatedAt = excluded.updatedAt,
    lastSyncedAt = excluded.lastSyncedAt,
    userId = excluded.userId,
    outletId = excluded.outletId,
    businessId = excluded.businessId,
    roleId = excluded.roleId,
    createdBy = excluded.createdBy,
    version = excluded.version
  WHERE excluded.version >= business_user.version
     OR excluded.updatedAt >= business_user.updatedAt
     OR business_user.updatedAt IS NULL
`;

export const buildBusinessUserUpsertParams = (
  bu: any,
): BusinessUserUpsertParams => ({
  id: bu.id,
  accessType: bu.accessType || "super_admin",
  permissions: bu.permissions ? JSON.stringify(bu.permissions) : null,
  status: bu.status || "active",
  invitedBy: bu.invitedBy || null,
  invitationToken: bu.invitationToken || null,
  invitationExpiry: bu.invitationExpiry || null,
  createdAt: bu.createdAt || null,
  updatedAt: bu.updatedAt || null,
  lastSyncedAt: bu.lastSyncedAt || null,
  userId: bu.userId || null,
  outletId: bu.outletId,
  businessId: bu.businessId,
  roleId: bu.roleId || null,
  createdBy: bu.createdBy || null,
  version: Number(bu.version || 0),
});

export const businessUserSchema: TableSchema = {
  name: "business_user",

  create: `
    CREATE TABLE IF NOT EXISTS business_user (
      id TEXT PRIMARY KEY,
      accessType TEXT DEFAULT 'super_admin' NOT NULL,
      permissions TEXT,
      status TEXT DEFAULT 'active' NOT NULL,
      invitedBy TEXT,
      invitationToken TEXT,
      invitationExpiry TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      lastSyncedAt TEXT,
      userId TEXT,
      outletId TEXT NOT NULL,
      businessId TEXT NOT NULL,
      roleId TEXT,
      createdBy TEXT,
      version INTEGER DEFAULT 0 NOT NULL
    );
  `,
};
