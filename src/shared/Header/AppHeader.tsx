"use client";

import { Link, useLocation, useNavigate } from "react-router-dom";
import React, { useMemo, useState } from "react";
import UserProfile from "./UserProfile";
import { X } from "lucide-react";
import { performLogout } from "@/services/authSession";
import { useAuthStore } from "@/stores/authStore";
import { useBusinessStore } from "@/stores/useBusinessStore";

const routeTitles: Record<string, string> = {
  "/dashboard/pos": "Point of Sale",
  "/dashboard": "Dashboard",
  "/dashboard/product-management": "Product Management",
  "/dashboard/product-managment/catalogue": "Product Catalogue",
  "/dashboard/product-management/basket": "Product Basket",
  "/dashboard/inventory": "Inventory Management",
  "/dashboard/customers": "Customer Management",
  "/dashboard/orders": "Order Management",
  "/dashboard/report-analysis": "Reports & Analysis",
  "/dashboard/roles-permissions": "Roles & Permissions",
  "/dashboard/settings": "Settings",
  "/dashboard/settings/customization": "General Settings",
};

const routeDescriptions: Record<string, string> = {
  "/dashboard/settings": "Manage your business and personal preferences here",
  "/dashboard/settings/customization":
    "Manage your business and personal preferences here",
  "/dashboard/report-analysis":
    "Analyze sales, performance, and key metrics for your business.",
  "/dashboard/roles-permissions":
    "Manage access level control between your staff",
};

interface Notification {
  id: string;
  customerName: string;
  orderDetails: string;
  timestamp: string;
  isRead: boolean;
}

export default function AppHeader() {
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { selectedOutlet } = useBusinessStore();

  // Notifications state
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("unread");
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      customerName: "David Blake",
      orderDetails: "3 cupcakes",
      timestamp: "5 minutes ago",
      isRead: false,
    },
    {
      id: "2",
      customerName: "Sarah Johnson",
      orderDetails: "2 chocolate cakes",
      timestamp: "10 minutes ago",
      isRead: false,
    },
    {
      id: "3",
      customerName: "Mike Wilson",
      orderDetails: "5 donuts",
      timestamp: "15 minutes ago",
      isRead: false,
    },
    {
      id: "4",
      customerName: "Emma Davis",
      orderDetails: "1 birthday cake",
      timestamp: "20 minutes ago",
      isRead: false,
    },
    {
      id: "5",
      customerName: "John Smith",
      orderDetails: "4 muffins",
      timestamp: "1 hour ago",
      isRead: true,
    },
    {
      id: "6",
      customerName: "Lisa Brown",
      orderDetails: "3 brownies",
      timestamp: "2 hours ago",
      isRead: true,
    },
  ]);

  const fullName = user?.name ?? "User";
  const logoUrl =
    (selectedOutlet as unknown as { logoUrl?: string } | null)?.logoUrl || "";

  // Notifications counts
  const allCount = notifications.length;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const displayedNotifications =
    activeTab === "all"
      ? notifications
      : notifications.filter((n) => !n.isRead);

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setNotifications(
      notifications.map((n) =>
        n.id === notification.id ? { ...n, isRead: true } : n,
      ),
    );
  };

  //const handleLogOut = () => performLogout(router);

  const closeModal = () => {
    setSelectedNotification(null);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
  };

  const pageTitle = useMemo(() => {
    if (routeTitles[pathname]) {
      return routeTitles[pathname];
    }

    const matchedRoute = Object.keys(routeTitles).find(
      (route) => pathname.startsWith(route) && route !== "/",
    );

    if (matchedRoute) {
      return routeTitles[matchedRoute];
    }

    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0) {
      return segments[segments.length - 1]
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }

    return "Dashboard";
  }, [pathname]);

  const headerDescription = routeDescriptions[pathname];
  const headerTitle =
    pathname === "/dashboard/settings" ? "General Settings" : pageTitle;

  return (
    <>
      <header className="bg-white px-8 py-4">
        <div className="flex items-center justify-between">
          {headerDescription ? (
            <div className="flex flex-col gap-3">
              <h1 className="text-2xl font-bold text-[#1C1B20]">
                {headerTitle}
              </h1>
              <p className="text-[16px] text-[#737373] mt-1">
                {headerDescription}
              </p>
            </div>
          ) : (
            <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
          )}

          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </Link>

            <button
              onClick={() => setIsPanelOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <UserProfile
              user={{ fullName: fullName }}
              logoUrl={logoUrl}
              logout={() => performLogout(navigate)}
            />
          </div>
        </div>
      </header>

      {/* Backdrop Overlay */}
      {isPanelOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={closePanel}
        />
      )}

      {/* Sliding Notifications Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isPanelOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 sm:p-8 border-b border-gray-100 shrink-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Notifications
            </h1>
            <button
              title="Close"
              type="button"
              onClick={closePanel}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-between px-6 sm:px-8 pt-6 pb-4 border-b border-gray-100 shrink-0">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab("all")}
                className={`pb-3 text-base sm:text-lg font-medium transition-colors relative ${
                  activeTab === "all"
                    ? "text-gray-900"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                All ({allCount})
                {activeTab === "all" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("unread")}
                className={`pb-3 text-base sm:text-lg font-medium transition-colors relative ${
                  activeTab === "unread"
                    ? "text-gray-900"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Unread ({unreadCount})
                {activeTab === "unread" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
                )}
              </button>
            </div>
            <button
              onClick={markAllAsRead}
              className="text-sm sm:text-base text-emerald-500 hover:text-emerald-600 font-medium transition-colors"
            >
              Mark all as read
            </button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
            {displayedNotifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full flex items-start gap-4 p-4 sm:p-5 rounded-2xl transition-all hover:shadow-md ${
                  notification.isRead
                    ? "bg-gray-50 hover:bg-gray-100"
                    : "bg-emerald-50 hover:bg-emerald-100"
                }`}
              >
                {/* WhatsApp Icon */}
                <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-500 flex items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    fill="white"
                    className="w-5 h-5 sm:w-6 sm:h-6"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                </div>

                {/* Content */}
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm sm:text-base font-medium text-gray-900 truncate">
                    {notification.customerName} Made an order
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    {notification.orderDetails}
                  </p>
                  <p className="text-xs sm:text-sm text-emerald-500 mt-2">
                    {notification.timestamp}
                  </p>
                </div>

                {/* Unread Indicator */}
                {!notification.isRead && (
                  <div className="shrink-0 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 mt-2" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedNotification && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-end p-4 z-60"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 sm:p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              title="Close"
              type="button"
              onClick={closeModal}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  New Order Notification
                </h2>
                <p className="text-gray-600">
                  <span className="font-semibold">
                    {selectedNotification.customerName}
                  </span>{" "}
                  has placed an order
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-1">Order Details</p>
                <p className="text-base font-medium text-gray-900">
                  {selectedNotification.orderDetails}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-1">Time</p>
                <p className="text-base font-medium text-gray-900">
                  {selectedNotification.timestamp}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-xl transition-colors">
                  View Order
                </button>
                <button
                  onClick={closeModal}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
