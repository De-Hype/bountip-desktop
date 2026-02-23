import { TableSchema } from "./types";
import { userSchema } from "./user.schema";
import { productSchema } from "./product.schema";
import { businessOutletSchema } from "./business_outlet.schema";
import { businessSchema } from "./business.schema";
import { businessRoleSchema } from "./business-role.schema";
import { businessUserSchema } from "./business_user.schema";
import { businessUserRolesBusinessRoleSchema } from "./business_user_roles_business_role.schema";
import { customersSchema } from "./customers.schema";
import { customerAddressSchema } from "./customer_address.schema";
import { cartSchema } from "./cart.schema";
import { cartItemSchema } from "./cart_item.schema";
import { cartItemModifierSchema } from "./cart_item_modifier.schema";
import { inventorySchema } from "./inventory.schema";
import { inventoryItemSchema } from "./inventory_item.schema";
import { itemMasterSchema } from "./item_master.schema";
import { itemLotSchema } from "./item_lot.schema";
import { recipesSchema } from "./recipes.schema";
import { recipeIngredientsSchema } from "./recipe_ingredients.schema";
import { systemDefaultSchema } from "./system_default.schema";
import { syncSessionSchema } from "./sync_session.schema";
import { syncTableLogSchema } from "./sync_table_log.schema";
import { notificationsSchema } from "./notifications.schema";

export const schemas: TableSchema[] = [
  userSchema,
  productSchema,
  businessOutletSchema,
  businessSchema,
  businessRoleSchema,
  businessUserSchema,
  businessUserRolesBusinessRoleSchema,
  customersSchema,
  customerAddressSchema,
  cartSchema,
  cartItemSchema,
  cartItemModifierSchema,
  inventorySchema,
  inventoryItemSchema,
  itemMasterSchema,
  itemLotSchema,
  recipesSchema,
  recipeIngredientsSchema,
  systemDefaultSchema,
  syncSessionSchema,
  syncTableLogSchema,
  notificationsSchema,
];
