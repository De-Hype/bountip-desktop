import { create } from "zustand";

export interface Order {
  id: string;
  status: string;
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
  orderMode: string;
  orderChannel: string;
  orderType: string;
  confirmedBy: string;
  confirmedAt: string;
  cancelledBy: string;
  cancelledAt: string;
  cancellationReason: string;
  createdAt: string;
  updatedAt: string;
  timeline: string;
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
  customerName?: string;
}

interface OrderState {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  fetchOrders: (outletId?: string) => Promise<void>;
}

const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  isLoading: false,
  error: null,

  fetchOrders: async (outletId) => {
    set({ isLoading: true, error: null });
    try {
      const api = (window as any).electronAPI;
      if (!api || !api.dbQuery) {
        throw new Error("Electron API not available");
      }

      let sql = `
        SELECT o.*, c.name as customerName 
        FROM orders o 
        LEFT JOIN customers c ON o.customerId = c.id 
        ORDER BY o.createdAt DESC
      `;
      let params: any[] = [];

      if (outletId) {
        sql = `
          SELECT o.*, c.name as customerName 
          FROM orders o 
          LEFT JOIN customers c ON o.customerId = c.id 
          WHERE o.outletId = ? 
          ORDER BY o.createdAt DESC
        `;
        params = [outletId];
      }

      const result = await api.dbQuery(sql, params);
      set({ orders: result, isLoading: false });
    } catch (error: any) {
      console.error("Failed to fetch orders:", error);
      set({ error: error.message, isLoading: false });
    }
  },
}));

export default useOrderStore;
