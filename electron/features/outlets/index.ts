import { DatabaseService } from "../../services/DatabaseService";
import { SYNC_ACTIONS } from "../../types/action.types";

export const getOutlet = async (db: DatabaseService, id: string) => {
  return db.get("SELECT * FROM business_outlet WHERE id = ?", [id]) as any;
};

export const getOutlets = async (db: DatabaseService) => {
  return db.query("SELECT * FROM business_outlet") as any[];
};

export const saveOutletOnboarding = async (
  db: DatabaseService,
  payload: {
    outletId: string;
    data: {
      country: string;
      address: string;
      businessType: string;
      currency: string;
      revenueRange: string;
      logoUrl: string;
      isOfflineImage?: number;
      localLogoPath?: string;
    };
  },
) => {
  const now = new Date().toISOString();
  db.run(
    `
      UPDATE business_outlet
      SET
        country = COALESCE(@country, country),
        address = COALESCE(@address, address),
        businessType = COALESCE(@businessType, businessType),
        currency = COALESCE(@currency, currency),
        revenueRange = COALESCE(@revenueRange, revenueRange),
        logoUrl = COALESCE(@logoUrl, logoUrl),
        isOfflineImage = COALESCE(@isOfflineImage, isOfflineImage),
        localLogoPath = COALESCE(@localLogoPath, localLogoPath),
        isOnboarded = 1,
        updatedAt = @updatedAt
      WHERE id = @outletId
    `,
    {
      outletId: payload.outletId,
      country: payload.data.country,
      address: payload.data.address,
      businessType: payload.data.businessType,
      currency: payload.data.currency,
      revenueRange: payload.data.revenueRange,
      logoUrl: payload.data.logoUrl,
      isOfflineImage: payload.data.isOfflineImage,
      localLogoPath: payload.data.localLogoPath,
      updatedAt: now,
    },
  );

  // 2. Queue Sync
  const fullOutlet = await getOutlet(db, payload.outletId);
  if (fullOutlet) {
    console.log(
      `[OutletFeature] Queuing sync for onboarded outlet: ${payload.outletId}`,
    );
    db.addToQueue({
      table: "business_outlet",
      action: SYNC_ACTIONS.UPDATE,
      data: fullOutlet,
      id: payload.outletId,
    });
  }
};
