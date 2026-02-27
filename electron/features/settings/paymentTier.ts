import { DatabaseService } from "../../services/DatabaseService";
import { v4 as uuidv4 } from "uuid";

// Helper to get current tiers
const getTiers = (db: DatabaseService, outletId: string): any[] => {
  const outlet = db.getOutlet(outletId);
  if (!outlet || !outlet.priceTier) return [];
  try {
    return typeof outlet.priceTier === "string"
      ? JSON.parse(outlet.priceTier)
      : outlet.priceTier;
  } catch {
    return [];
  }
};

// Helper to save tiers and queue sync
const saveTiers = (db: DatabaseService, outletId: string, priceTier: any[]) => {
  const now = new Date().toISOString();
  const priceTierString = JSON.stringify(priceTier);

  db.run(
    `
    UPDATE business_outlet
    SET
      priceTier = @priceTier,
      updatedAt = @updatedAt
    WHERE id = @outletId
  `,
    {
      outletId,
      priceTier: priceTierString,
      updatedAt: now,
    },
  );

  const fullOutlet = db.getOutlet(outletId);
  if (fullOutlet) {
    db.addToQueue({
      table: "business_outlet",
      action: "UPDATE",
      data: fullOutlet,
      id: outletId,
    });
  }
};

export const updatePaymentTier = async (
  db: DatabaseService,
  payload: {
    outletId: string;
    priceTier: any[];
  },
) => {
  const { outletId, priceTier } = payload;
  saveTiers(db, outletId, priceTier);
  return { success: true };
};

export const bulkAddPaymentTiers = async (
  db: DatabaseService,
  payload: {
    outletId: string;
    tiers: any[];
  },
) => {
  const { outletId, tiers } = payload;
  const currentTiers = getTiers(db, outletId);

  const newTiers = tiers.map((tier) => ({
    ...tier,
    id:
      typeof tier.id === "number" && tier.id < 0
        ? uuidv4()
        : tier.id || uuidv4(),
    isNew: false,
  }));

  currentTiers.push(...newTiers);
  saveTiers(db, outletId, currentTiers);

  return { success: true, tiers: currentTiers };
};

export const addPaymentTier = async (
  db: DatabaseService,
  payload: {
    outletId: string;
    tier: any;
  },
) => {
  const { outletId, tier } = payload;
  const currentTiers = getTiers(db, outletId);

  // Assign a new ID if not present or if it's a temp ID (negative number)
  const newTier = {
    ...tier,
    id:
      typeof tier.id === "number" && tier.id < 0
        ? uuidv4()
        : tier.id || uuidv4(),
    isNew: false, // Ensure isNew is false when saving to DB
  };

  currentTiers.push(newTier);
  saveTiers(db, outletId, currentTiers);

  return { success: true, tier: newTier, tiers: currentTiers };
};

export const deletePaymentTier = async (
  db: DatabaseService,
  payload: {
    outletId: string;
    tierId: string | number;
  },
) => {
  const { outletId, tierId } = payload;
  let currentTiers = getTiers(db, outletId);

  currentTiers = currentTiers.filter((t: any) => t.id !== tierId);
  saveTiers(db, outletId, currentTiers);

  return { success: true, tiers: currentTiers };
};

export const editPaymentTier = async (
  db: DatabaseService,
  payload: {
    outletId: string;
    tier: any;
  },
) => {
  const { outletId, tier } = payload;
  const currentTiers = getTiers(db, outletId);

  const index = currentTiers.findIndex((t: any) => t.id === tier.id);
  if (index !== -1) {
    currentTiers[index] = { ...currentTiers[index], ...tier, isNew: false };
    saveTiers(db, outletId, currentTiers);
    return { success: true, tier: currentTiers[index], tiers: currentTiers };
  }

  return { success: false, message: "Tier not found" };
};
