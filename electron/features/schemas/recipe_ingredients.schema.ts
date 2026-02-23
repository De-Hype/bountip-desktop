import { TableSchema } from "./types";

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

