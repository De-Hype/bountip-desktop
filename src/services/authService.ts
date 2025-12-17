import httpService from "./httpService";

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
  async signup(data: SignupData) {
    return httpService.post<AuthTokensResponse>("/auth/signup", data, false);
  }

  async signin(data: SigninData) {
    return httpService.post<AuthTokensResponse>(
      "/auth/login",
      {
        email: data.email,
        passCode: data.password,
        mode: "password",
      },
      false,
      true
    );
  }

  // Verify email with OTP code
  async verifyEmail(payload: VerifyOtpPayload) {
    return httpService.post<AuthTokensResponse>(
      "/auth/verify",
      {
        email: payload.email,
        otp: payload.otp,
      },
      false
    );
  }

  // Resend email verification OTP
  async resendVerification(payload: ResendOtpPayload) {
    return httpService.post<{ status: boolean; message: string }>(
      "/auth/resend-otp",
      payload,
      false
    );
  }

  // Forgot password -> send reset OTP
  async forgotPassword(payload: ForgotPasswordPayload) {
    return httpService.post<{ status: boolean; message: string }>(
      "/auth/forgot-password",
      payload,
      false
    );
  }

  // Verify reset OTP (optional, for intermediate step)
  async verifyResetOtp(payload: VerifyResetOtpPayload) {
    return httpService.post<{ status: boolean; message: string }>(
      "/auth/verify",
      payload,
      false
    );
  }

  // Reset password with OTP + new password
  async resetPassword(payload: ResetPasswordPayload) {
    return httpService.post<{ status: boolean; message: string }>(
      "/auth/reset-password",
      payload,
      false
    );
  }
}

const authService = new AuthService();
export default authService;
