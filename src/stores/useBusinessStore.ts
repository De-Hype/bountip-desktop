/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import businessService, { Outlet } from "@/services/businessService";
import type { Business } from "@/types/business";
import httpService from "@/services/httpService";

type ElectronAPI = {
  [x: string]: any;
  cacheGet: (key: string) => Promise<any>;
  cachePut: (key: string, value: any) => Promise<void>;
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
};

export const useBusinessStore = create<BusinessState>((set, get) => ({
  primaryBusiness: null,
  outlets: [],
  selectedOutletId: null,
  selectedOutlet: null,
  isLoading: false,
  error: null,
  fetchBusinessData: async () => {
    set({ isLoading: true, error: null });
    const api = getElectronAPI();
    if (api) {
      try {
        const cachedOutlets = await api.cacheGet("business:outlets");
        const cachedBusiness = await api.cacheGet("business:primary");
        const cachedSelectedId = await api.cacheGet(
          "business:selectedOutletId"
        );
        if (cachedOutlets || cachedBusiness) {
          set({
            outlets: Array.isArray(cachedOutlets) ? cachedOutlets : [],
            primaryBusiness: (cachedBusiness as Business) ?? null,
            selectedOutletId:
              (typeof cachedSelectedId === "string" && cachedSelectedId) ||
              null,
          });
        }
      } catch {}
    }
    // If offline, avoid any network calls and serve from cache only
    try {
      const online = api
        ? await api
            .cacheGet("__network__")
            .then(() => api.getNetworkStatus())
            .then((r) => r.online)
            .catch(() =>
              typeof navigator !== "undefined" ? navigator.onLine : true
            )
        : typeof navigator !== "undefined"
        ? navigator.onLine
        : true;
      if (api && !online) {
        const outletId = get().selectedOutletId || get().outlets?.[0]?.id;
        if (outletId) {
          const api2 = getElectronAPI();
          if (api2) {
            try {
              const [
                allergens,
                preparationArea,
                packagingMethod,
                category,
                weightScale,
              ] = await Promise.all([
                api2
                  .cacheGet(`defaults:${outletId}:allergens`)
                  .catch(() => null),
                api2
                  .cacheGet(`defaults:${outletId}:preparation-area`)
                  .catch(() => null),
                api2
                  .cacheGet(`defaults:${outletId}:packaging-method`)
                  .catch(() => null),
                api2
                  .cacheGet(`defaults:${outletId}:category`)
                  .catch(() => null),
                api2
                  .cacheGet(`defaults:${outletId}:weight-scale`)
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
                isLoading: false,
              });
            } catch {
              set({ isLoading: false });
            }
          } else {
            set({ isLoading: false });
          }
        } else {
          set({ isLoading: false });
        }
        return;
      }
    } catch {}
    try {
      const [outletsRes, businessRes] = await Promise.all([
        businessService.loadAllOutlet(),
        businessService.loadBusiness(),
      ]);

      let outlets = Array.isArray(outletsRes?.data)
        ? (outletsRes.data as Outlet[])
        : [];
      const business = (businessRes?.data ?? null) as Business | null;

      // Merge any locally cached outlet updates (offline mutations) by outlet id
      if (api && outlets.length > 0) {
        try {
          const merged = await Promise.all(
            outlets.map(async (o) => {
              try {
                const cached = await api.cacheGet(`outlet:${o.id}`);
                if (cached && cached.data) {
                  const cd = cached.data as Partial<Outlet>;
                  return { ...o, ...cd } as Outlet;
                }
              } catch {}
              return o;
            })
          );
          outlets = merged;
        } catch {}
      }

      const currentSelectedId = get().selectedOutletId;
      let cachedSelectedId: string | null = null;
      if (api) {
        try {
          const v = await api.cacheGet("business:selectedOutletId");
          cachedSelectedId = typeof v === "string" ? v : null;
        } catch {}
      }
      const nextSelectedId =
        (cachedSelectedId && outlets.some((o) => o.id === cachedSelectedId)
          ? cachedSelectedId
          : null) ??
        (currentSelectedId && outlets.some((o) => o.id === currentSelectedId)
          ? currentSelectedId
          : outlets[0]?.id ?? null);
      const nextSelected = nextSelectedId
        ? outlets.find((o) => o.id === nextSelectedId) ?? null
        : null;

      set({
        outlets,
        primaryBusiness: business,
        selectedOutletId: nextSelectedId,
        selectedOutlet: nextSelected,
        isLoading: false,
      });
      if (api) {
        try {
          await api.cachePut("business:outlets", outlets);
          await api.cachePut("business:primary", business);
          if (nextSelectedId)
            await api.cachePut("business:selectedOutletId", nextSelectedId);
          if (nextSelected)
            await api.cachePut("business:selectedOutlet", nextSelected);
        } catch {}
      }

      const outletId = get().selectedOutletId || outlets?.[0]?.id;
      if (outletId) {
        // Try network GETs first, then fall back to cache
        try {
          const [
            allergens,
            preparationArea,
            packagingMethod,
            category,
            weightScale,
          ] = await Promise.all([
            httpService.get<any>(`/${outletId}/defaults/allergens`, true),
            httpService.get<any>(
              `/${outletId}/defaults/preparation-area`,
              true
            ),
            httpService.get<any>(
              `/${outletId}/defaults/packaging-method`,
              true
            ),
            httpService.get<any>(`/${outletId}/defaults/category`, true),
            httpService.get<any>(`/${outletId}/defaults/weight-scale`, true),
          ]);

          set({
            systemDefaults: {
              allergens,
              preparationArea,
              packagingMethod,
              category,
              weightScale,
            },
          });

          const api2 = getElectronAPI();
          if (api2) {
            try {
              await api2.cachePut(`defaults:${outletId}:allergens`, allergens);
              await api2.cachePut(
                `defaults:${outletId}:preparation-area`,
                preparationArea
              );
              await api2.cachePut(
                `defaults:${outletId}:packaging-method`,
                packagingMethod
              );
              await api2.cachePut(`defaults:${outletId}:category`, category);
              await api2.cachePut(
                `defaults:${outletId}:weight-scale`,
                weightScale
              );
            } catch {}
          }
        } catch {
          const api2 = getElectronAPI();
          if (api2) {
            try {
              const [
                allergens,
                preparationArea,
                packagingMethod,
                category,
                weightScale,
              ] = await Promise.all([
                api2
                  .cacheGet(`defaults:${outletId}:allergens`)
                  .catch(() => null),
                api2
                  .cacheGet(`defaults:${outletId}:preparation-area`)
                  .catch(() => null),
                api2
                  .cacheGet(`defaults:${outletId}:packaging-method`)
                  .catch(() => null),
                api2
                  .cacheGet(`defaults:${outletId}:category`)
                  .catch(() => null),
                api2
                  .cacheGet(`defaults:${outletId}:weight-scale`)
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
            } catch {}
          }
        }
      }
    } catch (e: any) {
      const message = e?.message || "Failed to load business data";
      set({ error: message, isLoading: false });
    }
  },
  selectOutlet: (id: string) => {
    const outlets = get().outlets;
    const found = outlets.find((o) => o.id === id) ?? null;
    set({ selectedOutletId: id, selectedOutlet: found });
    const api = getElectronAPI();
    if (api) {
      (async () => {
        try {
          await api.cachePut("business:selectedOutletId", id);
          if (found) await api.cachePut("business:selectedOutlet", found);
          const [
            allergens,
            preparationArea,
            packagingMethod,
            category,
            weightScale,
          ] = await Promise.all([
            api.cacheGet(`defaults:${id}:allergens`).catch(() => null),
            api.cacheGet(`defaults:${id}:preparation-area`).catch(() => null),
            api.cacheGet(`defaults:${id}:packaging-method`).catch(() => null),
            api.cacheGet(`defaults:${id}:category`).catch(() => null),
            api.cacheGet(`defaults:${id}:weight-scale`).catch(() => null),
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
}));

export default useBusinessStore;
