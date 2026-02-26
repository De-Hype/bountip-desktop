/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
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
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [lockRemainingMs, setLockRemainingMs] = useState<number>(0);
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("bountip_login_lock");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { until?: number };
      if (parsed.until && parsed.until > Date.now()) {
        setLockUntil(parsed.until);
      } else {
        window.localStorage.removeItem("bountip_login_lock");
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!lockUntil) return;
    const update = () => {
      const diff = lockUntil - Date.now();
      if (diff <= 0) {
        setLockUntil(null);
        setFailedAttempts(0);
        setLockRemainingMs(0);
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("bountip_login_lock");
        }
      } else {
        setLockRemainingMs(diff);
      }
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [lockUntil]);

  const isLocked = lockUntil != null && lockUntil > Date.now();

  const formatRemaining = () => {
    const totalSeconds = Math.max(0, Math.floor(lockRemainingMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const mm = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const handleSignin = async (data: SigninFormValues) => {
    // Offline Login Check
    const api = (window as any).electronAPI;
    const isOffline =
      typeof navigator !== "undefined" ? !navigator.onLine : false;

    if (isOffline) {
      if (api?.verifyLoginHash) {
        try {
          const isValid = await api.verifyLoginHash(data.email, data.password);
          if (isValid) {
            const user = await api.getUser();
            if (user) {
              setAuth({
                user: {
                  id: user.id,
                  email: user.email,
                  name: user.name,
                  status: user.status,
                  isEmailVerified: user.isEmailVerified,
                },
                tokens: { accessToken: "offline", refreshToken: "offline" },
              });
              try {
                await businessService.loadAllOutlet();
              } catch {}
              navigate("/dashboard");
              return;
            }
          }
          showToast("error", "Sign in failed", "Invalid credentials (Offline)");
          return;
        } catch (err) {
          console.error("Offline login verification failed", err);
          showToast("error", "Sign in failed", "Offline login unavailable");
          return;
        }
      } else {
        showToast("error", "Offline", "Connect to the internet to sign in.");
        return;
      }
    }

    if (isLocked) {
      showToast(
        "error",
        "Too many attempts",
        "Account locked due to too many failed attempts. Please try again later.",
      );
      return;
    }
    setIsLoading(true);
    try {
      const response = await authService.signin({
        email: data.email,
        password: data.password,
      });

      const { tokens, user } = response.data;

      tokenManager.setTokens(tokens.accessToken, tokens.refreshToken);
      await userStorage.saveUserFromApi(user);
      setFailedAttempts(0);
      setLockUntil(null);
      setLockRemainingMs(0);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("bountip_login_lock");
      }
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

      // Save Login hash for future offline login
      const api = (window as any).electronAPI;
      if (api?.saveLoginHash) {
        api.saveLoginHash(data.email, data.password);
      }
      if (api?.saveUser) {
        api.saveUser(user);
      }

      try {
        await businessService.loadAllOutlet();
      } catch {}

      navigate("/dashboard");
    } catch (error: any) {
      console.log(error, "This is the error");

      const apiError = error as any;
      const data = apiError?.response?.data;
      const status = apiError?.response?.status;
      const backendLockMessage =
        typeof data?.message === "string" &&
        data.message.toLowerCase().includes("account locked");

      if (status === 401 && backendLockMessage) {
        const lockMs = 5 * 60 * 1000;
        const until = Date.now() + lockMs;
        setLockUntil(until);
        setFailedAttempts(0);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            "bountip_login_lock",
            JSON.stringify({ until }),
          );
        }
        showToast(
          "error",
          "Account locked",
          data?.message ??
            "Account locked due to too many failed attempts. Please try again after 5 minutes.",
        );
        return;
      }

      if (apiError?.code === "OFFLINE" || apiError?.message === "offline") {
        showToast("error", "Offline", "Connect to the internet to sign in.");
        return;
      }

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

      setFailedAttempts((prev) => {
        const next = prev + 1;
        if (next >= 5) {
          const lockMs = 5 * 60 * 1000;
          const until = Date.now() + lockMs;
          setLockUntil(until);
          if (typeof window !== "undefined") {
            window.localStorage.setItem(
              "bountip_login_lock",
              JSON.stringify({ until }),
            );
          }
          showToast(
            "error",
            "Account locked",
            "Account locked due to too many failed attempts. Please try again after 5 minutes.",
          );
          return 0;
        }
        return next;
      });

      const message = (error as Error).message || "Unable to sign in.";
      showToast("error", "Sign in failed", message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Offline Login Check
    const api = (window as any).electronAPI;
    const isOffline =
      typeof navigator !== "undefined" ? !navigator.onLine : false;

    if (isOffline) {
      if (api?.verifyPinHash) {
        try {
          const isValid = await api.verifyPinHash(pin);
          if (isValid) {
            // Get cached user and tokens if possible, or just user
            // Ideally we need tokens to be authenticated, but offline we might just need user data
            // For now, let's try to load user from DB
            const user = await api.getUser();
            if (user) {
              setAuth({
                user: {
                  id: user.id,
                  email: user.email,
                  name: user.name,
                  status: user.status,
                  isEmailVerified: user.isEmailVerified,
                },
                tokens: { accessToken: "offline", refreshToken: "offline" }, // Mock tokens
              });
              try {
                // Try to load cached data
                await businessService.loadAllOutlet();
              } catch {}
              navigate("/dashboard/");
              return;
            }
          }
          showToast("error", "Sign in failed", "Invalid PIN (Offline)");
          return;
        } catch (err) {
          console.error("Offline PIN verification failed", err);
          showToast("error", "Sign in failed", "Offline login unavailable");
          return;
        }
      } else {
        showToast("error", "Offline", "Connect to the internet to sign in.");
        return;
      }
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

      // Save PIN hash for future offline login
      const api = (window as any).electronAPI;
      if (api?.savePinHash) {
        api.savePinHash(pin);
      }
      if (api?.saveUser) {
        api.saveUser(user);
      }

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
    if (isLocked) return true;
    return false;
  };

  const getSubmitButtonText = () => {
    if (isLoading) return "Loading...";
    if (isLocked) return `Locked (${formatRemaining()})`;

    return "Sign In";
  };

  return (
    <motion.form
      onSubmit={pinLogin ? handlePinLogin : handleSubmit(handleSignin)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="relative w-full flex flex-col gap-[24px]"
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

      {isLocked && (
        <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-3 rounded-[12px]">
          <div className="flex items-center gap-2 text-red-600 text-lg font-semibold">
            <LockKeyhole />
            <span>Account Locked</span>
          </div>
          <p className="text-sm text-gray-600 text-center max-w-xs">
            Account locked due to too many failed attempts. Please try again
            after 5 minutes.
          </p>
          <p className="text-base font-mono text-gray-800">
            Time remaining: {formatRemaining()}
          </p>
        </div>
      )}
    </motion.form>
  );
};
