import { TableSchema } from "./types";

export const cartItemModifierSchema: TableSchema = {
  name: "cart_item_modifier",

  create: `
    CREATE TABLE IF NOT EXISTS cart_item_modifier (
      id TEXT PRIMARY KEY,
      unitAmount REAL NOT NULL,
      modifierOptionId TEXT NOT NULL,
      modifierOptionName TEXT NOT NULL,
      quantity INTEGER DEFAULT 1 NOT NULL,
      cartItemId TEXT,
      modifierId TEXT,
      priceTierDiscount REAL DEFAULT 0 NOT NULL,
      priceTierMarkup REAL DEFAULT 0 NOT NULL
    );
  `,
};

