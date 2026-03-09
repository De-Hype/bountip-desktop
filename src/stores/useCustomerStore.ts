import { create } from "zustand";

export interface Customer {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  type: "Individual" | "Organization";
  status: "Active" | "Inactive";
  balance: number;
  lastOrderDate?: string;
  paymentTermId?: string;
  createdAt: string;
}

interface CustomerState {
  customers: Customer[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  filters: {
    status: string;
    type: string;
    date: Date | undefined;
    paymentTerm: string;
  };
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
  };
  sortConfig: {
    key: keyof Customer | null;
    direction: "asc" | "desc";
  };

  // Actions
  setCustomers: (customers: Customer[]) => void;
  setSearchQuery: (query: string) => void;
  setFilter: (key: string, value: any) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  setSort: (key: keyof Customer) => void;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
}

const useCustomerStore = create<CustomerState>((set) => ({
  customers: [],
  isLoading: false,
  error: null,
  searchQuery: "",
  filters: {
    status: "All",
    type: "All",
    date: undefined,
    paymentTerm: "All",
  },
  pagination: {
    currentPage: 1,
    itemsPerPage: 10,
    totalPages: 1,
  },
  sortConfig: {
    key: null,
    direction: "asc",
  },

  setCustomers: (customers) => set({ customers }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
      pagination: { ...state.pagination, currentPage: 1 },
    })),
  resetFilters: () =>
    set({
      filters: {
        status: "All",
        type: "All",
        date: undefined,
        paymentTerm: "All",
      },
      searchQuery: "",
      pagination: { currentPage: 1, itemsPerPage: 10, totalPages: 1 },
    }),
  setPage: (page) =>
    set((state) => ({
      pagination: { ...state.pagination, currentPage: page },
    })),
  setItemsPerPage: (items) =>
    set((state) => ({
      pagination: { ...state.pagination, itemsPerPage: items, currentPage: 1 },
    })),
  setSort: (key) =>
    set((state) => {
      const direction =
        state.sortConfig.key === key && state.sortConfig.direction === "asc"
          ? "desc"
          : "asc";
      return { sortConfig: { key, direction } };
    }),
  addCustomer: (customer) =>
    set((state) => ({ customers: [...state.customers, customer] })),
  updateCustomer: (id, updates) =>
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === id ? { ...c, ...updates } : c,
      ),
    })),
  deleteCustomer: (id) =>
    set((state) => ({
      customers: state.customers.filter((c) => c.id !== id),
    })),
}));

export default useCustomerStore;
