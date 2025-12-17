"use client";
import { AnimatePresence } from "framer-motion";
import { RegistrationForm } from "./register-form";
import { LoginForm } from "./login-form";

type Props = {
  mode: "signin" | "signup";
  onToggleMode: () => void;
};

// Re-export password strength helpers
export const getStrength = (password: string): number => {
  let strength = 0;
  if (password.length >= 1) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  return strength;
};

interface StrengthLabel {
  label: string;
  color: string;
}

export const getStrengthLabel = (strength: number): StrengthLabel => {
  switch (strength) {
    case 0:
    case 1:
    case 2:
      return { label: "Weak Password!", color: "bg-red-500" };
    case 3:
      return { label: "Average Password", color: "bg-yellow-400" };
    case 4:
    case 5:
      return { label: "Strong Password", color: "bg-green-500" };
    default:
      return { label: "", color: "" };
  }
};

interface PasswordStrengthMeterProps {
  password: string;
}

export const PasswordStrengthMeter = ({
  password,
}: PasswordStrengthMeterProps) => {
  const strength = getStrength(password);
  const { color } = getStrengthLabel(strength);

  return (
    <div className="w-full flex space-x-1 h-2">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`flex-1 rounded transition-all duration-300 ${
            i < strength ? color : "bg-[#E6E6E6]"
          }`}
        />
      ))}
    </div>
  );
};

const AuthForm = ({ mode, onToggleMode }: Props) => {
  return (
    <AnimatePresence mode="wait">
      {mode === "signup" ? (
        <RegistrationForm onToggleMode={onToggleMode} />
      ) : (
        <LoginForm onToggleMode={onToggleMode} />
      )}
    </AnimatePresence>
  );
};

export default AuthForm;
