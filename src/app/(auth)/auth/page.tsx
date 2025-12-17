"use client";
import Image from "next/image";
import { useState, Suspense } from "react";
import AssetsFiles from "@/assets";
import AuthForm from "../Form/AuthForm";

const AuthPageContent = () => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const handleModeChange = (newMode: "signin" | "signup") => {
    setMode(newMode);
  };

  return (
    <section className="min-h-screen flex">
      <aside className="flex-1 relative min-h-screen">
        <Image
          src={AssetsFiles.AuthBgImage}
          alt="Auth pages"
          fill
          className="object-cover"
          style={{ objectPosition: "20% center" }}
        />
      </aside>

      <section className="flex-1 flex items-center justify-center my-12">
        <section className="flex items-center justify-center flex-col gap-3.5 w-[450px]">
          <Image src={AssetsFiles.LogoTwo} alt="Logo" />
          <h3 className="text-[#1E1E1E] font-bold text-[45px] mt-5">
            Welcome Back
          </h3>
          <p className="text-[#1E1E1E] text-[25px] font-light text-center">
            Welcome back, Please Enter your details
          </p>

          <div className="inline-flex font-bold bg-[#FAFAFC] w-full rounded-md p-1 my-2.5">
            <button
              onClick={() => handleModeChange("signin")}
              className={`px-4 py-2 rounded-[10px] transition-all duration-200 flex-1 ${
                mode === "signin"
                  ? "bg-white text-[#1C1B20] shadow-sm"
                  : "text-[#A6A6A6]"
              }`}
            >
              Sign In
            </button>

            <button
              onClick={() => handleModeChange("signup")}
              className={`px-4 py-2 rounded-md transition-all duration-200 flex-1 ${
                mode === "signup"
                  ? "bg-white text-black shadow-sm"
                  : "text-[#A6A6A6]"
              }`}
            >
              Sign Up
            </button>
          </div>

          <AuthForm
            mode={mode}
            onToggleMode={() =>
              handleModeChange(mode === "signin" ? "signup" : "signin")
            }
          />
        </section>
      </section>
    </section>
  );
};

const AuthPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthPageContent />
    </Suspense>
  );
};

export default AuthPage;
