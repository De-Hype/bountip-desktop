import { DatabaseService } from "../../services/DatabaseService";
import { SYNC_ACTIONS } from "../../types/action.types";
import { getOutlet } from "../outlets";

export const updateBusinessDetails = async (
  db: DatabaseService,
  payload: {
    businessId: string;
    outletId: string;
    business: any;
    location: any;
  },
) => {
  const { businessId, outletId, business, location } = payload;
  const now = new Date().toISOString();

  // 1. Update Business table
  const businessFields = [];
  const businessParams: any = { businessId, updatedAt: now };

  if (business.name !== undefined) {
    businessFields.push("name = @name");
    businessParams.name = business.name;
  }
  if (business.email !== undefined) {
    businessFields.push("email = @email");
    businessParams.email = business.email;
  }
  if (business.phoneNumber !== undefined) {
    businessFields.push("phoneNumber = @phoneNumber");
    businessParams.phoneNumber = business.phoneNumber;
  }
  if (business.address !== undefined) {
    businessFields.push("address = @address");
    businessParams.address = business.address;
  }
  if (business.description !== undefined) {
    businessFields.push("description = @description");
    businessParams.description = business.description;
  }
  if (business.website !== undefined) {
    businessFields.push("website = @website");
    businessParams.website = business.website;
  }

  if (businessFields.length > 0) {
    const businessSql = `
      UPDATE business
      SET ${businessFields.join(", ")}, updatedAt = @updatedAt
      WHERE id = @businessId
    `;
    db.run(businessSql, businessParams);

    // Sync business
    const fullBusiness = db.get("SELECT * FROM business WHERE id = ?", [
      businessId,
    ]) as any;
    if (fullBusiness) {
      db.addToQueue({
        table: "business",
        action: SYNC_ACTIONS.UPDATE,
        data: fullBusiness,
        id: businessId,
      });
    }
  }

  // 2. Update Business Outlet table
  const locationFields = [];
  const locationParams: any = { outletId, updatedAt: now };

  if (location.name !== undefined) {
    locationFields.push("name = @name");
    locationParams.name = location.name;
  }
  if (location.address !== undefined) {
    locationFields.push("address = @address");
    locationParams.address = location.address;
  }
  if (location.phoneNumber !== undefined) {
    locationFields.push("phoneNumber = @phoneNumber");
    locationParams.phoneNumber = location.phoneNumber;
  }

  if (locationFields.length > 0) {
    const locationSql = `
      UPDATE business_outlet
      SET ${locationFields.join(", ")}, updatedAt = @updatedAt
      WHERE id = @outletId
    `;
    db.run(locationSql, locationParams);

    // Sync outlet
    const fullOutlet = await getOutlet(db, outletId);
    if (fullOutlet) {
      db.addToQueue({
        table: "business_outlet",
        action: SYNC_ACTIONS.UPDATE,
        data: fullOutlet,
        id: outletId,
      });
    }
  }

  return { success: true };
};
