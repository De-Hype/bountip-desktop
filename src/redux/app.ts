import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { tokenManager } from "@/utils/tokenManager";

const baseUrl = "https://seal-app-wzqhf.ondigitalocean.app/api/v1";
//  (process.env.NEXT_PUBLIC_API_BASE_URL || "").trim()
//   ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1`
//   : "https://seal-app-wzqhf.ondigitalocean.app/api/v1";

type ElectronAPI = {
  getNetworkStatus: () => Promise<{ online: boolean }>;
  cachePut: (key: string, value: any) => Promise<void>;
  broadcast: (message: any) => void;
};

const getElectronAPI = (): ElectronAPI | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { electronAPI?: ElectronAPI };
  return w.electronAPI ?? null;
};

export type ImageUploadResponse = {
  status: boolean;
  message: string;
  data: { url: string };
};

export type SystemDefaultResponse = {
  status: boolean;
  message: string;
  data: any;
};

export type SystemDefaultType =
  | "allergens"
  | "preparation-area"
  | "packaging-method"
  | "category"
  | "weight-scale";

export const appApi = createApi({
  reducerPath: "appApi",
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers) => {
      const token = tokenManager.getAccessToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    uploadImage: builder.mutation<ImageUploadResponse, FormData>({
      query: (formData) => ({
        url: "/static/upload",
        method: "POST",
        body: formData,
      }),
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const url = data?.data?.url;
          const api = getElectronAPI();
          if (!url || !api) return;
          const { online } = await api
            .getNetworkStatus()
            .catch(() => ({ online: true }));
          if (!online) return;
          const res = await fetch(url);
          const blob = await res.blob();
          const toBase64 = () =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(String(reader.result));
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          const base64 = await toBase64();
          await api.cachePut(`image:${url}`, { data: base64, ts: Date.now() });
          api.broadcast({ kind: "image-cache", url, data: base64 });
        } catch {}
      },
    }),
    loadAllergens: builder.query<SystemDefaultResponse, string>({
      query: (outletId) => ({
        url: `${outletId}/defaults/allergens`,
        method: "GET",
      }),
      async onQueryStarted(outletId, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const api = getElectronAPI();
          if (api) await api.cachePut(`defaults:${outletId}:allergens`, data);
        } catch {}
      },
    }),
    loadPreparationArea: builder.query<SystemDefaultResponse, string>({
      query: (outletId) => ({
        url: `${outletId}/defaults/preparation-area`,
        method: "GET",
      }),
      async onQueryStarted(outletId, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const api = getElectronAPI();
          if (api)
            await api.cachePut(`defaults:${outletId}:preparation-area`, data);
        } catch {}
      },
    }),
    loadPackingMethod: builder.query<SystemDefaultResponse, string>({
      query: (outletId) => ({
        url: `${outletId}/defaults/packaging-method`,
        method: "GET",
      }),
      async onQueryStarted(outletId, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const api = getElectronAPI();
          if (api)
            await api.cachePut(`defaults:${outletId}:packaging-method`, data);
        } catch {}
      },
    }),
    loadCategory: builder.query<SystemDefaultResponse, string>({
      query: (outletId) => ({
        url: `${outletId}/defaults/category`,
        method: "GET",
      }),
      async onQueryStarted(outletId, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const api = getElectronAPI();
          if (api) await api.cachePut(`defaults:${outletId}:category`, data);
        } catch {}
      },
    }),
    loadWeightScale: builder.query<SystemDefaultResponse, string>({
      query: (outletId) => ({
        url: `${outletId}/defaults/weight-scale`,
        method: "GET",
      }),
      async onQueryStarted(outletId, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const api = getElectronAPI();
          if (api)
            await api.cachePut(`defaults:${outletId}:weight-scale`, data);
        } catch {}
      },
    }),
    addDefault: builder.mutation<
      SystemDefaultResponse,
      { item: string; defaultType: SystemDefaultType; outletId: string }
    >({
      query: ({ item, defaultType, outletId }) => ({
        url: `${outletId}/defaults/${defaultType}/data`,
        method: "POST",
        body: { item: { name: item } },
      }),
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const api = getElectronAPI();
          if (api)
            await api.cachePut(
              `defaults:${arg.outletId}:${arg.defaultType}`,
              data
            );
        } catch {}
      },
    }),
  }),
});

export const {
  useUploadImageMutation,
  useLoadAllergensQuery,
  useLoadPreparationAreaQuery,
  useLoadPackingMethodQuery,
  useLoadCategoryQuery,
  useAddDefaultMutation,
  useLoadWeightScaleQuery,
} = appApi;
