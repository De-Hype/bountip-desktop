import httpService from "./httpService";
import { userStorage } from "./userStorage";

export type SignupData = {
  businessName: string;
  fullName: string;
  email: string;
  password: string;
};

export type SigninData = {
  email: string;
  password: string;
};

export type AuthUserApi = {
  id: string;
  email: string;
  fullName: string;
  status: string;
  isEmailVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type AuthTokensResponse = {
  status: boolean;
  message: string;
  data: {
    tokens: {
      access_token: string;
      refresh_token: string;
      accessToken: string;
      refreshToken: string;
    };
    user: AuthUserApi;
  };
};

type VerifyOtpPayload = {
  email: string;
  otp: string;
};

type ResendOtpPayload = {
  email: string;
};

type ForgotPasswordPayload = {
  email: string;
};

type VerifyResetOtpPayload = {
  email: string;
  otp: string;
};

type ResetPasswordPayload = {
  email: string;
  otp: string;
  newPassword: string;
};

class AuthService {
  private async verifyLocalLogin(email: string, password: string) {
    if (typeof window === "undefined") return false;
    const w = window as unknown as {
      electronAPI?: {
        verifyLoginHash?: (email: string, password: string) => Promise<boolean>;
      };
    };
    const api = w.electronAPI;
    if (!api || !api.verifyLoginHash) return false;
    try {
      return await api.verifyLoginHash(email, password);
    } catch {
      return false;
    }
  }

  private async saveLocalLogin(email: string, password: string) {
    if (typeof window === "undefined") return;
    const w = window as unknown as {
      electronAPI?: {
        saveLoginHash?: (email: string, password: string) => Promise<void>;
      };
    };
    const api = w.electronAPI;
    if (!api || !api.saveLoginHash) return;
    try {
      await api.saveLoginHash(email, password);
    } catch {
      // ignore
    }
  }

  async signup(data: SignupData) {
    return httpService.post<AuthTokensResponse>("/auth/signup", data, false);
  }

  async signin(data: SigninData) {
    const canLoginLocally = await this.verifyLocalLogin(
      data.email,
      data.password,
    );
    if (canLoginLocally) {
      const stored = await userStorage.loadUser();
      const user = {
        id: String(stored?.id ?? ""),
        email: stored?.email ?? data.email,
        fullName: stored?.name ?? stored?.email ?? data.email,
        status: stored?.status ?? "active",
        isEmailVerified: stored?.isEmailVerified ?? true,
        createdAt: stored?.createdAt,
        updatedAt: stored?.updatedAt,
      } as AuthUserApi;

      const tokens = {
        access_token: "",
        refresh_token: "",
        accessToken: "",
        refreshToken: "",
      };

      return {
        status: true,
        message: "Logged in locally",
        data: {
          tokens,
          user,
        },
      } satisfies AuthTokensResponse;
    }

    return httpService
      .post<AuthTokensResponse>(
        "/auth/login",
        {
          email: data.email,
          passCode: data.password,
          mode: "password",
        },
        false,
        true,
      )
      .then(async (res) => {
        try {
          if (res?.data?.user) {
            await this.saveLocalLogin(data.email, data.password);
            await userStorage.saveUserFromApi(res.data.user);
          }
        } catch {}
        return res;
      });
  }

  // Verify email with OTP code
  async verifyEmail(payload: VerifyOtpPayload) {
    return httpService.post<AuthTokensResponse>(
      "/auth/verify",
      {
        email: payload.email,
        otp: payload.otp,
      },
      false,
    );
  }

  // Resend email verification OTP
  async resendVerification(payload: ResendOtpPayload) {
    return httpService.post<{ status: boolean; message: string }>(
      "/auth/resend-otp",
      payload,
      false,
    );
  }

  // Forgot password -> send reset OTP
  async forgotPassword(payload: ForgotPasswordPayload) {
    return httpService.post<{ status: boolean; message: string }>(
      "/auth/forgot-password",
      payload,
      false,
    );
  }

  // Verify reset OTP (optional, for intermediate step)
  async verifyResetOtp(payload: VerifyResetOtpPayload) {
    return httpService.post<{ status: boolean; message: string }>(
      "/auth/verify",
      payload,
      false,
    );
  }

  // Reset password with OTP + new password
  async resetPassword(payload: ResetPasswordPayload) {
    return httpService.post<{ status: boolean; message: string }>(
      "/auth/reset-password",
      payload,
      false,
    );
  }
}

const authService = new AuthService();
export default authService;
