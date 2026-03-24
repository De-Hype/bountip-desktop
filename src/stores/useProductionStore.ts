import { create } from "zustand";

export interface Production {
  id: string;
  status: string;
  previousStatus: string;
  productionDate: string;
  additionalInformation: string;
  productionTime: string;
  initiator: string;
  cancelReason: string;
  batchId: string;
  scheduleId: string;
  createdAt: string;
  updatedAt: string;
  metadata: string;
  outletId: string;
  recordId: string;
  version: number;
  productionDueDate: string;
  productionManager: string;
}

export interface ProductionItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  outletId: string;
  productionId: string;
  orderId: string;
  recordId: string;
  version: number;
}

interface ProductionState {
  productions: Production[];
  isLoading: boolean;
  error: string | null;
  fetchProductions: (outletId?: string) => Promise<void>;
}

const useProductionStore = create<ProductionState>((set) => ({
  productions: [],
  isLoading: false,
  error: null,

  fetchProductions: async (outletId) => {
    set({ isLoading: true, error: null });
    try {
      const api = (window as any).electronAPI;
      if (!api || !api.dbQuery) {
        throw new Error("Electron API not available");
      }

      let sql = "SELECT * FROM productions ORDER BY createdAt DESC";
      let params: any[] = [];

      if (outletId) {
        sql = "SELECT * FROM productions WHERE outletId = ? ORDER BY createdAt DESC";
        params = [outletId];
      }

      const result = await api.dbQuery(sql, params);
      set({ productions: result, isLoading: false });
    } catch (error: any) {
      console.error("Failed to fetch productions:", error);
      set({ error: error.message, isLoading: false });
    }
  },
}));

export default useProductionStore;
