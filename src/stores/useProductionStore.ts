import { create } from "zustand";

export interface Production {
  id: string;
  status: string;
  previousStatus?: string | null;
  workflowPath?: string | null;
  recipeValidationStatus?: string | null;
  recipeValidationStrategy?: string | null;
  initiator?: string | null;
  inventoryCheckedBy?: string | null;
  inventoryApprovedBy?: string | null;
  productionStartedBy?: string | null;
  qcApprovedBy?: string | null;
  inventoryCheckedAt?: string | null;
  inventoryApprovedAt?: string | null;
  preparationStartedAt?: string | null;
  qcStartedAt?: string | null;
  readyAt?: string | null;
  cancelReason?: string | null;
  metadata?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  outletId?: string | null;
  batchId?: string | null;
  productionDate?: string | null;
  productionTime?: string | null;
  productionDueDate?: string | null;
  recordId?: string | null;
  version?: number;
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

      let sql = "SELECT * FROM productions_v2 ORDER BY createdAt DESC";
      let params: any[] = [];

      if (outletId) {
        sql =
          "SELECT * FROM productions_v2 WHERE outletId = ? ORDER BY createdAt DESC";
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
