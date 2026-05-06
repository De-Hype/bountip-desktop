/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { Outlet } from "@/services/businessService";
import type { Business } from "@/types/business";

type ElectronAPI = {
  [x: string]: any;
  cacheGet: (key: string) => Promise<any>;
  cachePut: (key: string, value: any) => Promise<void>;
  getOutlets?: () => Promise<any[]>;
};

const getElectronAPI = (): ElectronAPI | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { electronAPI?: ElectronAPI };
  return w.electronAPI ?? null;
};

type BusinessState = {
  primaryBusiness: Business | null;
  outlets: Outlet[];
  selectedOutletId: string | null;
  selectedOutlet: Outlet | null;
  isLoading: boolean;
  hasInitialized: boolean;
  error: string | null;
  systemDefaults?: {
    allergens?: any;
    preparationArea?: any;
    packagingMethod?: any;
    category?: any;
    weightScale?: any;
  };
  fetchBusinessData: () => Promise<void>;
  selectOutlet: (id: string) => void;
  updateOutletLocal: (id: string, changes: Partial<Outlet>) => void;
  addOutletLocal: (outlet: Outlet) => void;
  removeOutletLocal: (id: string) => void;
};

export const useBusinessStore = create<BusinessState>((set, get) => ({
  primaryBusiness: null,
  outlets: [],
  selectedOutletId: null,
  selectedOutlet: null,
  isLoading: false,
  hasInitialized: false,
  error: null,
  addOutletLocal: (outlet) => {
    const api = getElectronAPI();
    const current = get().outlets;
    const updatedOutlets = [...current, outlet];

    set({ outlets: updatedOutlets });

    if (api) {
      (async () => {
        try {
          await api.cachePut("business:outlets", updatedOutlets);
          const ts = Date.now();
          await api.cachePut(`outlet:${outlet.id}`, { data: outlet, ts });
        } catch {}
      })();
    }
  },
  removeOutletLocal: (id) => {
    const api = getElectronAPI();
    const current = get().outlets;
    const updatedOutlets = current.filter((o) => String(o.id) !== String(id));
    const selectedOutletId = get().selectedOutletId;
    const selectedOutlet =
      String(selectedOutletId) === String(id) ? null : get().selectedOutlet;

    set({
      outlets: updatedOutlets,
      selectedOutlet:
        String(selectedOutletId) === String(id) ? null : selectedOutlet,
      selectedOutletId:
        String(selectedOutletId) === String(id) ? null : selectedOutletId,
    });

    if (api) {
      (async () => {
        try {
          await api.cachePut("business:outlets", updatedOutlets);
          if (selectedOutletId === id) {
            await api.cachePut("business:selectedOutletId", null);
            await api.cachePut("business:selectedOutlet", null);
          }
        } catch {}
      })();
    }
  },
  fetchBusinessData: async () => {
    set({ isLoading: true, error: null });
    const api = getElectronAPI();

    if (!api) {
      set({ isLoading: false });
      return;
    }

    try {
      // 1. Fetch outlets from SQLite or Cache
      let outlets: Outlet[] = [];
      if (api.getOutlets) {
        try {
          const sqliteOutlets = await api.getOutlets();
          if (Array.isArray(sqliteOutlets) && sqliteOutlets.length > 0) {
            outlets = sqliteOutlets;
          }
        } catch (err) {
          console.error("Failed to fetch outlets from SQLite:", err);
        }
      }

      if (outlets.length === 0) {
        try {
          const cachedOutlets = await api.cacheGet("business:outlets");
          if (Array.isArray(cachedOutlets)) {
            outlets = cachedOutlets;
          }
        } catch {}
      }

      // 2. Fetch primary business and selected ID from cache
      const [cachedBusiness, cachedSelectedId] = await Promise.all([
        api.cacheGet("business:primary").catch(() => null),
        api.cacheGet("business:selectedOutletId").catch(() => null),
      ]);

      const primaryBusiness = (cachedBusiness as Business) ?? null;
      const currentSelectedId = get().selectedOutletId;

      const outletIdEquals = (a: any, b: any) =>
        String(a ?? "") === String(b ?? "");

      const isActiveOutlet = (o: any) => {
        if (!o) return false;
        if ((o as any)?.isDeleted === 1) return false;
        if (Boolean((o as any)?.isDeleted)) return false;
        if (String((o as any)?.deletedAt || "").trim() !== "") return false;
        return true;
      };

      const activeOutlets = outlets.filter(isActiveOutlet);

      const pickDefaultOutletId = () => {
        const cachedId =
          cachedSelectedId != null ? String(cachedSelectedId) : null;
        if (
          cachedId &&
          activeOutlets.some((o) => outletIdEquals(o.id, cachedId))
        ) {
          return cachedId;
        }

        const currentId =
          currentSelectedId != null ? String(currentSelectedId) : null;
        if (
          currentId &&
          activeOutlets.some((o) => outletIdEquals(o.id, currentId))
        ) {
          return currentId;
        }

        const mainOnboarded =
          activeOutlets.find(
            (o) => (o as any)?.isMainLocation === 1 && Boolean(o.isOnboarded),
          ) ||
          activeOutlets.find(
            (o) =>
              Boolean((o as any)?.isMainLocation) && Boolean(o.isOnboarded),
          ) ||
          null;
        if (mainOnboarded?.id != null) return String(mainOnboarded.id);

        const anyOnboarded = activeOutlets.find((o) => Boolean(o.isOnboarded));
        if (anyOnboarded?.id != null) return String(anyOnboarded.id);

        const mainAny =
          activeOutlets.find((o) => (o as any)?.isMainLocation === 1) ||
          activeOutlets.find((o) => Boolean((o as any)?.isMainLocation)) ||
          null;
        if (mainAny?.id != null) return String(mainAny.id);

        const first = activeOutlets[0] || outlets[0] || null;
        if (first?.id != null) return String(first.id);

        return null;
      };

      const nextSelectedId = pickDefaultOutletId();

      const nextSelected = nextSelectedId
        ? (outlets.find((o) => outletIdEquals(o.id, nextSelectedId)) ?? null)
        : null;

      // 3. Update state with basic business data
      set({
        outlets,
        primaryBusiness,
        selectedOutletId: nextSelectedId,
        selectedOutlet: nextSelected,
        hasInitialized: true,
      });

      // 4. Fetch system defaults for the selected outlet from cache
      if (nextSelectedId) {
        try {
          const [
            allergens,
            preparationArea,
            packagingMethod,
            category,
            weightScale,
          ] = await Promise.all([
            api
              .cacheGet(`defaults:${nextSelectedId}:allergens`)
              .catch(() => null),
            api
              .cacheGet(`defaults:${nextSelectedId}:preparation-area`)
              .catch(() => null),
            api
              .cacheGet(`defaults:${nextSelectedId}:packaging-method`)
              .catch(() => null),
            api
              .cacheGet(`defaults:${nextSelectedId}:category`)
              .catch(() => null),
            api
              .cacheGet(`defaults:${nextSelectedId}:weight-scale`)
              .catch(() => null),
          ]);

          const toVal = (v: any) => (v && v.data ? v : v);
          set({
            systemDefaults: {
              allergens: toVal(allergens),
              preparationArea: toVal(preparationArea),
              packagingMethod: toVal(packagingMethod),
              category: toVal(category),
              weightScale: toVal(weightScale),
            },
          });
        } catch (err) {
          console.error("Failed to fetch system defaults from cache:", err);
        }
      }

      set({ isLoading: false });
    } catch (e: any) {
      const message = e?.message || "Failed to load local business data";
      set({ error: message, isLoading: false });
    }
  },
  selectOutlet: (id: string) => {
    const outlets = get().outlets;
    const isActiveOutlet = (o: any) => {
      if (!o) return false;
      if ((o as any)?.isDeleted === 1) return false;
      if (Boolean((o as any)?.isDeleted)) return false;
      if (String((o as any)?.deletedAt || "").trim() !== "") return false;
      return true;
    };

    const activeOutlets = outlets.filter(isActiveOutlet);
    const found =
      activeOutlets.find((o) => String(o.id) === String(id)) ??
      outlets.find((o) => String(o.id) === String(id)) ??
      null;

    const resolved =
      (found && isActiveOutlet(found) ? found : null) ||
      activeOutlets.find(
        (o) => (o as any)?.isMainLocation === 1 && Boolean(o.isOnboarded),
      ) ||
      activeOutlets.find(
        (o) => Boolean((o as any)?.isMainLocation) && Boolean(o.isOnboarded),
      ) ||
      activeOutlets.find((o) => Boolean(o.isOnboarded)) ||
      activeOutlets[0] ||
      null;

    const nextId = resolved?.id != null ? String(resolved.id) : null;
    if (!nextId) return;

    set({ selectedOutletId: nextId, selectedOutlet: resolved });

    const api = getElectronAPI();
    if (api) {
      (async () => {
        try {
          await api.cachePut("business:selectedOutletId", nextId);
          if (resolved) await api.cachePut("business:selectedOutlet", resolved);
          const [
            allergens,
            preparationArea,
            packagingMethod,
            category,
            weightScale,
          ] = await Promise.all([
            api.cacheGet(`defaults:${nextId}:allergens`).catch(() => null),
            api
              .cacheGet(`defaults:${nextId}:preparation-area`)
              .catch(() => null),
            api
              .cacheGet(`defaults:${nextId}:packaging-method`)
              .catch(() => null),
            api.cacheGet(`defaults:${nextId}:category`).catch(() => null),
            api.cacheGet(`defaults:${nextId}:weight-scale`).catch(() => null),
          ]);
          const toVal = (v: any) => (v && v.data ? v : v);
          set({
            systemDefaults: {
              allergens: toVal(allergens),
              preparationArea: toVal(preparationArea),
              packagingMethod: toVal(packagingMethod),
              category: toVal(category),
              weightScale: toVal(weightScale),
            },
          });
        } catch {}
      })();
    }
  },
  updateOutletLocal: (id: string, changes: Partial<Outlet>) => {
    const api = getElectronAPI();
    const current = get().outlets;
    const updatedOutlets = current.map((o) =>
      String(o.id) === String(id) ? ({ ...o, ...changes } as Outlet) : o,
    );
    const selectedOutletId = get().selectedOutletId;
    const selectedOutlet =
      String(selectedOutletId) === String(id)
        ? (updatedOutlets.find((o) => String(o.id) === String(id)) ?? null)
        : get().selectedOutlet;

    set({
      outlets: updatedOutlets,
      selectedOutlet,
    });

    if (api) {
      (async () => {
        try {
          await api.cachePut("business:outlets", updatedOutlets);
          if (selectedOutletId)
            await api.cachePut("business:selectedOutletId", selectedOutletId);
          if (selectedOutlet)
            await api.cachePut("business:selectedOutlet", selectedOutlet);
          const ts = Date.now();
          const outlet = updatedOutlets.find(
            (o) => String(o.id) === String(id),
          );
          if (outlet) {
            await api.cachePut(`outlet:${id}`, { data: outlet, ts });
          }
        } catch {}
      })();
    }
  },
}));

export default useBusinessStore;
