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
import { COOKIE_NAMES } from "@/utils/cookiesUtils";
import { useLoginPinMutation } from "@/redux/auth";
import { useNetworkStore } from "@/stores/useNetworkStore";
import useBusinessStore from "@/stores/useBusinessStore";

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
  const { isOnline } = useNetworkStore();
  const [loginPin] = useLoginPinMutation();
  const fetchBusinessData = useBusinessStore(
    (state) => state.fetchBusinessData,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SigninFormValues>({
    resolver: zodResolver(signinSchema),
  });

  useEffect(() => {
    const checkLock = async () => {
      const api = (window as any).electronAPI;
      if (!api?.cacheGet) return;

      const raw = await api.cacheGet("bountip_login_lock");
      if (!raw) return;

      try {
        const parsed = raw as { until?: number };
        if (parsed.until && parsed.until > Date.now()) {
          setLockUntil(parsed.until);
        } else {
          api.cacheDelete("bountip_login_lock");
        }
      } catch {}
    };
    checkLock();
  }, []);

  useEffect(() => {
    if (!lockUntil) return;
    const update = async () => {
      const diff = lockUntil - Date.now();
      if (diff <= 0) {
        setLockUntil(null);
        setFailedAttempts(0);
        setLockRemainingMs(0);
        const api = (window as any).electronAPI;
        if (api?.cacheDelete) {
          await api.cacheDelete("bountip_login_lock");
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
    const api = (window as any).electronAPI;

    // 1. Stage 1: Try Local/Offline Login First
    // Verify the inputted email+password with the email + password hash we have on the localdb.
    if (api?.verifyLoginHash && api?.getUser) {
      try {
        const isValid = await api.verifyLoginHash(data.email, data.password);
        const localUser = await api.getUser();

        // If it is a match (valid password AND matches the local user's email), log them in.
        if (
          isValid &&
          localUser &&
          localUser.email.toLowerCase() === data.email.toLowerCase()
        ) {
          setAuth({
            user: {
              id: localUser.id,
              email: localUser.email,
              name: localUser.name,
              status: localUser.status,
              isEmailVerified: localUser.isEmailVerified,
            },
            tokens: { accessToken: "offline", refreshToken: "offline" },
          });

          const state = (window.history.state as any)?.usr?.state as {
            from?: string;
          } | null;
          navigate(state?.from || "/dashboard");
          return;
        }
      } catch (err) {
        console.warn("Local hash verification failed", err);
      }
    }

    // 2. Stage 2: If it is not a match, check the online status.
    if (!isOnline) {
      // If the system is not online, tell them an error.
      showToast(
        "error",
        "Offline Login Failed",
        "Invalid credentials or connection required to log in as a different user.",
      );
      return;
    }

    // 3. Stage 3: If the system is online, use the login api.
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
      // Check if we are switching users to trigger data wipe
      const localUserBefore = await api?.getUser?.();
      const isSwitchingUser =
        localUserBefore &&
        localUserBefore.email &&
        localUserBefore.email.toLowerCase() !== data.email.toLowerCase();

      // If switching users, flush any pending syncs and wipe data first
      if (isSwitchingUser && api?.flushSync && api?.wipeData) {
        try {
          await api.flushSync();
        } catch (err) {
          console.error("Failed to flush sync before user switch", err);
        }
        await api.wipeData();
      }

      const response = await authService.signin({
        email: data.email,
        password: data.password,
      });

      const { tokens, user } = response.data;

      // If it comes back as a good response on the api, use the new details
      // Wipe data again to ensure clean state for the new user
      if (isSwitchingUser && api?.wipeData) {
        await api.wipeData();
      }

      tokenManager.setTokens(tokens.accessToken, tokens.refreshToken);
      setFailedAttempts(0);
      setLockUntil(null);
      setLockRemainingMs(0);
      if (api?.cacheDelete) {
        await api.cacheDelete("bountip_login_lock");
      }

      // Save user data to local DB
      await userStorage.saveUserFromApi(user);

      // Save Login hash for future local/offline logins
      if (api?.saveLoginHash) {
        await api.saveLoginHash(data.email, data.password);
      }

      // Update auth state
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

      // 4. Fetch the sync of the logged in user
      if (api?.triggerSync) {
        // Force a full pull for new users/switched users to ensure all data is fetched
        await api.triggerSync(isSwitchingUser);
      }

      // 5. Verification and Navigation
      const checkOnboardingStatus = async (retries = 5, delay = 2000) => {
        for (let i = 0; i < retries; i++) {
          const [outlets, businesses] = await Promise.all([
            api?.getOutlets?.() || [],
            api?.getBusinesses?.() || [],
          ]);
          if (outlets.length > 0 && businesses.length > 0) {
            return { hasOutlets: true, hasBusiness: true };
          }
          if (i < retries - 1)
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
        const [fo, fb] = await Promise.all([
          api?.getOutlets?.() || [],
          api?.getBusinesses?.() || [],
        ]);
        return { hasOutlets: fo.length > 0, hasBusiness: fb.length > 0 };
      };

      const status = await checkOnboardingStatus();
      await fetchBusinessData();

      if (!status.hasBusiness || !status.hasOutlets) {
        navigate("/onboarding");
        return;
      }

      const state = (window.history.state as any)?.usr?.state as {
        from?: string;
      } | null;
      navigate(state?.from || "/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      const apiError = error as any;
      const data = apiError?.response?.data;
      const status = apiError?.response?.status;

      if (
        status === 401 &&
        data?.message?.toLowerCase().includes("account locked")
      ) {
        const lockMs = 5 * 60 * 1000;
        const until = Date.now() + lockMs;
        setLockUntil(until);
        setFailedAttempts(0);
        if (api?.cachePut) api.cachePut("bountip_login_lock", { until });
        showToast("error", "Account locked", data?.message);
        return;
      }

      if (apiError.message === "INACTIVE_ACCOUNT") {
        const userName = apiError.response?.data?.name;
        const userEmail = apiError.response?.data?.email;
        showToast("error", "Account Inactive", "Please verify your email.");
        navigate(
          `/verify?name=${encodeURIComponent(userName)}&email=${encodeURIComponent(userEmail)}`,
        );
        return;
      }

      setFailedAttempts((prev) => {
        const next = prev + 1;
        if (next >= 5) {
          const lockMs = 5 * 60 * 1000;
          const until = Date.now() + lockMs;
          setLockUntil(until);
          if (api?.cachePut) api.cachePut("bountip_login_lock", { until });
          showToast("error", "Account locked", "Too many failed attempts.");
          return 0;
        }
        return next;
      });

      showToast(
        "error",
        "Sign in failed",
        (error as Error).message || "Unable to sign in.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Offline Login Check
    const electronApi = (window as any).electronAPI;

    let email = "";
    if (electronApi?.cacheGet) {
      email = await electronApi.cacheGet(COOKIE_NAMES.TOKEN_USER_EMAIL);
    }

    if (!isOnline) {
      if (electronApi?.verifyPinHash && email) {
        try {
          const isValid = await electronApi.verifyPinHash(email, pin);
          if (isValid) {
            // Get cached user and tokens if possible, or just user
            // Ideally we need tokens to be authenticated, but offline we might just need user data
            // For now, let's try to load user from DB
            const user = await electronApi.getUser();
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
      if (electronApi?.savePinHash && email) {
        await electronApi.savePinHash(email, pin);
      }
      if (electronApi?.saveUser) {
        await electronApi.saveUser(user);
      }

      // Check if there is a 'from' path in location state
      const state = (window.history.state as any)?.usr?.state as {
        from?: string;
      } | null;
      if (state?.from) {
        navigate(state.from);
      } else {
        navigate("/dashboard/");
      }
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
    if (pinLogin && pin.length < 4) return true;
    return false;
  };

  const getSubmitButtonText = () => {
    if (isLoading) return "Loading...";
    if (isLocked) return `Locked (${formatRemaining()})`;

    return pinLogin ? "Sign In with PIN" : "Sign In";
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
