"use client";
import { useAuthStore } from "@/stores/authStore";

import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useSetPinMutation } from "@/redux/auth";
import PinInput from "./PinInput";
import useToastStore from "@/stores/toastStore";

type ElectronAPI = {
  savePinHash: (pin: string) => Promise<void>;
};

const getElectronAPI = (): ElectronAPI | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { electronAPI?: ElectronAPI };
  return w.electronAPI ?? null;
};

const SetUpPin = () => {
  const navigate = useNavigate();
  const pin = useAuthStore((state) => state.pin);
  const [setPin] = useSetPinMutation();
  const { showToast } = useToastStore();

  // Toast state for onboarding

  const handlePinSetUp = async () => {
    if (pin.length >= 4) {
      try {
        console.log("Setting PIN:", pin); // Debug log
        const response = await setPin({ pin }).unwrap();

        console.log("SetUserPin response:", response);

        // Save PIN hash locally for offline login
        const api = getElectronAPI();
        if (api) {
          await api.savePinHash(pin);
        }

        showToast(
          "success",
          "PIN setup successful",
          "PIN setup successful, please sign in"
        );
        navigate("/dashboard");
      } catch (error) {
        console.error("PIN setup error:", error);
        showToast(
          "error",
          "PIN setup failed",
          (error as Error).message || "An unexpected error occurred"
        );
      }
    }
  };

  return (
    <>
      <h3 className="text-[#1E1E1E] text-[26px] font-bold mt-6 mb-4 text-center">
        Create a <span className="text-[#15BA5C]">Pin</span>
      </h3>
      <h4 className="text-center text-xl font-medium text-[#1E1E1E] my-3">
        Create a 4-digit Pin you can easily remember
      </h4>
      <div className="flex flex-col gap-4">
        <PinInput
          onSubmitPin={handlePinSetUp}
          onPinChange={(pin) => console.log("Current PIN:", pin)}
          showToggleVisibility={true}
        />

        <button
          onClick={handlePinSetUp}
          className="bg-[#15BA5C] rounded-xl py-3 font-bold text-[#FFFFFF]"
          type="button"
        >
          Create Pin
        </button>
      </div>
    </>
  );
};

export default SetUpPin;
