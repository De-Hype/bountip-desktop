import { DatabaseService } from "../../services/DatabaseService";
import { SYNC_ACTIONS } from "../../types/action.types";
import { getOutlet } from "../outlets";

export const updateBusinessDetails = async (
  db: DatabaseService,
  payload:
    | {
        outletId: string;
        data: any;
      }
    | {
        businessId: string;
        outletId: string;
        business: any;
        location: any;
      },
) => {
  const outletId =
    (payload as any)?.outletId ?? (payload as any)?.data?.outletId ?? "";

  const data = (payload as any)?.data ?? {
    ...(payload as any)?.business,
    ...(payload as any)?.location,
  };

  const outletRow = outletId ? await getOutlet(db, outletId) : null;
  const businessId =
    (payload as any)?.businessId ?? (outletRow as any)?.businessId ?? "";

  const business = data ?? {};
  const location = data ?? {};
  const now = new Date().toISOString();

  // 1. Update Business table
  const businessFields = [];
  const businessParams: any = { businessId, updatedAt: now };

  if (businessId && business?.name !== undefined) {
    businessFields.push("name = @name");
    businessParams.name = business.name;
  }
  if (businessId && business?.address !== undefined) {
    businessFields.push("address = @address");
    businessParams.address = business.address;
  }
  if (businessId && business?.country !== undefined) {
    businessFields.push("country = @country");
    businessParams.country = business.country;
  }
  if (businessId && business?.businessType !== undefined) {
    businessFields.push("businessType = @businessType");
    businessParams.businessType = business.businessType;
  }
  if (businessId && business?.currency !== undefined) {
    businessFields.push("currency = @currency");
    businessParams.currency = business.currency;
  }
  if (businessId && business?.logoUrl !== undefined) {
    businessFields.push("logoUrl = @logoUrl");
    businessParams.logoUrl = business.logoUrl;
  }

  if (businessId && businessFields.length > 0) {
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

  if (location?.name !== undefined) {
    locationFields.push("name = @name");
    locationParams.name = location.name;
  }
  if (location?.address !== undefined) {
    locationFields.push("address = @address");
    locationParams.address = location.address;
  }
  if (location?.phoneNumber !== undefined) {
    locationFields.push("phoneNumber = @phoneNumber");
    locationParams.phoneNumber = location.phoneNumber;
  }
  if (location?.state !== undefined) {
    locationFields.push("state = @state");
    locationParams.state = location.state;
  }
  if (location?.country !== undefined) {
    locationFields.push("country = @country");
    locationParams.country = location.country;
  }
  if (location?.postalCode !== undefined) {
    locationFields.push("postalCode = @postalCode");
    locationParams.postalCode = location.postalCode;
  }
  if (location?.businessType !== undefined) {
    locationFields.push("businessType = @businessType");
    locationParams.businessType = location.businessType;
  }
  if (location?.currency !== undefined) {
    locationFields.push("currency = @currency");
    locationParams.currency = location.currency;
  }
  if (location?.email !== undefined) {
    locationFields.push("email = @email");
    locationParams.email = location.email;
  }
  if (location?.logoUrl !== undefined) {
    locationFields.push("logoUrl = @logoUrl");
    locationParams.logoUrl = location.logoUrl;
  }

  if (outletId && locationFields.length > 0) {
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
