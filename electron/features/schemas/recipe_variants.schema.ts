import { TableSchema } from "./types";

export const recipeVariantUpsertSql = `
  INSERT INTO recipe_variants (
    id,
    modifierName,
    quantity,
    createdAt,
    updatedAt,
    isDeleted,
    recipeId,
    recordId,
    version
  ) VALUES (
    @id,
    @modifierName,
    @quantity,
    @createdAt,
    @updatedAt,
    @isDeleted,
    @recipeId,
    @recordId,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    modifierName = excluded.modifierName,
    quantity = excluded.quantity,
    updatedAt = excluded.updatedAt,
    isDeleted = excluded.isDeleted,
    recipeId = excluded.recipeId,
    recordId = excluded.recordId,
    version = excluded.version
`;

export const buildRecipeVariantUpsertParams = (rv: any) => ({
  id: rv.id,
  modifierName: rv.modifierName || "",
  quantity: Number(rv.quantity || 0),
  createdAt: rv.createdAt || null,
  updatedAt: rv.updatedAt || null,
  isDeleted: rv.isDeleted ? 1 : 0,
  recipeId: rv.recipeId || null,
  recordId: rv.recordId || null,
  version: Number(rv.version || 0),
});

export const recipeVariantsSchema: TableSchema = {
  name: "recipe_variants",
  create: `
    CREATE TABLE IF NOT EXISTS recipe_variants (
      id TEXT PRIMARY KEY,
      modifierName TEXT NOT NULL,
      quantity REAL DEFAULT 0 NOT NULL,
      createdAt TEXT,
      updatedAt TEXT,
      isDeleted INTEGER DEFAULT 0 NOT NULL,
      recipeId TEXT NOT NULL,
      recordId TEXT,
      version INTEGER DEFAULT 0
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_recipe_variants_recipeId ON recipe_variants(recipeId);",
    "CREATE INDEX IF NOT EXISTS idx_recipe_variants_updatedAt ON recipe_variants(updatedAt);",
  ],
};
