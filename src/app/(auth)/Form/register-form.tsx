"use client";
import { BriefcaseBusiness, Eye, EyeOff, Mail, User } from "lucide-react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AssetsFiles from "@/assets";

import { useRouter } from "next/navigation";
import {
  PasswordStrengthMeter,
  getStrength,
  getStrengthLabel,
} from "./AuthForm";
import authService from "@/services/authService";
import { tokenManager } from "@/utils/tokenManager";
import { useAuthStore } from "@/stores/authStore";
import useToastStore from "@/stores/toastStore";
import { userStorage } from "@/services/userStorage";
import { COOKIE_NAMES, setCookie } from "@/utils/cookiesUtils";

export const signupSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{6,}$/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
});

export type SignupFormValues = z.infer<typeof signupSchema>;

interface RegistrationFormProps {
  onToggleMode: () => void;
}

export const RegistrationForm = ({ onToggleMode }: RegistrationFormProps) => {
  const router = useRouter();
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [accepted, setAccepted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const { showToast } = useToastStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const strength = getStrengthLabel(getStrength(password));

  const handleSignup = async (data: SignupFormValues) => {
    setIsLoading(true);
    try {
      const response = await authService.signup({
        businessName: data.businessName,
        fullName: data.fullName,
        email: data.email,
        password: data.password,
      });

      // const { user:{} } = response.data;
      const user = {
        businessName: data.businessName,
        fullName: data.fullName,
        email: data.email,
        password: data.password,
      };

      // Persist minimal registration info for verification step
      setCookie(COOKIE_NAMES.REG_USER_EMAIL, {
        email: user.email,
        name: user.fullName,
      });

      // Optionally persist user in local DB, but don't mark as authenticated yet
      await userStorage.saveUserFromApi(user);

      showToast(
        "success",
        "Sign up successful",
        "Please verify your email to continue."
      );

      router.push("/verify/");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unable to sign up.";
      showToast("error", "Sign up failed", message);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: SignupFormValues) => {
    await handleSignup(data);
  };

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full flex flex-col gap-[24px]"
    >
      {/* Business Name */}
      <div
        className={`flex items-center border rounded-xl p-4 w-full ${
          errors.businessName ? "border-red-400" : "border-[#E6E6E6]"
        }`}
      >
        <BriefcaseBusiness className="text-[#1E1E1E]" />
        <span className="h-[30px] w-0.5 bg-[#E6E6E6] mx-1.5"></span>
        <div className="flex flex-col w-full">
          <label className="text-sm text-[#898989] mb-1">Business Name</label>
          <input
            type="text"
            placeholder="Enter Business Name"
            className="text-[#1E1E1E] text-base font-medium focus:outline-none"
            {...register("businessName")}
          />
          {errors.businessName && (
            <p className="text-red-500 text-sm mt-1">
              {errors.businessName.message}
            </p>
          )}
        </div>
      </div>

      {/* Full Name */}
      <div
        className={`flex items-center border ${
          errors.fullName ? "border-red-400" : "border-[#E6E6E6]"
        } rounded-xl p-4 w-full`}
      >
        <User className="text-[#1E1E1E]" />
        <span className="h-[30px] w-0.5 bg-[#E6E6E6] mx-1.5"></span>
        <div className="flex flex-col w-full">
          <label className="text-sm text-[#898989] mb-1">
            Representative Fullname
          </label>
          <input
            type="text"
            placeholder="Enter Full Name"
            className="text-[#1E1E1E] text-base font-medium focus:outline-none"
            {...register("fullName")}
          />
          {errors.fullName && (
            <p className="text-red-500 text-sm mt-1">
              {errors.fullName.message}
            </p>
          )}
        </div>
      </div>

      {/* Email */}
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
            className="text-[#1E1E1E] text-base font-medium focus:outline-none"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>
      </div>

      {/* Password */}
      <div
        className={`flex items-center border ${
          errors.password ? "border-red-400" : "border-[#E6E6E6]"
        } rounded-xl p-4 w-full relative`}
      >
        <Image src={AssetsFiles.PasswordIcon} alt="Password Icon" />
        <span className="h-[30px] w-0.5 bg-[#E6E6E6] mx-1.5"></span>
        <div className="flex flex-col w-full relative">
          <label className="text-sm text-[#898989] mb-1">Create Password</label>
          <input
            type={showPassword ? "text" : "password"}
            placeholder={showPassword ? "Enter Password" : "***************"}
            className="text-[#1E1E1E] text-base font-medium focus:outline-none pr-8"
            {...register("password")}
            onChange={(e) => setPassword(e.target.value)}
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

      {/* Password strength indicators */}
      {password && <PasswordStrengthMeter password={password} />}
      {password && (
        <p className="text-sm text-gray-600 mt-1">{strength.label}</p>
      )}

      {/* Agreement */}
      <div className="flex items-start gap-2">
        <input
          id="acceptTerms"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          type="checkbox"
          required
          className="mt-1 h-4 w-4 accent-[#15BA5C]"
        />
        <label htmlFor="acceptTerms" className="text-sm text-gray-600">
          By checking this box, you agree to our{" "}
          <Link href="/privacy-policy" className="text-[#15BA5C] underline">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link
            href="/terms-and-conditions"
            className="text-[#15BA5C] underline"
          >
            Terms & Conditions
          </Link>
          .
        </label>
      </div>

      {/* Submit Button */}
      <button
        className={`text-white font-bold text-xl py-3.5 rounded-[10px] transition-colors ${
          isLoading || !accepted
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-[#15BA5C] hover:bg-[#13a551]"
        }`}
        type="submit"
        disabled={isLoading || !accepted}
      >
        {isLoading ? "Loading..." : "Sign Up"}
      </button>

      {/* Sign up/Sign in toggle */}
      <div className="">
        <p className="text-sm text-gray-500 text-center">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onToggleMode}
            className="text-[#15BA5C] font-semibold hover:underline"
          >
            Sign In
          </button>
        </p>
      </div>
    </motion.form>
  );
};
