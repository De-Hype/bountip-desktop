/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AssetsFiles from "@/assets";
import { ChevronDown, LogOut, User, Loader2 } from "lucide-react";
import { useBusinessStore } from "@/stores/useBusinessStore";
import { useAuthStore } from "@/stores/authStore";
import type { Outlet as BaseOutlet } from "@/services/businessService";
type OutletView = BaseOutlet & { logoUrl?: string; isOnboarded?: boolean };

interface UserProfileProps {
  user?: {
    fullName: string;
  };
  logout: () => void;
  logoUrl: string;
  onProfileClick?: () => void;
}

const UserProfile = ({
  user,
  logout,
  logoUrl,
  onProfileClick,
}: UserProfileProps) => {
  const ACTIVE_OUTLET_STORAGE_KEY = "bountip_active_outlet_id";
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    outlets,
    isLoading,
    selectedOutlet,
    selectOutlet,
    fetchBusinessData,
  } = useBusinessStore();
  const { user: authUser } = useAuthStore();
  const [activeOutletId, setActiveOutletId] = useState<string | null>(null);
  const hasSyncedFromStorage = useRef(false);
  const isInitialMount = useRef(true);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  useEffect(() => {
    fetchBusinessData();
  }, [fetchBusinessData]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isInitialMount.current) return;
    try {
      const savedId = localStorage.getItem(ACTIVE_OUTLET_STORAGE_KEY);
      if (savedId) {
        setActiveOutletId(savedId);
        selectOutlet(savedId);
      } else if (selectedOutlet?.id) {
        setActiveOutletId(selectedOutlet.id);
      }
      isInitialMount.current = false;
    } catch {}
  }, [selectedOutlet, selectOutlet]);

  const handleProfileClick = () => {
    setOpen(false);

    // If on settings page and callback provided, use it
    if (pathname === "/dashboard/settings" && onProfileClick) {
      onProfileClick();
    } else {
      // Otherwise navigate to settings
      navigate("/dashboard/settings?modal=business-info/");
    }
  };

  const outletList: OutletView[] = (outlets as OutletView[]) || [];

  // Once outlets are loaded, sync with Redux ONLY on initial load
  useEffect(() => {
    if (outletList.length === 0) return;
    if (hasSyncedFromStorage.current) return;

    const targetId = activeOutletId || selectedOutlet?.id;

    // If we have a target ID, try to match it in the outlet list
    if (targetId) {
      const matched = outletList.find((outlet) => outlet.id === targetId);
      if (matched) {
        selectOutlet(matched.id);
        if (!activeOutletId) {
          setActiveOutletId(matched.id);
        }
        hasSyncedFromStorage.current = true;
        return;
      }
    }

    // Only auto-select first outlet if there's no previous selection at all
    if (!targetId && outletList.length > 0) {
      selectOutlet(outletList[0].id);
      setActiveOutletId(outletList[0].id);
      hasSyncedFromStorage.current = true;
    }
  }, [outletList, activeOutletId, selectedOutlet, selectOutlet]);

  // Persist active outlet id to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!activeOutletId) return;
    try {
      localStorage.setItem(ACTIVE_OUTLET_STORAGE_KEY, activeOutletId);
    } catch {
      // ignore storage errors
    }
  }, [activeOutletId]);

  const handleOutletSelect = (outlet: OutletView) => {
    const needsOnboarding = !outlet.isOnboarded;
    const isCustomizationRoute =
      pathname?.startsWith("/dashboard/settings/customization") ?? false;

    setActiveOutletId(outlet.id);
    selectOutlet(outlet.id);
    setOpen(false);

    // Only force onboarding flow when we're not already on the customization page
    if (needsOnboarding && !isCustomizationRoute) {
      navigate(`/onboarding?outletId=${outlet.id}`);
    }
  };

  const activeOutlet =
    selectedOutlet ||
    outletList.find((outlet) => outlet.id === activeOutletId) ||
    null;
  const displayImage =
    (activeOutlet as OutletView | null)?.logoUrl ||
    logoUrl ||
    AssetsFiles.EmptyCart;
  const displayName = activeOutlet?.name || authUser?.name || "User";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Desktop Button */}
      <div
        onClick={() => setOpen(!open)}
        className={`hidden md:flex items-center w-[180px] h-12 bg-gray-100 rounded-full px-2 py-1.5 cursor-pointer shadow-inner hover:bg-gray-200 border border-gray-300 transition-all ${
          isLoading ? "opacity-70 cursor-not-allowed" : ""
        }`}
      >
        <div className="shrink-0 relative">
          <img
            src={
              typeof displayImage === "string"
                ? displayImage
                : (displayImage as any).src || displayImage
            }
            alt="User"
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover"
          />
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-70 rounded-full flex items-center justify-center">
              <Loader2 className="h-3 w-3 animate-spin text-gray-600" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 px-2">
          <span className="font-bold text-gray-800 text-sm truncate block">
            {isLoading ? "Loading..." : displayName}
          </span>
        </div>

        <div className="shrink-0">
          <ChevronDown
            className={`w-4 h-4 text-gray-600 transition-transform duration-300 ${
              open ? "rotate-180" : "rotate-0"
            }`}
          />
        </div>
      </div>

      {/* Mobile View */}
      <div onClick={() => setOpen(!open)} className="md:hidden cursor-pointer">
        <div className="relative">
          <img
            src={
              typeof displayImage === "string"
                ? displayImage
                : (displayImage as any).src || displayImage
            }
            alt="User"
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover"
          />
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-70 rounded-full flex items-center justify-center">
              <Loader2 className="h-3 w-3 animate-spin text-gray-600" />
            </div>
          )}
        </div>
      </div>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg ring-1 ring-gray-200 z-50 overflow-hidden">
          {/* Outlets Section */}
          <div className="py-2 max-h-[250px] overflow-y-auto border-b border-gray-100">
            {isLoading ? (
              <div className="flex items-center justify-center py-4 text-gray-500 text-sm">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                <span className="ml-2">Loading outlets...</span>
              </div>
            ) : outletList.length === 0 ? (
              <div className="px-4 py-3 text-center text-gray-500 text-sm">
                No outlets available
              </div>
            ) : (
              outletList.map((outlet) => (
                <div
                  key={outlet.id}
                  onClick={() => handleOutletSelect(outlet)}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                >
                  <span className="text-gray-700 font-medium text-sm">
                    {outlet.name}
                  </span>
                  <div
                    className={`w-3 h-3 rounded-full border-2 ${
                      outlet.id === activeOutlet?.id
                        ? "bg-green-500 border-green-500"
                        : "border-gray-300"
                    }`}
                  >
                    {outlet.id === activeOutlet?.id && (
                      <div className="w-full h-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Profile and Logout Section */}
          <ul className="py-2">
            <li
              onClick={handleProfileClick}
              className="px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">Profile</span>
            </li>
            <li
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer transition-colors text-red-600"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Logout</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
