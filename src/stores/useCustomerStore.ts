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
  customerCode?: string;
}

interface CustomerState {
  customers: Customer[];
  allCustomers: Customer[]; // 👈 NEW: for static stats
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
  fetchCustomers: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setFilter: (key: string, value: any) => void;
  applyFilters: (newFilters: any) => void;
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
  allCustomers: [],
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
  fetchCustomers: async () => {
    const state = useCustomerStore.getState();
    set({ isLoading: true, error: null });
    try {
      const api = (window as any).electronAPI;
      if (api) {
        let sql = "SELECT * FROM customers WHERE 1=1";
        const params: any[] = [];

        // Search
        if (state.searchQuery) {
          sql +=
            " AND (name LIKE ? OR email LIKE ? OR phoneNumber LIKE ? OR customerCode LIKE ?)";
          const q = `%${state.searchQuery}%`;
          params.push(q, q, q, q);
        }

        // Filters
        if (state.filters.status !== "All") {
          sql += " AND status = ?";
          params.push(state.filters.status.toLowerCase());
        }
        if (state.filters.type !== "All") {
          sql += " AND customerType = ?";
          params.push(state.filters.type.toLowerCase());
        }
        if (state.filters.date) {
          // Fix: Ensure we filter by date using the start of the day in local time
          const startOfDay = new Date(state.filters.date);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(state.filters.date);
          endOfDay.setHours(23, 59, 59, 999);

          sql += " AND createdAt >= ? AND createdAt <= ?";
          params.push(startOfDay.toISOString(), endOfDay.toISOString());
        }
        // paymentTermId not easily filtered without joining or mapping names
        // if (state.filters.paymentTerm !== "All") { ... }

        // Sort
        if (state.sortConfig.key) {
          const keyMap: any = {
            name: "name",
            email: "email",
            phoneNumber: "phoneNumber",
            type: "customerType",
            status: "status",
            createdAt: "createdAt",
          };
          const col = keyMap[state.sortConfig.key] || "createdAt";
          sql += ` ORDER BY ${col} ${state.sortConfig.direction.toUpperCase()}`;
        } else {
          sql += " ORDER BY createdAt DESC";
        }

        const result = await api.dbQuery(
          `
          SELECT c.*, pt.name as paymentTermName 
          FROM customers c
          LEFT JOIN payment_terms pt ON c.paymentTermId = pt.id
          WHERE 1=1 ${sql.split("WHERE 1=1")[1]}
        `,
          params,
        );
        const mapped: Customer[] = result.map((c: any) => ({
          id: c.id,
          name: c.name || "Unknown",
          email: c.email || "---",
          phoneNumber: c.phoneNumber || "---",
          type:
            c.customerType === "organization" ? "Organization" : "Individual",
          status: c.status === "active" ? "Active" : "Inactive",
          balance: 0,
          paymentTermId: c.paymentTermName || c.paymentTermId || "---",
          createdAt: c.createdAt,
          customerCode: c.customerCode,
        }));

        // Fetch all customers for stats if it's the first load or if filters changed
        // but stats should be based on the entire list
        const allResult = await api.dbQuery(`
          SELECT c.*, pt.name as paymentTermName 
          FROM customers c
          LEFT JOIN payment_terms pt ON c.paymentTermId = pt.id
        `);
        const allMapped: Customer[] = allResult.map((c: any) => ({
          id: c.id,
          name: c.name || "Unknown",
          email: c.email || "---",
          phoneNumber: c.phoneNumber || "---",
          type:
            c.customerType === "organization" ? "Organization" : "Individual",
          status: c.status === "active" ? "Active" : "Inactive",
          balance: 0,
          paymentTermId: c.paymentTermName || c.paymentTermId || "---",
          createdAt: c.createdAt,
          customerCode: c.customerCode,
        }));

        set({
          customers: mapped,
          allCustomers: allMapped,
          isLoading: false,
        });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  setSearchQuery: (query) => {
    set({ searchQuery: query });
    useCustomerStore.getState().fetchCustomers();
  },
  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
      pagination: { ...state.pagination, currentPage: 1 },
    }));
  },
  applyFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      pagination: { ...state.pagination, currentPage: 1 },
    }));
    useCustomerStore.getState().fetchCustomers();
  },
  resetFilters: () => {
    set({
      filters: {
        status: "All",
        type: "All",
        date: undefined,
        paymentTerm: "All",
      },
      searchQuery: "",
      pagination: { currentPage: 1, itemsPerPage: 10, totalPages: 1 },
    });
    useCustomerStore.getState().fetchCustomers();
  },
  setPage: (page) =>
    set((state) => ({
      pagination: { ...state.pagination, currentPage: page },
    })),
  setItemsPerPage: (items) =>
    set((state) => ({
      pagination: { ...state.pagination, itemsPerPage: items, currentPage: 1 },
    })),
  setSort: (key) => {
    set((state) => {
      const direction =
        state.sortConfig.key === key && state.sortConfig.direction === "asc"
          ? "desc"
          : "asc";
      return { sortConfig: { key, direction } };
    });
    useCustomerStore.getState().fetchCustomers();
  },
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
