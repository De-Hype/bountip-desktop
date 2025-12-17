"use client";
import AssetsFiles from "@/assets";
import { Mail } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { COOKIE_NAMES, getCookie, deleteCookie } from "@/utils/cookiesUtils";
import { tokenManager } from "@/utils/tokenManager";
import authService from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";
import { userStorage } from "@/services/userStorage";
import useToastStore from "@/stores/toastStore";

const OTP_LENGTH = 4;

import { electronNavigate } from "@/utils/electronNavigate";

const VerifyPage = () => {
  const { showToast } = useToastStore();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [otp, setOtp] = useState<string[]>(
    Array.from({ length: OTP_LENGTH }, () => "")
  );

  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const searchParams = useSearchParams();
  const [regContext] = useState(() => {
    const cookie = getCookie<{ email?: string; name?: string }>(
      COOKIE_NAMES.REG_USER_EMAIL
    );
    return {
      name: (searchParams.get("name") ?? cookie?.name ?? "") as string,
      email: (searchParams.get("email") ?? cookie?.email ?? "") as string,
    };
  });
  const name = regContext.name;
  const email = regContext.email;
  const firstName = name.split(" ")[0];

  const hasShownToast = useRef(false);

  useEffect(() => {
    if (!name || !email) {
      if (!hasShownToast.current) {
        showToast(
          "error",
          "Session expired",
          "Please sign up again to receive a verification email."
        );
        hasShownToast.current = true;
      }
      setTimeout(() => electronNavigate("auth"), 2000);
      return;
    }
    inputsRef.current[0]?.focus();
  }, [name, email, router, showToast]);

  if (!name || !email) {
    return null;
  }

  const getLastFilledIndex = (arr: string[]) => {
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i] !== "") return i;
    }
    return -1;
  };

  const handleChange = (value: string, index: number) => {
    // only allow single digit numeric
    if (!/^\d?$/.test(value)) return;

    setOtp((prev) => {
      const next = [...prev];
      next[index] = value;

      // if typed a digit, move focus to next empty position (or next index)
      if (value) {
        // prefer next index
        const nextIndex = Math.min(index + 1, OTP_LENGTH - 1);
        // focus the next index, but if it's already filled, focus the first empty after current
        let focusIndex = nextIndex;
        for (let i = index + 1; i < OTP_LENGTH; i++) {
          if (next[i] === "") {
            focusIndex = i;
            break;
          }
        }
        // schedule focus after state update
        setTimeout(() => {
          inputsRef.current[focusIndex]?.focus();
        }, 0);
      }

      return next;
    });
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    const key = e.key;

    // Backspace: always delete the last filled cell (stack-like)
    if (key === "Backspace") {
      e.preventDefault(); // we'll control deletion behavior explicitly

      setOtp((prev) => {
        const lastFilled = getLastFilledIndex(prev);
        if (lastFilled === -1) {
          // nothing to delete
          return prev;
        }
        const next = [...prev];
        next[lastFilled] = "";
        // focus the cleared index (after state updates)
        setTimeout(() => {
          inputsRef.current[lastFilled]?.focus();
        }, 0);
        return next;
      });
      return;
    }

    // prevent non-numeric single keys from affecting input
    if (key.length === 1 && !/^\d$/.test(key)) {
      e.preventDefault();
      return;
    }

    // Arrow navigation
    if (key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputsRef.current[index - 1]?.focus();
    } else if (key === "ArrowRight" && index < OTP_LENGTH - 1) {
      e.preventDefault();
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("Text").trim();

    if (!/^\d+$/.test(pasteData)) return;

    // Fill from left to right, but never exceed OTP_LENGTH
    const chars = pasteData.split("").slice(0, OTP_LENGTH);
    setOtp((prev) => {
      const next = [...prev];
      for (let i = 0; i < OTP_LENGTH; i++) {
        next[i] = chars[i] ?? "";
      }
      // focus the last pasted index (or last index if full)
      const focusIndex = Math.min(chars.length - 1, OTP_LENGTH - 1);
      setTimeout(() => {
        if (focusIndex >= 0) inputsRef.current[focusIndex]?.focus();
      }, 0);
      return next;
    });
  };

  const handleVerifyEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      const otpCode = otp.join("");

      const response = await authService.verifyEmail({
        email: email,
        otp: otpCode,
      });

      const { tokens, user: verifiedUser } = response.data;
      console.log();

      tokenManager.setTokens(tokens.accessToken, tokens.refreshToken);
      await userStorage.saveUserFromApi(verifiedUser);
      setAuth({
        user: {
          id: verifiedUser.id,
          email: verifiedUser.email,
          name: verifiedUser.fullName,
          status: verifiedUser.status,
          isEmailVerified: verifiedUser.isEmailVerified,
        },
        tokens,
      });

      try {
        await (
          await import("@/services/businessService")
        ).default.loadBusiness();
        await (await import("@/stores/useBusinessStore")).default
          .getState()
          .fetchBusinessData();
      } catch {}

      // Clear registration cookie now that the user is verified
      deleteCookie(COOKIE_NAMES.REG_USER_EMAIL);

      showToast(
        "success",
        "Email verified",
        "Your email has been verified successfully."
      );

      electronNavigate("onboarding");
    } catch (error: unknown) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : "Please check the code and try again.";
      showToast("error", "Invalid OTP", message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setIsResending(true);
      await authService.resendVerification({
        email: email,
      });
      showToast(
        "success",
        "OTP resent",
        "A new OTP has been sent to your email."
      );
      setOtp(Array.from({ length: OTP_LENGTH }, () => ""));
      inputsRef.current[0]?.focus();
    } catch (error) {
      console.error("[VerifyPage] ❌ Resend OTP error:", error);
      const message =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again.";
      showToast("error", "Resend failed", message);
    } finally {
      setIsResending(false);
    }
  };

  const isOtpComplete = otp.every((digit) => digit !== "");

  return (
    <main>
      <header className="flex items-center justify-center shadow-xl py-2">
        <Image src={AssetsFiles.LogoTwo} alt="Bountip logo" />
      </header>
      <section className="flex items-center justify-center">
        <form
          onSubmit={handleVerifyEmail}
          className="flex flex-col justify-between items-center w-1/2 h-[75vh]"
        >
          <div className="flex flex-col items-center justify-center w-full flex-grow gap-4">
            <Image
              src={AssetsFiles.EmailImage}
              alt="Email verification big pics"
            />
            <h3 className="text-2xl font-bold">
              Please verify your email{" "}
              <span className="text-[#15BA5C]">Address</span>
            </h3>
            <div className="w-full">
              <h4 className="font-medium text-[19px]">Dear {firstName},</h4>
              <p className="font-normal text-base text-gray-800 leading-relaxed">
                Thank you for registering with Bountip. We have sent a 4-digit
                code to{" "}
                <span className="text-[#15BA5C] break-all">{email}</span>
              </p>
            </div>
            <div className="flex flex-col items-center justify-center gap-4 p-4 w-full">
              <div className="flex gap-3 w-full">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(e.target.value, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={handlePaste}
                    ref={(el) => {
                      inputsRef.current[index] = el;
                    }}
                    className="w-full h-19 text-center text-xl border rounded-lg focus:outline-none focus:border-[#15BA5C] border-gray-300"
                    disabled={isLoading}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-600">
                Didn&apos;t receive the email?{" "}
                <button
                  type="button"
                  className={`text-black font-medium underline hover:text-green-600 ml-1 ${
                    isResending ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  onClick={handleResendOtp}
                  disabled={isResending}
                >
                  {isResending ? "Resending..." : "Click to resend OTP"}
                </button>
              </p>
            </div>
          </div>
          <button
            disabled={!isOtpComplete || isLoading}
            className={`flex items-center justify-center gap-4 bg-[#15BA5C] text-white font-bold text-xl py-3.5 rounded-[10px] hover:bg-[#13a551] w-full ${
              !isOtpComplete || isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            type="submit"
          >
            <Mail />
            <span>{isLoading ? "Verifying..." : "Verify Email"}</span>
          </button>
        </form>
      </section>
    </main>
  );
};

export default VerifyPage;
