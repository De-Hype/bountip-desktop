import { DatabaseService } from "../../services/DatabaseService";
import { v4 as uuidv4 } from "uuid";
import { SYNC_ACTIONS } from "../../types/action.types";
import { getOutlet } from "../outlets";

// Helper to get current tiers
const getTiers = async (db: DatabaseService, outletId: string): Promise<any[]> => {
  const outlet = await getOutlet(db, outletId);
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
const saveTiers = async (db: DatabaseService, outletId: string, priceTier: any[]) => {
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

  const fullOutlet = await getOutlet(db, outletId);
  if (fullOutlet) {
    db.addToQueue({
      table: "business_outlet",
      action: SYNC_ACTIONS.UPDATE,
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
  await saveTiers(db, outletId, priceTier);
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
  const currentTiers = await getTiers(db, outletId);

  const newTiers = tiers.map((tier) => ({
    ...tier,
    id:
      typeof tier.id === "number" && tier.id < 0
        ? uuidv4()
        : tier.id || uuidv4(),
    isNew: false,
  }));

  currentTiers.push(...newTiers);
  await saveTiers(db, outletId, currentTiers);

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
  const currentTiers = await getTiers(db, outletId);

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
  await saveTiers(db, outletId, currentTiers);

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
  let currentTiers = await getTiers(db, outletId);

  currentTiers = currentTiers.filter((t: any) => t.id !== tierId);
  await saveTiers(db, outletId, currentTiers);

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
  const currentTiers = await getTiers(db, outletId);

  const index = currentTiers.findIndex((t: any) => t.id === tier.id);
  if (index !== -1) {
    currentTiers[index] = { ...currentTiers[index], ...tier, isNew: false };
    await saveTiers(db, outletId, currentTiers);
    return { success: true, tier: currentTiers[index], tiers: currentTiers };
  }

  return { success: false, message: "Tier not found" };
};
