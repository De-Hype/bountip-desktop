"use client";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import AssetsFiles from "@/assets";

const Homepage = () => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <img
        src={AssetsFiles.LogoTwo}
        alt="Bountip"
        className="w-36 h-auto animate-pulse"
      />
    </div>
  );
};

export default Homepage;
