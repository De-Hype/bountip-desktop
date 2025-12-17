/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import AssetsFiles from "@/assets";

import {
  BadgeCheck,
  Eye,
  EyeOff,
  Fingerprint,
  Mail,
  MailOpen,
  Loader2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import React, { useState, useRef, Suspense } from "react";
import {
  getStrength,
  getStrengthLabel,
  PasswordStrengthMeter,
} from "../Form/AuthForm";
import useToastStore from "@/stores/toastStore";
import authService from "@/services/authService";
import {
  COOKIE_NAMES,
  getCookie,
  setCookie,
  deleteCookie,
} from "@/utils/cookiesUtils";

const ResetPasswordPageContent = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>(() => {
    const v = getCookie<string | { email?: string }>(
      COOKIE_NAMES.RESET_USER_EMAIL
    );
    return typeof v === "string" ? v : v?.email || "";
  });
  const [resetOtp, setResetOtp] = useState<string>("");

  // Use local state for step instead of URL query param
  const [step, setStep] = useState<string>("forgot");

  // Helper to navigate to a step
  const goToStep = (newStep: string) => {
    setStep(newStep);
  };

  // Helper to show toast notifications

  return (
    <section className="max-h-screen h-screen">
      <div className="flex items-center justify-between px-5">
        <img
          src={(AssetsFiles.LogoTwo as any).src || AssetsFiles.LogoTwo}
          alt="Logo"
        />
        <section className="flex items-center gap-1.5">
          <p className="text-base">Remember Password?</p>
          <Link className="text-[#15BA5C] text-base" to="/auth">
            Sign in here
          </Link>
        </section>
      </div>
      <div className="my-6 flex items-center justify-center">
        {step === "forgot" && (
          <ForgotPassword
            onNext={() => goToStep("otp")}
            onEmailSaved={(e) => setEmail(e)}
          />
        )}
        {step === "otp" && (
          <OtpInput
            email={email}
            onNext={() => goToStep("create")}
            onOtpVerified={(o) => setResetOtp(o)}
          />
        )}
        {step === "create" && (
          <CreateNewPassword
            email={email}
            otp={resetOtp}
            onNext={() => {
              deleteCookie(COOKIE_NAMES.RESET_USER_EMAIL);
              setTimeout(() => goToStep("success"), 500);
            }}
          />
        )}
        {step === "success" && <PasswordResetSuccessful />}
      </div>

      {/* Toast Notifications */}
    </section>
  );
};

const ResetPasswordPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordPageContent />
    </Suspense>
  );
};

export default ResetPasswordPage;

function ForgotPassword({
  onNext,
  onEmailSaved,
}: {
  onNext: () => void;
  onEmailSaved: (email: string) => void;
}) {
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { showToast } = useToastStore();

  const handleForgotPassword = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email) {
      setIsLoading(false);
      return;
    }

    try {
      if (!navigator.onLine) {
        showToast("error", "Offline", "Connect to the internet.");
        setIsLoading(false);
        return;
      }
      await authService.forgotPassword({ email });
      setCookie(COOKIE_NAMES.RESET_USER_EMAIL, email, 1);
      onEmailSaved(email);
      showToast("success", "Code sent", "Reset code sent to your email.");
      setIsLoading(false);
      onNext();
    } catch (error) {
      console.error("Error sending forgot password:", error);
      const msg = (error as any)?.message || "Failed to send reset code.";
      showToast("error", "Request failed", msg);
      setIsLoading(false);
    }
  };

  return (
    <form className="flex flex-col justify-between items-center w-3/4 h-[75vh]">
      <div className="flex flex-col items-center justify-center w-full grow gap-4">
        <div className="bg-[#15BA5C] px-5 py-3 rounded-xl">
          <Fingerprint className="text-white" />
        </div>
        <h3 className="text-xl text-center text-[#1E1E1E] font-bold">
          Forgot Password
        </h3>
        <p className="text-center">Enter your email for instructions</p>
        <div className="flex items-center border border-[#E6E6E6] rounded-xl p-4 w-full">
          <Mail className="text-[#1E1E1E]" />
          <span className="h-[30px] w-0.5 bg-[#E6E6E6] mx-1.5"></span>
          <div className="flex flex-col w-full">
            <label className="text-sm text-[#898989] mb-1">Email Address</label>
            <input
              type="email"
              placeholder="Enter Email"
              className="text-[#1E1E1E] text-base font-medium focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
      <button
        onClick={handleForgotPassword}
        className="bg-[#15BA5C] text-white font-bold text-xl py-3.5 rounded-[10px] hover:bg-[#13a551] w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Sending Code...
          </>
        ) : (
          "Send 4 Digit Code"
        )}
      </button>
    </form>
  );
}

