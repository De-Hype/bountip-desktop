export enum ProductionV2Status {
  ORDER_SELECTED = "order_selected",
  INVENTORY_PENDING = "inventory_pending",
  INVENTORY_APPROVED = "inventory_approved",
  IN_PREPARATION = "in_preparation",
  QUALITY_CONTROL = "quality_control",
  READY = "ready",
  CANCELLED = "cancelled",
}

export enum ProductionV2WorkflowPath {
  SKIP_INVENTORY = "skip_inventory",
  INVENTORY_FLOW = "inventory_flow",
}
