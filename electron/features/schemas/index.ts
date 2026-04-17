import { TableSchema } from "./types";
import { userSchema } from "./user.schema";
import { usersSchema } from "./users.schema";
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
import { recipeVariantsSchema } from "./recipe_variants.schema";
import { systemDefaultSchema } from "./system_default.schema";
import { syncSessionSchema } from "./sync_session.schema";
import { syncTableLogSchema } from "./sync_table_log.schema";
import { notificationsSchema } from "./notifications.schema";
import { paymentTermSchema } from "./payment_term.schema";
import { orderSchema } from "./order.schema";
import { productionSchema } from "./production.schema";
import { productionItemSchema } from "./production_item.schema";
import { invoiceSchema } from "./invoice.schema";
import { invoiceItemSchema } from "./invoice_item.schema";
import { supplierSchema } from "./supplier.schema";
import { supplierItemSchema } from "./supplier_item.schema";
import { componentSchema } from "./component.schema";
import { componentItemSchema } from "./component_item.schema";
import { componentLotSchema } from "./component_lot.schema";
import { componentLotLogSchema } from "./component_lot_log.schema";
import { modifierSchema } from "./modifier.schema";
import { modifierOptionSchema } from "./modifier_option.schema";
import { productionV2Schema } from "./production_v2.schema";
import { productionV2ItemSchema } from "./production_v2_item.schema";
import { productionV2TraceSchema } from "./production_v2_trace.schema";
import { productionV2ApprovalLogSchema } from "./production_v2_approval_log.schema";
import { productionV2ApprovalLogItemSchema } from "./production_v2_approval_log_item.schema";

export const schemas: TableSchema[] = [
  userSchema,
  usersSchema,
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
  recipeVariantsSchema,
  systemDefaultSchema,
  syncSessionSchema,
  syncTableLogSchema,
  notificationsSchema,
  paymentTermSchema,
  orderSchema,
  productionSchema,
  productionItemSchema,
  invoiceSchema,
  invoiceItemSchema,
  supplierSchema,
  supplierItemSchema,
  componentSchema,
  componentItemSchema,
  componentLotSchema,
  componentLotLogSchema,
  modifierSchema,
  modifierOptionSchema,
  productionV2Schema,
  productionV2ItemSchema,
  productionV2TraceSchema,
  productionV2ApprovalLogSchema,
  productionV2ApprovalLogItemSchema,
];