function OtpInput({
  email,
  onNext,
  onOtpVerified,
}: {
  email: string;
  onNext: () => void;
  onOtpVerified: (otp: string) => void;
}) {
  const { showToast } = useToastStore();
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const handleChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return; // only allow digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < otp.length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (otp.some((digit) => digit === "")) {
      setIsLoading(false);
      return;
    }

    const fullOtp = otp.join("");
    try {
      if (!navigator.onLine) {
        showToast("error", "Offline", "Connect to the internet.");
        setIsLoading(false);
        return;
      }
      // await authService.verifyResetOtp({ email, otp: fullOtp });
      onOtpVerified(fullOtp);
      showToast("success", "Code verified", "Proceed to set a new password.");
      onNext();
    } catch (error) {
      const msg = (error as any)?.message || "Invalid code.";
      showToast("error", "Verification failed", msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtpToEmail = async () => {
    setIsResending(true);
    try {
      if (!navigator.onLine) {
        showToast("error", "Offline", "Connect to the internet.");
        setIsResending(false);
        return;
      }
      await authService.forgotPassword({ email });
      showToast("success", "Code resent", "A new code was sent to your email.");
    } catch (error) {
      const msg = (error as any)?.message || "Failed to resend code.";
      showToast("error", "Resend failed", msg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col justify-between items-center w-1/2 h-[75vh]"
    >
      <div className="flex flex-col items-center justify-center w-full flex-grow gap-4">
        <div className="bg-[#15BA5C] px-5 py-3 rounded-xl">
          <MailOpen className="text-white" />
        </div>
        <h3 className="text-xl text-center text-[#1E1E1E] font-bold">
          Enter your Code
        </h3>
        <p className="text-sm text-[#1E1E1E] flex gap-1 text-center">
          We sent a code to <span className="font-bold">{email}</span>
        </p>

        <div className="flex flex-col items-center justify-center gap-4 p-4">
          <div className="flex gap-3">
            {otp.map((digit, index) => (
              <input
                title="input"
                key={index}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                ref={(el) => {
                  inputsRef.current[index] = el;
                }}
                className="w-[55px] h-14 text-center text-xl border rounded-lg focus:outline-none focus:border-[#15BA5C] border-gray-300 disabled:opacity-50"
                disabled={isLoading}
              />
            ))}
          </div>

          <p className="text-sm flex items-center text-gray-600">
            Didn&apos;t receive the email?
            <button
              type="button"
              className="text-black font-medium underline hover:text-green-600 ml-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              onClick={handleResendOtpToEmail}
              disabled={isResending}
            >
              {isResending ? (
                <>
                  <Loader2 className="animate-spin" size={12} />
                  Resending...
                </>
              ) : (
                "Click to resend"
              )}
            </button>
          </p>
        </div>
      </div>
      <button
        className="bg-[#15BA5C] text-white font-bold text-xl py-3.5 rounded-[10px] hover:bg-[#13a551] w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Verifying...
          </>
        ) : (
          "Continue"
        )}
      </button>
    </form>
  );
}

function CreateNewPassword({
  email,
  otp,
  onNext,
}: {
  email: string;
  otp: string;
  onNext: () => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const strength = getStrength(newPassword);
  const { label } = getStrengthLabel(strength);
  const { showToast } = useToastStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (!navigator.onLine) {
        showToast("error", "Offline", "Connect to the internet.");
        setIsLoading(false);
        return;
      }
      if (!newPassword || newPassword !== confirmPassword) {
        showToast("error", "Invalid input", "Passwords do not match.");
        setIsLoading(false);
        return;
      }
      if (!email || !otp) {
        showToast("error", "Missing data", "Request a code again.");
        setIsLoading(false);
        return;
      }
      await authService.resetPassword({ email, otp, newPassword });
      showToast("success", "Password updated", "You can now sign in.");
      onNext();
    } catch (error) {
      const msg = (error as any)?.message || "Failed to reset password.";
      showToast("error", "Reset failed", msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col justify-between items-center w-1/2 h-[75vh]"
    >
      <div className="flex flex-col items-center justify-center w-full flex-grow gap-4">
        <div className="bg-[#15BA5C] px-5 py-3 rounded-xl">
          <MailOpen className="text-white" />
        </div>
        <h3 className="text-xl text-center text-[#1E1E1E] font-bold">
          Set New Password
        </h3>
        <p className="text-[18px] text-[#1E1E1E] flex gap-1 text-center">
          Create a very strong Password you can remember
        </p>
        <div className="w-full flex flex-col gap-3.5">
          <div className="flex items-center border border-[#E6E6E6] rounded-xl p-4 w-full relative">
            <img
              src={
                (AssetsFiles.PasswordIcon as any).src ||
                AssetsFiles.PasswordIcon
              }
              alt="Password Icon"
            />
            <span className="h-[30px] w-0.5 bg-[#E6E6E6] mx-1.5"></span>
            <div className="flex flex-col w-full relative">
              <label className="text-sm text-[#898989] mb-1">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder={
                  showPassword ? "Enter Password" : "***************"
                }
                className="text-[#1E1E1E] text-base font-medium focus:outline-none pr-8"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute right-2 top-4 text-[#1E1E1E] cursor-pointer disabled:opacity-50"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center border border-[#E6E6E6] rounded-xl p-4 w-full relative">
            <img
              src={
                (AssetsFiles.PasswordIcon as any).src ||
                AssetsFiles.PasswordIcon
              }
              alt="Password Icon"
            />
            <span className="h-[30px] w-0.5 bg-[#E6E6E6] mx-1.5"></span>
            <div className="flex flex-col w-full relative">
              <label className="text-sm text-[#898989] mb-1">
                Confirm Password
              </label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder={
                  showConfirmPassword
                    ? "Enter Confirm Password"
                    : "***************"
                }
                className="text-[#1E1E1E] text-base font-medium focus:outline-none pr-8"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute right-2 top-4 text-[#1E1E1E] cursor-pointer disabled:opacity-50"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-4 p-4 w-full">
          {newPassword && <PasswordStrengthMeter password={newPassword} />}
          {newPassword && (
            <p className="text-sm text-gray-600 mt-1 text-left">{label}</p>
          )}
        </div>
      </div>
      <button
        className="bg-[#15BA5C] text-white font-bold text-xl py-3.5 rounded-[10px] hover:bg-[#13a551] w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Resetting Password...
          </>
        ) : (
          "Continue"
        )}
      </button>
    </form>
  );
}

function PasswordResetSuccessful() {
  const navigate = useNavigate();
  return (
    <form className="flex flex-col justify-between items-center w-1/2 h-[75vh]">
      <div className="flex flex-col items-center justify-center w-full flex-grow gap-4">
        <div className="bg-[#15BA5C] px-5 py-3 rounded-xl">
          <BadgeCheck className="text-white" />
        </div>
        <h3 className="text-xl text-center text-[#1E1E1E] font-bold">
          All Done
        </h3>
        <p className="text-sm text-[#1E1E1E] flex gap-1 text-center">
          Your Password has been reset successfully
        </p>
      </div>

      <button
        type="button"
        onClick={() => navigate("/auth")}
        className="bg-[#15BA5C] text-center text-white font-bold text-xl py-3.5 rounded-[10px] hover:bg-[#13a551] w-full"
      >
        Log in
      </button>
    </form>
  );
}
