import React from "react";
import { usePermission, type PermissionAction } from "@/hooks/usePermission";

interface PermissionGuardProps {
  permissionKey: string;
  action?: PermissionAction;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * PermissionGuard conditionally renders its children based on the current user's permissions.
 * 
 * @param permissionKey - The key identifying the feature (e.g., "pos", "inventory")
 * @param action - The required action level ("VIEW", "REPORT", "MANAGE"). Defaults to "VIEW".
 * @param children - UI elements to show if authorized
 * @param fallback - UI elements to show if NOT authorized (optional)
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permissionKey,
  action = "VIEW",
  children,
  fallback = null,
}) => {
  const { hasPermission, isLoading } = usePermission();

  if (isLoading) return null;

  if (hasPermission(permissionKey, action)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

export default PermissionGuard;
