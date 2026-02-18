import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import SettingFiles from "@/assets/icons/settings";
import { COOKIE_NAMES, deleteCookie } from "@/utils/cookiesUtils";
import useToastStore from "@/stores/toastStore";

interface PasswordSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PasswordSettingsModal: React.FC<PasswordSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [requirements, setRequirements] = useState({
    minLength: false,
    hasNumber: false,
    hasSpecial: false,
  });
  const {showToast}=useToastStore()

  const handlePasswordChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (field === "newPassword") {
      setRequirements({
        minLength: value.length >= 8,
        hasNumber: /\d/.test(value),
        hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(value),
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const { currentPassword, newPassword, confirmPassword } = formData;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return showToast("error",
        "Password Update Failed!",
        "Please fill all the Password fields",
      );
    }

    if (currentPassword === newPassword) {
      return showToast(
        "error",
        "Password Update Failed!",
        "New password cannot be the same as the current password",
      );
    }

    if (newPassword !== confirmPassword) {
      return showToast(
        "error",
        "Password Update Failed!",
        "New password and confirm password do not match",
      );
    }

    // Check password requirements
    if (
      !requirements.minLength ||
      !requirements.hasNumber ||
      !requirements.hasSpecial
    ) {
      return showToast(
        "error",
        "Password Update Failed!",
        "New password must meet all requirements",
      );
    }

    setIsLoading(true);

    showToast(
      "success",
      "Password Updated Successfully!",
      "Your password has been changed. Please log in again.",
    );

    setFormData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setRequirements({
      minLength: false,
      hasNumber: false,
      hasSpecial: false,
    });

    deleteCookie(COOKIE_NAMES.BOUNTIP_LOGIN_USER);
    deleteCookie(COOKIE_NAMES.BOUNTIP_LOGIN_USER_TOKENS);

    onClose();
    setIsLoading(false);
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <Modal
      image={SettingFiles.PasswordSettingsIcon}
      isOpen={isOpen}
      onClose={onClose}
      title="Password Settings"
      subtitle="Change your password here"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Current Password */}
        <div className="relative">
          <Input
            className="w-full px-4 text-[#1C1B20] py-3 text-left bg-white border border-gray-300 rounded-lg shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#15BA5C] transition-colors"
            label="Current Password"
            type={showPasswords.current ? "text" : "password"}
            value={formData.currentPassword}
            onChange={(e) =>
              handlePasswordChange("currentPassword", e.target.value)
            }
            placeholder="Enter current password"
            disabled={isLoading}
          />
          <button
            type="button"
            className="absolute right-3 top-10 text-gray-400"
            onClick={() => togglePasswordVisibility("current")}
            disabled={isLoading}
          >
            {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {/* New Password */}
        <div className="relative">
          <Input
            className="w-full text-[#1C1B20] px-4 py-3 text-left bg-white border border-gray-300 rounded-lg shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#15BA5C] transition-colors"
            label="New Password"
            type={showPasswords.new ? "text" : "password"}
            value={formData.newPassword}
            onChange={(e) =>
              handlePasswordChange("newPassword", e.target.value)
            }
            placeholder="Enter new password"
            disabled={isLoading}
          />
          <button
            type="button"
            className="absolute right-3 top-10 text-gray-400"
            onClick={() => togglePasswordVisibility("new")}
            disabled={isLoading}
          >
            {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {/* Password Requirements */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Password Requirements:
          </h4>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  requirements.minLength ? "bg-green-500" : "bg-gray-300"
                }`}
              />
              <span className="text-sm text-[#1C1B20]">
                Password Must have 8-16 Characters long
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  requirements.hasNumber ? "bg-green-500" : "bg-gray-300"
                }`}
              />
              <span className="text-sm text-[#1C1B20]">
                Password Must have at least one number
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  requirements.hasSpecial ? "bg-green-500" : "bg-gray-300"
                }`}
              />
              <span className="text-sm text-[#1C1B20]">
                Password Must have at least one special character eg: @,#,!,?
              </span>
            </div>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="relative">
          <Input
            className="w-full text-[#1C1B20] px-4 py-3 text-left bg-white border border-gray-300 rounded-lg shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#15BA5C] transition-colors"
            label="Confirm Password"
            type={showPasswords.confirm ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={(e) =>
              handlePasswordChange("confirmPassword", e.target.value)
            }
            placeholder="Confirm new password"
            disabled={isLoading}
          />
          <button
            type="button"
            className="absolute right-3 top-10 text-gray-400"
            onClick={() => togglePasswordVisibility("confirm")}
            disabled={isLoading}
          >
            {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-[9.8px] rounded-[9.8px] font-medium transition-colors flex items-center justify-center gap-2 ${
            isLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#15BA5C] hover:bg-[#13A652] text-white cursor-pointer"
          }`}
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isLoading ? "Updating Password..." : "Update Password"}
        </button>
      </form>
    </Modal>
  );
};
