import { TableSchema } from "./types";

export const recipeUpsertSql = `
  INSERT INTO recipes (
    id,
    name,
    productReference,
    productName,
    outletId,
    mix,
    totalPortions,
    totalMixCost,
    preparationTime,
    difficulty_level,
    instructions,
    imageUrl,
    createdAt,
    updatedAt,
    createdBy,
    isDeleted,
    inventoryId,
    version
  ) VALUES (
    @id,
    @name,
    @productReference,
    @productName,
    @outletId,
    @mix,
    @totalPortions,
    @totalMixCost,
    @preparationTime,
    @difficulty_level,
    @instructions,
    @imageUrl,
    @createdAt,
    @updatedAt,
    @createdBy,
    @isDeleted,
    @inventoryId,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    productReference = excluded.productReference,
    productName = excluded.productName,
    outletId = excluded.outletId,
    mix = excluded.mix,
    totalPortions = excluded.totalPortions,
    totalMixCost = excluded.totalMixCost,
    preparationTime = excluded.preparationTime,
    difficulty_level = excluded.difficulty_level,
    instructions = excluded.instructions,
    imageUrl = excluded.imageUrl,
    updatedAt = excluded.updatedAt,
    createdBy = excluded.createdBy,
    isDeleted = excluded.isDeleted,
    inventoryId = excluded.inventoryId,
    version = excluded.version
`;

export const buildRecipeUpsertParams = (r: any) => ({
  id: r.id,
  name: r.name,
  productReference: r.productReference || r.productId || r.product_id,
  productName: r.productName || "",
  outletId: r.outletId,
  mix: r.mix || "standard",
  totalPortions: Number(r.totalPortions || 0),
  totalMixCost: Number(r.totalMixCost || 0),
  preparationTime: Number(r.preparationTime || 0),
  difficulty_level: r.difficulty_level || "Medium",
  instructions: r.instructions || "",
  imageUrl: r.imageUrl || null,
  createdAt: r.createdAt || null,
  updatedAt: r.updatedAt || null,
  createdBy: r.createdBy || "",
  isDeleted: r.isDeleted ? 1 : 0,
  inventoryId: r.inventoryId || null,
  version: Number(r.version || 0),
});

export const recipesSchema: TableSchema = {
  name: "recipes",

  create: `
    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      productReference TEXT NOT NULL,
      productName TEXT NOT NULL,
      outletId TEXT NOT NULL,
      mix TEXT DEFAULT 'standard' NOT NULL,
      totalPortions REAL NOT NULL,
      totalMixCost REAL DEFAULT 0 NOT NULL,
      preparationTime REAL DEFAULT 0 NOT NULL,
      difficulty_level TEXT DEFAULT 'Medium' NOT NULL,
      instructions TEXT NOT NULL,
      imageUrl TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      createdBy TEXT NOT NULL,
      isDeleted INTEGER DEFAULT 0 NOT NULL,
      inventoryId TEXT,
      version INTEGER DEFAULT 0 NOT NULL
    );
  `,
};
