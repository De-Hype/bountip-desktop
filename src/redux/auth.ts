/* eslint-disable @typescript-eslint/no-explicit-any */

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { tokenManager } from "@/utils/tokenManager";

const baseUrl = "https://seal-app-wzqhf.ondigitalocean.app/api/v1";
//   process.env.NEXT_PUBLIC_API_BASE_URL || ""
// ).trim()
//   ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1`
//   : "https://seal-app-wzqhf.ondigitalocean.app/api/v1";

type ChangePasswordResponse = { status: boolean; message: string; data?: any };
type ChangePasswordDto = { oldPassword: string; newPassword: string };

type SetPinResponse = { status: boolean; message: string; data?: any };
type SetPinDto = { pin: string };
type LoginPinResponse = {
  status?: boolean;
  message?: string;
  data: { tokens: { accessToken: string; refreshToken: string }; user: any };
};
type LoginPinDto = { mode: "pin"; email: string; passCode: string };

export const authApi = createApi({
  reducerPath: "authApi",
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
    changePassword: builder.mutation<ChangePasswordResponse, ChangePasswordDto>(
      {
        query: (body) => ({
          url: "auth/change-password",
          method: "PATCH",
          body,
        }),
      }
    ),

    setPin: builder.mutation<SetPinResponse, SetPinDto>({
      query: (body) => ({
        url: "auth/set-pin",
        method: "POST",
        body,
      }),
    }),

    getPrimaryBusiness: builder.query<
      { status: boolean; message: string; data: any },
      void
    >({
      query: () => ({
        url: "business/primary",
        method: "GET",
      }),
    }),

    onboardBusiness: builder.mutation<
      { status: boolean; message: string; data: any },
      any
    >({
      query: (body) => ({
        url: "business/onboard",
        method: "POST",
        body,
      }),
    }),

    loginPin: builder.mutation<LoginPinResponse, LoginPinDto>({
      query: (body) => ({
        url: "auth/login",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useChangePasswordMutation,
  useSetPinMutation,
  useGetPrimaryBusinessQuery,
  useOnboardBusinessMutation,
  useLoginPinMutation,
} = authApi;
