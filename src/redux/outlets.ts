/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
import {} from "@/types/business";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { tokenManager } from "@/utils/tokenManager";
import type { Outlet } from "@/services/businessService";
type ElectronAPI = {
  getNetworkStatus: () => Promise<{ online: boolean }>;
  queueAdd: (op: {
    method: string;
    path: string;
    data?: any;
    useAuth?: boolean;
  }) => Promise<void>;
  cachePut: (key: string, value: any) => Promise<void>;
  broadcast: (message: any) => void;
};

const getElectronAPI = (): ElectronAPI | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { electronAPI?: ElectronAPI };
  return w.electronAPI ?? null;
};

type OutletResponse = { status: boolean; message: string; data: Outlet };
type UpdateOutletRequest = Record<string, any>;
import {
  CreatePriceTierDto,
  CreateServiceChargeDto,
  CreateTaxDto,
  InvoiceSettingsResponse,
  LabelSettingsResponse,
  OperatingHoursResponse,
  PaymentMethodsResponse,
  PriceTierResponse,
  ReceiptSettingsResponse,
  ServiceChargeResponse,
  TaxResponse,
  UpdateInvoiceSettingsDto,
  UpdateLabelSettingsDto,
  UpdateOperatingHoursDto,
  UpdatePaymentMethodsDto,
  UpdatePriceTierDto,
  UpdateReceiptSettingsDto,
  UpdateServiceChargeDto,
  UpdateTaxDto,
} from "./storesTypes";
const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "").trim()
  ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1`
  : "https://seal-app-wzqhf.ondigitalocean.app/api/v1";

export const outletApi = createApi({
  reducerPath: "outletApi",
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers) => {
      const token = tokenManager.getAccessToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  endpoints: (builder) => ({
    updateOutlet: builder.mutation<
      OutletResponse,
      { payload: UpdateOutletRequest; outletId: string }
    >({
      query: ({ outletId, payload }) => ({
        url: `/outlet/${outletId}`,
        method: "PATCH",
        body: payload,
        headers: {
          "Content-Type": "application/json",
        },
      }),
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const api = getElectronAPI();
          const ts = Date.now();
          if (api) {
            try {
              await api.cachePut(`outlet:${arg.outletId}`, {
                data: data.data,
                ts,
              });
              api.broadcast({
                kind: "outlet-update",
                outletId: arg.outletId,
                data: data.data,
                ts,
              });
            } catch {}
          }
        } catch (error) {
          const api = getElectronAPI();
          try {
            const online = await api
              ?.getNetworkStatus()
              .then((r) => r.online)
              .catch(() => true);
            if (api && !online)
              await api.queueAdd({
                method: "PATCH",
                path: `/outlet/${arg.outletId}`,
                data: arg.payload,
                useAuth: true,
              });
          } catch {}
        }
      },
    }),
    createPriceTier: builder.mutation<
      PriceTierResponse,
      { outletId: string; data: CreatePriceTierDto }
    >({
      query: ({ outletId, data }) => ({
        url: `/outlet/${outletId}/price-tier`,
        method: "POST",
        body: data,
      }),
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const api = getElectronAPI();
          const ts = Date.now();
          if (api) {
            try {
              await api.cachePut(`outlet:${arg.outletId}`, {
                data: data.data,
                ts,
              });
              api.broadcast({
                kind: "outlet-update",
                outletId: arg.outletId,
                data: data.data,
                ts,
              });
            } catch {}
          }
        } catch (error) {
          const api = getElectronAPI();
          try {
            const online = await api
              ?.getNetworkStatus()
              .then((r) => r.online)
              .catch(() => true);
            if (api && !online)
              await api.queueAdd({
                method: "POST",
                path: `/outlet/${arg.outletId}/price-tier`,
                data: arg.data,
                useAuth: true,
              });
          } catch {}
        }
      },
    }),

    updatePriceTier: builder.mutation<
      PriceTierResponse,
      { outletId: string; tierId: string; data: UpdatePriceTierDto }
    >({
      query: ({ outletId, tierId, data }) => ({
        url: `/outlet/${outletId}/price-tier/${tierId}`,
        method: "PATCH",
        body: data,
      }),
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const api = getElectronAPI();
          const ts = Date.now();
          if (api) {
            try {
              await api.cachePut(`outlet:${arg.outletId}`, {
                data: data.data,
                ts,
              });
              api.broadcast({
                kind: "outlet-update",
                outletId: arg.outletId,
                data: data.data,
                ts,
              });
            } catch {}
          }
        } catch (error) {
          const api = getElectronAPI();
          try {
            const online = await api
              ?.getNetworkStatus()
              .then((r) => r.online)
              .catch(() => true);
            if (api && !online)
              await api.queueAdd({
                method: "PATCH",
                path: `/outlet/${arg.outletId}/price-tier/${arg.tierId}`,
                data: arg.data,
                useAuth: true,
              });
          } catch {}
        }
      },
    }),

    deletePriceTier: builder.mutation<
      PriceTierResponse,
      { outletId: string; tierId: string }
    >({
      query: ({ outletId, tierId }) => ({
        url: `/outlet/${outletId}/price-tier/${tierId}`,
        method: "DELETE",
      }),
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const api = getElectronAPI();
          const ts = Date.now();
          if (api) {
            try {
              await api.cachePut(`outlet:${arg.outletId}`, {
                data: data.data,
                ts,
              });
              api.broadcast({
                kind: "outlet-update",
                outletId: arg.outletId,
                data: data.data,
                ts,
              });
            } catch {}
          }
        } catch (error) {
          const api = getElectronAPI();
          try {
            const online = await api
              ?.getNetworkStatus()
              .then((r) => r.online)
              .catch(() => true);
            if (api && !online)
              await api.queueAdd({
                method: "DELETE",
                path: `/outlet/${arg.outletId}/price-tier/${arg.tierId}`,
                useAuth: true,
              });
          } catch {}
        }
      },
    }),
    updateOperatingHours: builder.mutation<
      OperatingHoursResponse,
      { outletId: string; data: UpdateOperatingHoursDto }
    >({
      query: ({ outletId, data }) => ({
        url: `/outlet/${outletId}/operating-hours`,
        method: "PATCH",
        body: data,
      }),
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const api = getElectronAPI();
          const ts = Date.now();
          if (api) {
            try {
              await api.cachePut(`outlet:${arg.outletId}`, {
                data: data.data,
                ts,
              });
              api.broadcast({
                kind: "outlet-update",
                outletId: arg.outletId,
                data: data.data,
                ts,
              });
            } catch {}
          }
        } catch (error) {
          const api = getElectronAPI();
          try {
            const online = await api
              ?.getNetworkStatus()
              .then((r) => r.online)
              .catch(() => true);
            if (api && !online)
              await api.queueAdd({
                method: "PATCH",
                path: `/outlet/${arg.outletId}/operating-hours`,
                data: arg.data,
                useAuth: true,
              });
          } catch {}
        }
      },
    }),
    createTax: builder.mutation<
      TaxResponse,
      { outletId: string; data: CreateTaxDto }
    >({
      query: ({ outletId, data }) => ({
        url: `/outlet/${outletId}/taxes`,
        method: "POST",
        body: data,
      }),
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const api = getElectronAPI();
          const ts = Date.now();
          if (api) {
            try {
              await api.cachePut(`outlet:${arg.outletId}`, {
                data: data.data,
                ts,
              });
              api.broadcast({
                kind: "outlet-update",
                outletId: arg.outletId,
                data: data.data,
                ts,
              });
            } catch {}
          }
        } catch (error) {
          const api = getElectronAPI();
          try {
            const online = await api
              ?.getNetworkStatus()
              .then((r) => r.online)
              .catch(() => true);
            if (api && !online)
              await api.queueAdd({
                method: "POST",
                path: `/outlet/${arg.outletId}/taxes`,
                data: arg.data,
                useAuth: true,
              });
          } catch {}
        }
      },
    }),

    updateTax: builder.mutation<
      TaxResponse,
      { outletId: string; taxId: string; data: UpdateTaxDto }
    >({
      query: ({ outletId, taxId, data }) => ({
        url: `/outlet/${outletId}/taxes/${taxId}`,
        method: "PATCH",
        body: data,
      }),
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const api = getElectronAPI();
          const ts = Date.now();
          if (api) {
            try {
              await api.cachePut(`outlet:${arg.outletId}`, {
                data: data.data,
                ts,
              });
              api.broadcast({
                kind: "outlet-update",
                outletId: arg.outletId,
                data: data.data,
                ts,
              });
            } catch {}
          }
        } catch (error) {
          const api = getElectronAPI();
          try {
            const online = await api
              ?.getNetworkStatus()
              .then((r) => r.online)
              .catch(() => true);
            if (api && !online)
              await api.queueAdd({
                method: "PATCH",
                path: `/outlet/${arg.outletId}/taxes/${arg.taxId}`,
                data: arg.data,
                useAuth: true,
              });
          } catch {}
        }
      },
    }),

    deleteTax: builder.mutation<
      TaxResponse,
      { outletId: string; taxId: string }
    >({
      query: ({ outletId, taxId }) => ({
        url: `/outlet/${outletId}/taxes/${taxId}`,
        method: "DELETE",
      }),
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const api = getElectronAPI();
          const ts = Date.now();
          if (api) {
            try {
              await api.cachePut(`outlet:${arg.outletId}`, {
                data: data.data,
                ts,
              });
              api.broadcast({
                kind: "outlet-update",
                outletId: arg.outletId,
                data: data.data,
                ts,
              });
            } catch {}
          }
        } catch (error) {
          const api = getElectronAPI();
          try {
            const online = await api
              ?.getNetworkStatus()
              .then((r) => r.online)
              .catch(() => true);
            if (api && !online)
              await api.queueAdd({
                method: "DELETE",
                path: `/outlet/${arg.outletId}/taxes/${arg.taxId}`,
                useAuth: true,
              });
          } catch {}
        }
      },
    }),
    createServiceCharge: builder.mutation<
      ServiceChargeResponse,
      { outletId: string; data: CreateServiceChargeDto }
    >({
      query: ({ outletId, data }) => ({
        url: `/outlet/${outletId}/service-charges`,
        method: "POST",
        body: data,
      }),
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const api = getElectronAPI();
          const ts = Date.now();
          if (api) {
            try {
              await api.cachePut(`outlet:${arg.outletId}`, {
                data: data.data,
                ts,
              });
              api.broadcast({
                kind: "outlet-update",
                outletId: arg.outletId,
                data: data.data,
                ts,
              });
            } catch {}
          }
        } catch (error) {
          const api = getElectronAPI();
          try {
            const online = await api
              ?.getNetworkStatus()
              .then((r) => r.online)
              .catch(() => true);
            if (api && !online)
              await api.queueAdd({
                method: "POST",
                path: `/outlet/${arg.outletId}/service-charges`,
                data: arg.data,
                useAuth: true,
              });
          } catch {}
        }
      },
    }),

    updateServiceCharge: builder.mutation<
      ServiceChargeResponse,
      { outletId: string; chargeId: string; data: UpdateServiceChargeDto }
    >({
      query: ({ outletId, chargeId, data }) => ({
        url: `/outlet/${outletId}/service-charges/${chargeId}`,
        method: "PATCH",
        body: data,
      }),
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const api = getElectronAPI();
          const ts = Date.now();
          if (api) {
            try {
              await api.cachePut(`outlet:${arg.outletId}`, {
                data: data.data,
                ts,
              });
              api.broadcast({
                kind: "outlet-update",
                outletId: arg.outletId,
                data: data.data,
                ts,
              });
            } catch {}
          }
        } catch (error) {
          const api = getElectronAPI();
          try {
            const online = await api
              ?.getNetworkStatus()
              .then((r) => r.online)
              .catch(() => true);
            if (api && !online)
              await api.queueAdd({
                method: "PATCH",
                path: `/outlet/${arg.outletId}/service-charges/${arg.chargeId}`,
                data: arg.data,
                useAuth: true,
              });
          } catch {}
        }
      },
    }),

    deleteServiceCharge: builder.mutation<
      ServiceChargeResponse,
      { outletId: string; chargeId: string }
    >({
      query: ({ outletId, chargeId }) => ({
        url: `/outlet/${outletId}/service-charges/${chargeId}`,
        method: "DELETE",
      }),
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const api = getElectronAPI();
          const ts = Date.now();
          if (api) {
            try {
              await api.cachePut(`outlet:${arg.outletId}`, {
                data: data.data,
                ts,
              });
              api.broadcast({
                kind: "outlet-update",
                outletId: arg.outletId,
                data: data.data,
                ts,
              });
            } catch {}
          }
        } catch (error) {
          const api = getElectronAPI();
          try {
            const online = await api
              ?.getNetworkStatus()
              .then((r) => r.online)
              .catch(() => true);
            if (api && !online)
              await api.queueAdd({
                method: "DELETE",
                path: `/outlet/${arg.outletId}/service-charges/${arg.chargeId}`,
                useAuth: true,
              });
          } catch {}
        }
      },
    }),
    updatePaymentMethods: builder.mutation<
      PaymentMethodsResponse,
      { outletId: string; data: UpdatePaymentMethodsDto }
    >({
      query: ({ outletId, data }) => ({
        url: `/outlet/${outletId}/payment-method`,
        method: "PATCH",
        body: data,
      }),
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const api = getElectronAPI();
          const ts = Date.now();
          if (api) {
            try {
              await api.cachePut(`outlet:${arg.outletId}`, {
                data: data.data,
                ts,
              });
              api.broadcast({
                kind: "outlet-update",
                outletId: arg.outletId,
                data: data.data,
                ts,
              });
            } catch {}
          }
        } catch (error) {
          const api = getElectronAPI();
          try {
            const online = await api
              ?.getNetworkStatus()
              .then((r) => r.online)
              .catch(() => true);
            if (api && !online)
              await api.queueAdd({
                method: "PATCH",
                path: `/outlet/${arg.outletId}/payment-method`,
                data: arg.data,
                useAuth: true,
              });
          } catch {}
        }
      },
    }),
    deletePaymentMethod: builder.mutation<
      PaymentMethodsResponse,
      { outletId: string; methodId: string }
    >({
      query: ({ outletId, methodId }) => ({
        url: `/outlet/${outletId}/payment-method/${methodId}`,
        method: "DELETE",
      }),
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const api = getElectronAPI();
          const ts = Date.now();
          if (api) {
            try {
              await api.cachePut(`outlet:${arg.outletId}`, {
                data: data.data,
                ts,
              });
              api.broadcast({
                kind: "outlet-update",
                outletId: arg.outletId,
                data: data.data,
                ts,
              });
            } catch {}
          }
        } catch (error) {
          const api = getElectronAPI();
          try {
            const online = await api
              ?.getNetworkStatus()
              .then((r) => r.online)
              .catch(() => true);
            if (api && !online)
              await api.queueAdd({
                method: "DELETE",
                path: `/outlet/${arg.outletId}/payment-method/${arg.methodId}`,
                useAuth: true,
              });
          } catch {}
        }
      },
    }),

    updateReceiptSettings: builder.mutation<
      ReceiptSettingsResponse,
      { outletId: string; data: UpdateReceiptSettingsDto }
    >({
      query: ({ outletId, data }) => ({
        url: `/outlet/${outletId}/receipt-settings`,
        method: "PATCH",
        body: data,
      }),
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const api = getElectronAPI();
          const ts = Date.now();
          if (api) {
            try {
              await api.cachePut(`outlet:${arg.outletId}`, {
                data: data.data,
                ts,
              });
              api.broadcast({
                kind: "outlet-update",
                outletId: arg.outletId,
                data: data.data,
                ts,
              });
            } catch {}
          }
        } catch (error) {
          const api = getElectronAPI();
          try {
            const online = await api
              ?.getNetworkStatus()
              .then((r) => r.online)
              .catch(() => true);
            if (api && !online)
              await api.queueAdd({
                method: "PATCH",
                path: `/outlet/${arg.outletId}/receipt-settings`,
                data: arg.data,
                useAuth: true,
              });
          } catch {}
        }
      },
    }),
    updateLabelSettings: builder.mutation<
      LabelSettingsResponse,
      { outletId: string; data: UpdateLabelSettingsDto }
    >({
      query: ({ outletId, data }) => ({
        url: `/outlet/${outletId}/label-settings`,
        method: "PATCH",
        body: data,
      }),
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const api = getElectronAPI();
          const ts = Date.now();
          if (api) {
            try {
              await api.cachePut(`outlet:${arg.outletId}`, {
                data: data.data,
                ts,
              });
              api.broadcast({
                kind: "outlet-update",
                outletId: arg.outletId,
                data: data.data,
                ts,
              });
            } catch {}
          }
        } catch (error) {
          const api = getElectronAPI();
          try {
            const online = await api
              ?.getNetworkStatus()
              .then((r) => r.online)
              .catch(() => true);
            if (api && !online)
              await api.queueAdd({
                method: "PATCH",
                path: `/outlet/${arg.outletId}/invoice-settings`,
                data: arg.data,
                useAuth: true,
              });
          } catch {}
        }
      },
    }),

    updateInvoiceSettings: builder.mutation<
      InvoiceSettingsResponse,
      { outletId: string; data: UpdateInvoiceSettingsDto }
    >({
      query: ({ outletId, data }) => ({
        url: `/outlet/${outletId}/invoice-settings`,
        method: "PATCH",
        body: data,
      }),
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const api = getElectronAPI();
          const ts = Date.now();
          if (api) {
            try {
              await api.cachePut(`outlet:${arg.outletId}`, {
                data: data.data,
                ts,
              });
              api.broadcast({
                kind: "outlet-update",
                outletId: arg.outletId,
                data: data.data,
                ts,
              });
            } catch {}
          }
        } catch (error) {
          const api = getElectronAPI();
          try {
            const online = await api
              ?.getNetworkStatus()
              .then((r) => r.online)
              .catch(() => true);
            if (api && !online)
              await api.queueAdd({
                method: "PATCH",
                path: `/outlet/${arg.outletId}/label-settings`,
                data: arg.data,
                useAuth: true,
              });
          } catch {}
        }
      },
    }),
  }),
});

export const {
  useUpdateOutletMutation,
  useCreatePriceTierMutation,
  useDeletePriceTierMutation,
  useUpdatePriceTierMutation,
  useUpdateOperatingHoursMutation,
  useCreateTaxMutation,
  useUpdateTaxMutation,
  useDeleteTaxMutation,
  useCreateServiceChargeMutation,
  useUpdateServiceChargeMutation,
  useDeleteServiceChargeMutation,
  useUpdatePaymentMethodsMutation,
  useDeletePaymentMethodMutation,
  useUpdateReceiptSettingsMutation,
  useUpdateInvoiceSettingsMutation,
  useUpdateLabelSettingsMutation,
} = outletApi;
