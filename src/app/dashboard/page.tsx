/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, LogOut } from "lucide-react";
import AssetsFiles from "@/assets";
import { useAuthStore } from "@/stores/authStore";
import { performLogout } from "@/services/authSession";

const DashboardCard = ({
  icon: Icon,
  title,
  badge,
  onClick,
  available = true,
  // Custom styling props for the card
  cardClassName = "",
  iconContainerClassName = "",
  // iconClassName = "",
  titleClassName = "",
  buttonClassName = "",
  buttonIconClassName = "",
  // Custom styling props for the badge (commented out the badge render itself)
  badgeContainerClassName = "",
  badgeImageClassName = "",
  badgeTextClassName = "",
}: {
  icon: any;
  title: string;
  badge?: string;
  onClick?: () => void;
  available?: boolean;
  cardClassName?: string;
  iconContainerClassName?: string;
  iconClassName?: string;
  titleClassName?: string;
  buttonClassName?: string;
  buttonIconClassName?: string;
  badgeContainerClassName?: string;
  badgeImageClassName?: string;
  badgeTextClassName?: string;
}) => (
  <div
    className={`bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all ${
      available ? "cursor-pointer" : "cursor-not-allowed opacity-75"
    } ${cardClassName}`}
    onClick={available ? onClick : undefined}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div
          className={`w-12 h-12  rounded-xl flex items-center justify-center mb-4 ${iconContainerClassName}`}
        >
          {/* <Icon className={`w-6 top-10 h-6 text-green-500 ${iconClassName}`} /> */}
          <img
            src={Icon?.src || Icon}
            width={40}
            height={40}
            alt={title}
            className={`h-7 w-auto text-green-100 ${badgeImageClassName}`}
          />
        </div>
        <h3 className={`text-lg font-semibold text-gray-800 ${titleClassName}`}>
          {title}
        </h3>
        {badge && (
          // DON'T REMOVE THIS SECTION - Badge rendering (can be styled via props)
          <div
            className={`mt-3 relative inline-block ${badgeContainerClassName}`}
          >
            <img
              src={(AssetsFiles.csbadge as any).src || AssetsFiles.csbadge}
              alt={badge}
              className={`h-7 w-auto ${badgeImageClassName}`}
            />
            <span
              className={`absolute inset-0 flex items-center justify-center text-white text-md font-medium ${badgeTextClassName}`}
            >
              {badge}
            </span>
          </div>
        )}
      </div>
      {available && (
        <div className="pt-10">
          <button
            title="Arror right"
            className={`w-10 h-10 rounded-full border-2 border-green-500 flex items-center justify-center hover:bg-green-50 transition-colors ${buttonClassName}`}
          >
            <ArrowRight
              className={`w-5 h-5 text-green-500 ${buttonIconClassName}`}
            />
          </button>
        </div>
      )}
    </div>
  </div>
);

