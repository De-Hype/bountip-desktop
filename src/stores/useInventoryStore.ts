import { create } from "zustand";

interface InventoryState {
  inventoryItems: any[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: number;
  setInventoryItems: (items: any[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  refreshInventory: () => void;
}

const useInventoryStore = create<InventoryState>((set) => ({
  inventoryItems: [],
  isLoading: false,
  error: null,
  lastUpdated: Date.now(),
  setInventoryItems: (items) => set({ inventoryItems: items }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  refreshInventory: () => set({ lastUpdated: Date.now() }),
}));

export default useInventoryStore;
