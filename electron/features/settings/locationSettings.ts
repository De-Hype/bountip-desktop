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
  const business = db.get(
    "SELECT currency, country, businessType FROM business WHERE id = ? LIMIT 1",
    [businessId],
  ) as any;

  const newOutlet = {
    id: newOutletId,
    businessId,
    name: location.name,
    address: location.address,
    phoneNumber: location.phoneNumber,
    isMainLocation: location.isMainLocation ? 1 : 0,
    isActive: 1,
    isOnboarded: 0,
    isDeleted: 0,
    createdAt: now,
    updatedAt: now,

    // ✅ Added missing fields
    recordId: null,
    version: 0,
    description: null,
    state: null,
    email: null,
    postalCode: null,
    whatsappNumber: null,
    currency: business?.currency ?? null,
    revenueRange: null,
    country: business?.country ?? null,
    storeCode: null,
    localInventoryRef: null,
    centralInventoryRef: null,
    outletRef: `OUT-${randomUUID().replaceAll("-", "").slice(0, 15).toUpperCase()}`,
    businessType: business?.businessType ?? null,
    whatsappChannel: true,
    emailChannel: true,
    operatingHours: null,
    logoUrl: null,
    taxSettings: null,
    serviceCharges: null,
    paymentMethods: null,
    bankDetails: null,
    priceTier: null,
    receiptSettings: null,
    labelSettings: null,
    invoiceSettings: null,
    generalSettings: null,
    lastSyncedAt: null,
  };
  // const newOutlet = {
  //   id: newOutletId,
  //   businessId,
  //   name: location.name,
  //   address: location.address,
  //   phoneNumber: location.phoneNumber,
  //   isMainLocation: location.isMainLocation ? 1 : 0,
  //   isActive: 1,
  //   isOnboarded: 0, // Assuming created via settings is onboarded
  //   isDeleted: 0,
  //   createdAt: now,
  //   updatedAt: now,
  // };

  const params = buildBusinessOutletUpsertParams(newOutlet);

  // 1. Insert into local DB
  db.run(businessOutletUpsertSql, params);

  // 2. Queue Sync
  db.addToQueue({
    table: "business_outlet",
    action: SYNC_ACTIONS.CREATE,
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
  const fullOutlet = db.get("SELECT * FROM business_outlet WHERE id = ?", [
    outletId,
  ]) as any;
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
  const fullOutlet = db.get("SELECT * FROM business_outlet WHERE id = ?", [
    outletId,
  ]) as any;
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
