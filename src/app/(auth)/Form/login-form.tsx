/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { tokenManager } from "@/utils/tokenManager";
import { useAuthStore } from "@/stores/authStore";
import authService from "@/services/authService";
import useToastStore from "@/stores/toastStore";
import { userStorage } from "@/services/userStorage";
import businessService from "@/services/businessService";
import AssetsFiles from "@/assets";
import PinInput from "./PinInput";
import { COOKIE_NAMES, getCookie } from "@/utils/cookiesUtils";
import { useLoginPinMutation } from "@/redux/auth";

export const signinSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{6,}$/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    ),
});

export type SigninFormValues = z.infer<typeof signinSchema>;

interface LoginFormProps {
  onToggleMode: () => void;
}

export const LoginForm = ({ onToggleMode }: LoginFormProps) => {
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [pinLogin, setPinLogin] = useState<boolean>(false);
  const [pin, setPin] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { showToast } = useToastStore();
  const [loginPin] = useLoginPinMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SigninFormValues>({
    resolver: zodResolver(signinSchema),
  });

  const handleSignin = async (data: SigninFormValues) => {
    setIsLoading(true);
    try {
      const response = await authService.signin({
        email: data.email,
        password: data.password,
      });

      const { tokens, user } = response.data;

      tokenManager.setTokens(tokens.accessToken, tokens.refreshToken);
      await userStorage.saveUserFromApi(user);
      setAuth({
        user: {
          id: user?.id,
          email: user?.email,
          name: user?.fullName,
          status: user?.status,
          isEmailVerified: user?.isEmailVerified,
        },
        tokens,
      });

      try {
        await businessService.loadAllOutlet();
      } catch {}

      navigate("/dashboard");
    } catch (error: any) {
      console.log(error, "This is the error");

      // Cast error to access response property
      const apiError = error as any;

      if (apiError.message === "INACTIVE_ACCOUNT") {
        // Access name and email from response.data
        const userName = apiError.response?.data?.name;
        const userEmail = apiError.response?.data?.email;

        console.log("User Name:", userName);
        console.log("User Email:", userEmail);

        showToast(
          "error",
          "Account Inactive",
          "Your account is inactive. Please verify your email address.",
        );

        navigate(
          `/verify?name=${encodeURIComponent(
            userName,
          )}&email=${encodeURIComponent(userEmail)}/`,
        );
        return;
      }

      const message = (error as Error).message || "Unable to sign in.";
      showToast("error", "Sign in failed", message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!navigator.onLine) {
      showToast("error", "Offline", "Connect to the internet to sign in.");
      return;
    }
    if (pin.length < 4) return;
    const emailCookie = getCookie<string | { email?: string }>(
      COOKIE_NAMES.TOKEN_USER_EMAIL,
    );
    const email =
      typeof emailCookie === "string" ? emailCookie : emailCookie?.email || "";
    if (!email) {
      showToast(
        "error",
        "PIN login unavailable",
        "Please log in with your password first.",
      );
      setPinLogin(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await loginPin({
        mode: "pin",
        email,
        passCode: pin,
      }).unwrap();
      const tokens = res.data.tokens;
      const user = res.data.user;
      tokenManager.setTokens(tokens.accessToken, tokens.refreshToken);
      await userStorage.saveUserFromApi(user);
      setAuth({
        user: {
          id: user?.id,
          email: user?.email,
          name: user?.fullName,
          status: user?.status,
          isEmailVerified: user?.isEmailVerified,
        },
        tokens,
      });
      try {
        await businessService.loadAllOutlet();
      } catch {}
      navigate("/dashboard/");
    } catch (error: any) {
      const message = error?.message || "Unable to sign in with PIN.";
      showToast("error", "Sign in failed", message);
    } finally {
      setIsLoading(false);
    }
  };

  const isSubmitDisabled = () => {
    if (isLoading) return true;
    return false;
  };

  const getSubmitButtonText = () => {
    if (isLoading) return "Loading...";

    return "Sign In";
  };

  return (
    <motion.form
      onSubmit={pinLogin ? handlePinLogin : handleSubmit(handleSignin)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full flex flex-col gap-[24px]"
    >
      {!pinLogin && (
        <div
          className={`flex items-center border ${
            errors.email ? "border-red-400" : "border-[#E6E6E6]"
          } rounded-xl p-4 w-full`}
        >
          <Mail className="text-[#1E1E1E]" />
          <span className="h-[30px] w-0.5 bg-[#E6E6E6] mx-1.5"></span>
          <div className="flex flex-col w-full">
            <label className="text-sm text-[#898989] mb-1">Email Address</label>
            <input
              type="email"
              placeholder="Enter Email"
              className="text-[#1E1E1E] text-base font-medium focus:outline-none placeholder-[#A6A6A6]"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email.message}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Password - Hide in PIN login */}
      {!pinLogin && (
        <div
          className={`flex items-center border ${
            errors.password ? "border-red-400" : "border-[#E6E6E6]"
          } rounded-xl p-4 w-full relative`}
        >
          <img src={AssetsFiles.PasswordIcon} alt="Password Icon" />
          <span className="h-[30px] w-0.5 bg-[#E6E6E6] mx-1.5"></span>
          <div className="flex flex-col w-full relative">
            <label className="text-sm text-[#898989] mb-1">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder={showPassword ? "Enter Password" : "***************"}
              className="text-[#1E1E1E] text-base font-medium focus:outline-none pr-8"
              {...register("password")}
            />
            <button
              type="button"
              className="absolute right-2 top-4 text-[#1E1E1E] cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>
        </div>
      )}

      {/* PIN login input */}
      {pinLogin && (
        <PinInput
          onSubmitPin={() => {}}
          onPinChange={(pin) => {
            setPin(pin);
          }}
          showToggleVisibility={true}
        />
      )}

      {/* Submit Button */}
      <button
        className={`text-white font-bold text-xl py-3.5 rounded-[10px] transition-colors ${
          isSubmitDisabled()
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-[#15BA5C] hover:bg-[#13a551]"
        }`}
        type="submit"
        disabled={isSubmitDisabled()}
      >
        {getSubmitButtonText()}
      </button>

      {/* Remember Me and Forgot Password - Only for regular signin */}
      {!pinLogin && (
        <div className="flex justify-end items-center">
          <Link
            to="/reset-password"
            className="text-sm text-[#15BA5C] hover:underline"
          >
            Forgot Password?
          </Link>
        </div>
      )}

      {/* Toggle PIN login button */}
      <button
        type="button"
        onClick={() => setPinLogin(!pinLogin)}
        className="flex items-center cursor-pointer justify-center gap-2 border py-3.5 rounded-[10px] border-[#E6E6E6] hover:bg-gray-50 transition-colors"
      >
        <LockKeyhole />
        <span className="text-[#1E1E1E] text-[17px] font-normal">
          {pinLogin ? "Login with Email" : "Login with PIN"}
        </span>
      </button>

      <div className="flex items-center gap-2">
        <span className="h-px flex-1 bg-[#E5E5E5]" />
        <span className="text-xs text-[#9CA3AF]">Or Continue With</span>
        <span className="h-px flex-1 bg-[#E5E5E5]" />
      </div>

      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-[12px] border border-[#E5E5E5] bg-white py-3.5 text-[15px] font-medium text-[#1E1E1E] hover:bg-gray-50 transition-colors"
      >
        <img src={AssetsFiles.GoogleIcon} alt="Google" className="h-5 w-5" />
        <span>Login with Google</span>
      </button>

      <div className="">
        <p className="text-sm text-gray-500 text-center">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={onToggleMode}
            className="text-[#15BA5C] font-semibold hover:underline"
          >
            Sign Up
          </button>
        </p>
      </div>
    </motion.form>
  );
};
