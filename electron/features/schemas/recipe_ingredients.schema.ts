import { TableSchema } from "./types";

export const recipeIngredientUpsertSql = `
  INSERT INTO recipe_ingredients (
    id,
    itemName,
    unitOfMeasure,
    quantity,
    proposedFoodCost,
    prepWaste,
    critical,
    isDeleted,
    createdAt,
    updatedAt,
    recipeId,
    itemId
  ) VALUES (
    @id,
    @itemName,
    @unitOfMeasure,
    @quantity,
    @proposedFoodCost,
    @prepWaste,
    @critical,
    @isDeleted,
    @createdAt,
    @updatedAt,
    @recipeId,
    @itemId
  )
  ON CONFLICT(id) DO UPDATE SET
    itemName = excluded.itemName,
    unitOfMeasure = excluded.unitOfMeasure,
    quantity = excluded.quantity,
    proposedFoodCost = excluded.proposedFoodCost,
    prepWaste = excluded.prepWaste,
    critical = excluded.critical,
    isDeleted = excluded.isDeleted,
    updatedAt = excluded.updatedAt,
    recipeId = excluded.recipeId,
    itemId = excluded.itemId
`;

export const buildRecipeIngredientUpsertParams = (ri: any) => ({
  id: ri.id,
  itemName: ri.itemName,
  unitOfMeasure: ri.unitOfMeasure,
  quantity: Number(ri.quantity || 0),
  proposedFoodCost: Number(ri.proposedFoodCost || 0),
  prepWaste: Number(ri.prepWaste || 0),
  critical: ri.critical ? 1 : 0,
  isDeleted: ri.isDeleted ? 1 : 0,
  createdAt: ri.createdAt || null,
  updatedAt: ri.updatedAt || null,
  recipeId: ri.recipeId || null,
  itemId: ri.itemId || null,
});

export const recipeIngredientsSchema: TableSchema = {
  name: "recipe_ingredients",

  create: `
    CREATE TABLE IF NOT EXISTS recipe_ingredients (
      id TEXT PRIMARY KEY,
      itemName TEXT NOT NULL,
      unitOfMeasure TEXT NOT NULL,
      quantity REAL NOT NULL,
      proposedFoodCost REAL DEFAULT 0 NOT NULL,
      prepWaste REAL DEFAULT 0 NOT NULL,
      critical INTEGER DEFAULT 0 NOT NULL,
      isDeleted INTEGER DEFAULT 0 NOT NULL,
      createdAt TEXT,
      updatedAt TEXT,
      recipeId TEXT,
      itemId TEXT
    );
  `,
};
