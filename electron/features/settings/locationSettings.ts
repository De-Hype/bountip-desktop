import { DatabaseService } from "../../services/DatabaseService";
import { SYNC_ACTIONS } from "../../types/action.types";
import {
  buildBusinessOutletUpsertParams,
  businessOutletUpsertSql,
} from "../schemas/business_outlet.schema";
import { randomUUID } from "crypto";

export const createOutlet = async (
  db: DatabaseService,
  payload: {
    businessId: string;
    location: {
      name: string;
      address: string;
      phoneNumber: string;
      isMainLocation: boolean;
    };
  },
) => {
  const { businessId, location } = payload;
  const newOutletId = randomUUID();
  const now = new Date().toISOString();

  const newOutlet = {
    id: newOutletId,
    businessId,
    name: location.name,
    address: location.address,
    phoneNumber: location.phoneNumber,
    isMainLocation: location.isMainLocation ? 1 : 0,
    isActive: 1,
    isOnboarded: 0, // Assuming created via settings is onboarded
    isDeleted: 0,
    createdAt: now,
    updatedAt: now,
    // Default values for other fields to match schema expectations or avoid nulls if strict
  };

  const params = buildBusinessOutletUpsertParams(newOutlet);

  // 1. Insert into local DB
  db.run(businessOutletUpsertSql, params);

  // 2. Queue Sync
  db.addToQueue({
    table: "business_outlet",
    action: SYNC_ACTIONS.UPDATE, // or UPDATE since we use Upsert logic, but CREATE is semantically correct for sync
    data: newOutlet,
    id: newOutletId,
  });

  return { success: true, outlet: newOutlet };
};

export const updateOutlet = async (
  db: DatabaseService,
  payload: {
    outletId: string;
    location: {
      name?: string;
      address?: string;
      phoneNumber?: string;
      isMainLocation?: boolean;
    };
  },
) => {
  const { outletId, location } = payload;
  const now = new Date().toISOString();

  // 1. Update local DB
  const fields = [];
  const params: any = { outletId, updatedAt: now };

  if (location.name !== undefined) {
    fields.push("name = @name");
    params.name = location.name;
  }
  if (location.address !== undefined) {
    fields.push("address = @address");
    params.address = location.address;
  }
  if (location.phoneNumber !== undefined) {
    fields.push("phoneNumber = @phoneNumber");
    params.phoneNumber = location.phoneNumber;
  }
  if (location.isMainLocation !== undefined) {
    fields.push("isMainLocation = @isMainLocation");
    params.isMainLocation = location.isMainLocation ? 1 : 0;
  }

  if (fields.length === 0) return { success: true };

  const sql = `
    UPDATE business_outlet
    SET ${fields.join(", ")}, updatedAt = @updatedAt
    WHERE id = @outletId
  `;

  db.run(sql, params);

  // 2. Queue Sync
  const fullOutlet = db.getOutlet(outletId);
  if (fullOutlet) {
    db.addToQueue({
      table: "business_outlet",
      action: SYNC_ACTIONS.UPDATE,
      data: fullOutlet,
      id: outletId,
    });
  }

  return { success: true, outlet: fullOutlet };
};

export const deleteOutlet = async (
  db: DatabaseService,
  payload: {
    outletId: string;
  },
) => {
  const { outletId } = payload;
  const now = new Date().toISOString();

  // Soft delete
  db.run(
    `UPDATE business_outlet SET isDeleted = 1, updatedAt = @updatedAt WHERE id = @outletId`,
    { outletId, updatedAt: now },
  );

  // Queue Sync
  const fullOutlet = db.getOutlet(outletId);
  if (fullOutlet) {
    db.addToQueue({
      table: "business_outlet",
      action: SYNC_ACTIONS.DELETE, // Sync usually handles soft delete as an update to isDeleted flag
      data: fullOutlet,
      id: outletId,
    });
  }

  return { success: true };
};
