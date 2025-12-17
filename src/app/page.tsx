"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import AssetsFiles from "@/assets";
import Image from "next/image";
import { electronNavigate } from "@/utils/electronNavigate";

const Homepage = () => {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return;

    if (isAuthenticated) {
      electronNavigate("dashboard");
    } else {
      electronNavigate("auth");
    }
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <Image
        src={AssetsFiles.LogoTwo}
        alt="Bountip"
        priority
        className="w-36 h-auto animate-pulse"
      />
    </div>
  );
};

export default Homepage;
