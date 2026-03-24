export enum OrderStatus {
  PENDING = "Pending",
  INTENT = "Intent",
  TO_BE_PRODUCED = "To be produced",
  SCHEDULED_FOR_PRODUCTION = "Scheduled for Production",
  READY = "Ready",
  COMPLETED = "Completed",
  CANCELLED = "Cancelled",
}

export enum OnlineOrderStatus {
  PENDING = "Pending",
  CONFIRMED = "Confirmed",
  IN_PRODUCTION = "In Production",
  TO_BE_PRODUCED = "To Be Produced",
  READY = "Ready",
  DELIVERED = "Delivered",
  COMPLETED = "Completed",
  CANCELLED = "Cancelled",
}
export enum OrderChannel {
  WHATSAPP = "Whatsapp",
  EMAIL = "Email",
  WEBSITE = "Website",
  POS = "POS",
  ONLINE = "Online",
}

export enum OrderMode {
  ONLINE = "Online",
  IN_STORE = "In-store",
}

export enum OrderType {
  PRE_ORDER = "Pre-order",
  REGULAR = "Regular",
}

export interface Order {
  id: string;
  status: OrderStatus;
  deliveryMethod: string;
  amount: number;
  tax: number;
  serviceCharge: number;
  cashCollected: number;
  changeGiven: number;
  total: number;
  deliveryFee: number;
  specialInstructions: string;
  recipientName: string;
  occasion: string;
  initiator: string;
  recipientPhone: string;
  scheduledAt: string;
  address: string;
  reference: string;
  externalReference: string;
  orderMode: OrderMode;
  orderChannel: OrderChannel;
  orderType: OrderType;
  confirmedBy: string;
  confirmedAt: string;
  cancelledBy: string;
  cancelledAt: string;
  cancellationReason: string;
  createdAt: string;
  updatedAt: string;
  timeline: string; // JSON string
  customerId: string;
  outletId: string;
  cartId: string;
  paymentReference: string;
  paymentMethod: string;
  paymentStatus: string;
  discount: number;
  markup: number;
  deletedAt: string;
  recordId: string;
  version: number;

  // Joined fields
  customerName?: string;
  itemCount?: number;

  // Full Cart data
  cart_id?: string;
  cart_reference?: string;
  cart_status?: string;
  cart_totalAmount?: number;
  cart_totalQuantity?: number;
  cart_itemCount?: number;
}

export interface Cart {
  id: string;
  reference: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  outletId: string;
  itemCount: number;
  totalQuantity: number;
  totalAmount: number;
  customerId: string;
  recordId: string | null;
  version: number;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  cartId: string;
  priceTierDiscount: number;
  priceTierMarkup: number;
  recordId: string | null;
  version: number;
}