const Dashboard = () => {
  const { user: userData } = useAuthStore();
  const navigate = useNavigate();
  const [currentPath, setCurrentPath] = useState("/dashboard");
  const [peers, setPeers] = useState<
    Array<{ deviceId: string; host: string; port: number; lastSeen: number }>
  >([]);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as unknown as {
      electronAPI?: {
        getPeers: () => Promise<any[]>;
        onPeers: (cb: (list: any[]) => void) => () => void;
        onP2PMessage: (cb: (payload: any) => void) => () => void;
      };
    };
    const api = w.electronAPI;
    if (!api) return;

    (async () => {
      try {
        const list = await api.getPeers();
        setPeers(list || []);
        setLogs((prev) =>
          [`Discovered ${list?.length || 0} peer(s)`, ...prev].slice(0, 100)
        );
      } catch {}
    })();

    const offPeers = api.onPeers((list) => {
      setPeers(list || []);
      setLogs((prev) =>
        [`Peers updated: ${list?.length || 0}`, ...prev].slice(0, 100)
      );
    });

    const offMsg = api.onP2PMessage((payload) => {
      setLogs((prev) => [`Message from peer`, ...prev].slice(0, 100));
      try {
        console.log("p2p:message", payload);
      } catch {}
    });

    return () => {
      offPeers && offPeers();
      offMsg && offMsg();
    };
  }, []);

  const menuItems = [
    {
      icon: AssetsFiles.dashboard,
      title: "Dashboard",
      path: "/dashboard",
      available: true,
    },
    {
      icon: AssetsFiles.product,
      title: "Product Management",
      path: "/dashboard/product-management",
      available: true,
    },
    /*     {
      icon: AssetsFiles.PreIcon,
      title: "Pre-Order",
      path: "/pre-order",
      available: true,
    }, */
    {
      icon: AssetsFiles.cardpos,
      title: "Point of Sale (POS)",
      path: "/pos",
      available: true,
    },
    {
      icon: AssetsFiles.productionbelt,
      title: "Production Management",
      path: "/production",
      available: true,
    },
    {
      icon: AssetsFiles.noodlebowl,
      title: "Receipt Management",
      path: "/receipt-management",
      badge: "Coming Soon",
      available: false,
      // Example badge custom styles (optional)
      // badgeContainerClassName: "mt-4",
      // badgeImageClassName: "h-8",
      // badgeTextClassName: "text-sm font-bold"
    },
    {
      icon: AssetsFiles.inventory,
      title: "Inventory",
      path: "/inventory",
      // badge: "Coming Soon",
      available: true,
    },
    /*    {
      icon: AssetsFiles.ProductionIcon,
      title: "Production Module",
      path: "/production",
      available: true,
    },
    {
      icon: AssetsFiles.ProductManagementIcon,
      title: "Product Management",
      path: "/product-management",
      available: true,
    }, */
    {
      icon: AssetsFiles.analytics,
      title: "Report & Analysis",
      path: "/report-analysis",
     // badge: "Coming Soon",
      available: true,
    },
    {
      icon: AssetsFiles.phusers,
      title: "Roles & Permissions",
      path: "/roles-permissions",
      badge: "Coming Soon",
      available: false,
    },
    {
      icon: AssetsFiles.settings,
      title: "Settings",
      path: "/dashboard/settings",
      available: true,
    },
    // {
    //   icon: AssetsFiles.DistributionIcon,
    //   title: "Distribution",
    //   path: "/distribution",
    //   badge: "Coming Soon",
    //   available: false,
    // },
    {
      icon: AssetsFiles.rocket,
      title: "Upgrade",
      path: "/upgrade",
      badge: "Coming Soon",
      available: false,
    },
  ] as Array<{
    icon: any;
    title: string;
    path: string;
    available: boolean;
    badge?: string;
    cardClassName?: string;
    iconContainerClassName?: string;
    iconClassName?: string;
    titleClassName?: string;
    buttonClassName?: string;
    buttonIconClassName?: string;
    badgeContainerClassName?: string;
    badgeImageClassName?: string;
    badgeTextClassName?: string;
  }>;

  const handleNavigation = (path: any) => {
    setCurrentPath(path);
    navigate(path);
  };

  const handleLogout = () => {
    performLogout(navigate);
  };
  console.log(peers, "This are the connected peers");
  console.log(logs, "This are the logs");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white p-4 mb-6 rounded-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-5">
              <div className="relative">
                <div className="h-20 w-20 bg-black rounded-full flex items-center justify-center">
                  <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="h-4 w-4 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  Welcome {userData?.name || "User"} 👋
                </h1>
                <p className="text-gray-500 text-lg">View your Menu Options</p>

                {/* User Status Info */}
                <div className="hidden flex items-center space-x-4 mt-2">
                  <span className="text-sm text-gray-500">
                    {userData?.email}
                  </span>
                  {userData?.isEmailVerified && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Email Verified
                    </span>
                  )}
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {userData?.status}
                  </span>
                </div>
              </div>
            </div>
            <div>
              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-red-400 hover:text-red-500 transition-colors"
              >
                <LogOut className="h-6 w-6" />
                <span className="text-md font-medium">Log out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-8">
          {menuItems.map((item, index) => (
            <DashboardCard
              key={index}
              icon={item.icon}
              title={item.title}
              badge={item.badge}
              available={item.available}
              onClick={() => handleNavigation(item.path)}
              // Pass through custom styling props
              cardClassName={item.cardClassName || ""}
              iconContainerClassName={item.iconContainerClassName || ""}
              iconClassName={item.iconClassName || ""}
              titleClassName={item.titleClassName || ""}
              buttonClassName={item.buttonClassName || ""}
              buttonIconClassName={item.buttonIconClassName || ""}
              badgeContainerClassName={item.badgeContainerClassName || ""}
              badgeImageClassName={item.badgeImageClassName || ""}
              badgeTextClassName={item.badgeTextClassName || ""}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
