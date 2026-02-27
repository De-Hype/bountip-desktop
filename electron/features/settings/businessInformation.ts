import { app } from "electron";
import path from "path";
import { DatabaseService } from "../../services/DatabaseService";

export const updateBusinessDetails = async (
  db: DatabaseService,
  payload: {
    outletId: string;
    data: {
      name: string;
      email: string;
      phoneNumber: string;
      country: string;
      state: string;
      address: string;
      postalCode: string;
      businessType: string;
      currency?: string;
      logoUrl?: string;
    };
  },
) => {
  const { outletId, data } = payload;
  console.log(data)
  let isOfflineImage = 0;
  let localLogoPath: string | undefined = undefined;

  if (data.logoUrl && data.logoUrl.startsWith("asset://")) {
    isOfflineImage = 1;
    try {
      // asset://filename -> filename
      // asset://host/filename -> filename
      const urlObj = new URL(data.logoUrl);
      let filename = urlObj.pathname.replace(/^\//, "");
      if (!filename && urlObj.host) {
        filename = urlObj.host;
      }

      // Reconstruct full path
      // We need to know where assets are stored.
      // AssetService uses app.getPath("userData") / "assets"
      const userDataPath = app.getPath("userData");
      localLogoPath = path.join(userDataPath, "assets", filename);
    } catch (e) {
      console.error("Failed to parse asset URL", e);
    }
  }

  // 1. Update local DB
  const now = new Date().toISOString();
  db.run(
    `
    UPDATE business_outlet
    SET
      name = COALESCE(@name, name),
      email = COALESCE(@email, email),
      phoneNumber = COALESCE(@phoneNumber, phoneNumber),
      country = COALESCE(@country, country),
      state = COALESCE(@state, state),
      address = COALESCE(@address, address),
      postalCode = COALESCE(@postalCode, postalCode),
      businessType = COALESCE(@businessType, businessType),
      currency = COALESCE(@currency, currency),

      logoUrl = COALESCE(@logoUrl, logoUrl),
      isOfflineImage = COALESCE(@isOfflineImage, isOfflineImage),
      localLogoPath = COALESCE(@localLogoPath, localLogoPath),
      updatedAt = @updatedAt
    WHERE id = @outletId
  `,
    {
      outletId,
      name: data.name,
      email: data.email,
      phoneNumber: data.phoneNumber,
      country: data.country,
      state: data.state,
      address: data.address,
      postalCode: data.postalCode,
      businessType: data.businessType,
      currency: data.currency,
      logoUrl: data.logoUrl,
      isOfflineImage,
      localLogoPath,
      updatedAt: now,
    },
  );

  // 2. Queue Sync
  const fullOutlet = db.getOutlet(outletId);

  if (fullOutlet) {
    db.addToQueue({
      table: "business_outlet",
      action: "UPDATE",
      data: fullOutlet,
      id: outletId,
    });
  }

  return { success: true };
};
