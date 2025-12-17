"use client";
import { useNavigate, useSearchParams } from "react-router-dom";
import AssetsFiles from "@/assets";
import SetUpPin from "./SetUpPin";
import BusinessInfo from "./BusinessInfo";
import React, { useCallback } from "react";
import ConcentricArcsLayout from "./SideLanding";
import SplitedProgressBar from "./SplitedProgressBar";
import { useBusinessStore } from "@/stores/useBusinessStore";

const OnboardingClient = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { outlets } = useBusinessStore();

  const currentStep = searchParams.get("step") || "business";
  const outletId = searchParams.get("outletId") || "";
  const outlet = outlets.find((o) => o.id === outletId) as unknown as
    | {
        isOnboarded?: boolean;
      }
    | undefined;
  const skipPin = outlet && outlet.isOnboarded === false;

  const handleNextStep = useCallback(() => {
    if (skipPin) {
      navigate("/dashboard");
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", "pin");
    setSearchParams(params);
  }, [searchParams, skipPin, navigate, setSearchParams]);

  const isPinStep = !skipPin && currentStep === "pin";
  const isBusinessStep = currentStep === "business";

  return (
    <main className="flex min-h-screen">
      {/* Sticky Left Section */}
      <section className="hidden md:block bg-[#FAFAFC] w-1/3 h-screen sticky top-0">
        <BountmpLanding />
      </section>

      {/* Scrollable Right Section */}
      <section className="w-full md:w-2/3 overflow-y-auto">
        <div className="min-h-screen flex justify-center py-7">
          <div className="w-[80%]">
            {/* Sticky Progress Bar */}
            <div className="sticky top-0 bg-white z-10 py-2 mb-4">
              <SplitedProgressBar
                length={skipPin ? 1 : 2}
                filled={isPinStep ? 2 : 1}
                color="#15BA5C"
              />
            </div>

            {/* Content */}
            {isPinStep && <SetUpPin />}
            {isBusinessStep && <BusinessInfo onNext={handleNextStep} />}
          </div>
        </div>
      </section>
    </main>
  );
};

export default OnboardingClient;

// --- BountmpLanding and ProfileImage below ---

interface ProfileImageProps {
  src: any;
  alt: string;
  className?: string;
}

const ProfileImage: React.FC<ProfileImageProps> = ({
  src,
  alt,
  className = "",
}) => (
  <div
    className={`absolute w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-lg ${className}`}
  >
    <img
      src={src.src || src}
      alt={alt}
      width={64}
      height={64}
      className="w-full h-full object-cover"
    />
  </div>
);

const BountmpLanding: React.FC = () => {
  return (
    <div className="relative h-full bg-[#FAFAFC] overflow-hidden">
      <div className="absolute top-8 left-8 z-30">
        <img
          src={(AssetsFiles.LogoTwo as any).src || AssetsFiles.LogoTwo}
          alt="Bountip Logo"
        />
      </div>

      {/* ConcentricArcsLayout */}
      <div className="h-full">
        <ConcentricArcsLayout />
      </div>

      {/* Decorative dots */}
      <div className="absolute bottom-0 left-0 w-32 h-32 opacity-20 z-0">
        <div className="grid grid-cols-8 gap-1 p-4">
          {Array.from({ length: 64 }).map((_, i) => (
            <div
              key={i}
              className="w-1 h-1 bg-green-400 rounded-full"
              style={{ opacity: Math.random() * 0.5 + 0.3 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
