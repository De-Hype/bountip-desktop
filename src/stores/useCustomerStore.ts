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
  pricingTier?: string;
  address?: string;
  otherEmails?: string;
  otherPhoneNumbers?: string;
  representativeNames?: string;
  customerType: string;
  createdAt: string;
  updatedAt?: string;
  updatedBy?: string;
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
  selectedOutletId: string | null;

  // Actions
  setCustomers: (customers: Customer[]) => void;
  fetchCustomers: (outletId?: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setFilter: (key: string, value: any) => void;
  applyFilters: (newFilters: any) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  setSort: (key: keyof Customer, direction?: "asc" | "desc") => void;
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
  selectedOutletId: null,

  setCustomers: (customers) => set({ customers }),
  fetchCustomers: async (outletId) => {
    const state = useCustomerStore.getState();
    const currentOutletId = outletId || state.selectedOutletId;

    if (outletId && outletId !== state.selectedOutletId) {
      set({ selectedOutletId: outletId });
    }

    if (!currentOutletId) return;

    set({ isLoading: true, error: null });
    try {
      const api = (window as any).electronAPI;
      if (api) {
        let sqlWhere = " WHERE c.outletId = ? AND c.deletedAt IS NULL";
        const params: any[] = [currentOutletId];

        // Search
        if (state.searchQuery) {
          sqlWhere +=
            " AND (c.name LIKE ? OR c.email LIKE ? OR c.phoneNumber LIKE ? OR c.customerCode LIKE ? OR c.id LIKE ?)";
          const q = `%${state.searchQuery}%`;
          params.push(q, q, q, q, q);
        }

        // Filters
        if (state.filters.status !== "All") {
          sqlWhere += " AND c.status = ?";
          params.push(state.filters.status.toLowerCase());
        }
        if (state.filters.type !== "All") {
          sqlWhere += " AND c.customerType = ?";
          params.push(state.filters.type.toLowerCase());
        }
        if (state.filters.paymentTerm !== "All") {
          sqlWhere += " AND pt.name = ?";
          params.push(state.filters.paymentTerm);
        }
        if (state.filters.date) {
          const startOfDay = new Date(state.filters.date);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(state.filters.date);
          endOfDay.setHours(23, 59, 59, 999);

          sqlWhere += " AND c.createdAt >= ? AND c.createdAt <= ?";
          params.push(startOfDay.toISOString(), endOfDay.toISOString());
        }

        // Sort
        let sqlOrder = "";
        if (state.sortConfig.key) {
          const keyMap: any = {
            name: "c.name",
            email: "c.email",
            phoneNumber: "c.phoneNumber",
            type: "c.customerType",
            status: "c.status",
            createdAt: "c.createdAt",
          };
          const col = keyMap[state.sortConfig.key] || "c.createdAt";
          sqlOrder = ` ORDER BY ${col} ${state.sortConfig.direction.toUpperCase()}`;
        } else {
          sqlOrder = " ORDER BY c.createdAt DESC";
        }

        const query = `
          SELECT c.*, pt.name as paymentTermName 
          FROM customers c
          LEFT JOIN payment_terms pt ON c.paymentTermId = pt.id
          ${sqlWhere} ${sqlOrder}
        `;

        const result = await api.dbQuery(query, params);
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
          pricingTier: c.pricingTier,
          address: c.address,
          otherEmails: c.otherEmails,
          otherPhoneNumbers: c.otherPhoneNumbers,
          representativeNames: c.representativeNames,
          customerType: c.customerType,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          updatedBy: c.updatedBy,
          customerCode: c.customerCode,
        }));

        // Fetch all customers for stats - filtered by currentOutletId
        const allSql = `
          SELECT c.*, pt.name as paymentTermName 
          FROM customers c
          LEFT JOIN payment_terms pt ON c.paymentTermId = pt.id
          WHERE c.outletId = ? AND c.deletedAt IS NULL
        `;
        const allParams: any[] = [currentOutletId];

        const allResult = await api.dbQuery(allSql, allParams);
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
          pricingTier: c.pricingTier,
          address: c.address,
          otherEmails: c.otherEmails,
          otherPhoneNumbers: c.otherPhoneNumbers,
          representativeNames: c.representativeNames,
          customerType: c.customerType,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          updatedBy: c.updatedBy,
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
    set((state) => ({
      searchQuery: query,
      pagination: { ...state.pagination, currentPage: 1 },
    }));
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
  setSort: (key, direction) => {
    set((state) => {
      const newDirection =
        direction ||
        (state.sortConfig.key === key && state.sortConfig.direction === "asc"
          ? "desc"
          : "asc");
      return { sortConfig: { key, direction: newDirection } };
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
