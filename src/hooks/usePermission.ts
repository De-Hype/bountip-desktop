import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useBusinessStore } from "@/stores/useBusinessStore";

export type PermissionAction = "VIEW" | "REPORT" | "MANAGE";

export const usePermission = () => {
  const { user: authUser, clearAuth } = useAuthStore();
  const { selectedOutlet } = useBusinessStore();
  const [userPermissions, setUserPermissions] = useState<any>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const api = (window as any).electronAPI;
        if (!api) {
          setIsLoading(false);
          return;
        }

        const userId = authUser?.id || (await api.getUser())?.id;
        if (!userId) {
          clearAuth();
          setIsLoading(false);
          return;
        }

        if (selectedOutlet?.id) {
          const businessUsers = await api.dbQuery(
            `SELECT bu.*, br.permissions as rolePermissions 
             FROM business_user bu
             LEFT JOIN business_role br ON bu.roleId = br.id
             WHERE bu.userId = ? AND bu.outletId = ? LIMIT 1`,
            [userId, selectedOutlet.id],
          );

          if (businessUsers && businessUsers.length > 0) {
            const bu = businessUsers[0];

            if (bu.accessType === "super_admin") {
              setIsSuperAdmin(true);
              setUserPermissions(null);
            } else {
              let perms = bu.permissions || bu.rolePermissions;
              if (typeof perms === "string") {
                try {
                  perms = JSON.parse(perms);
                } catch {
                  perms = null;
                }
              }
              setUserPermissions(perms);
              setIsSuperAdmin(false);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch permissions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPermissions();
  }, [selectedOutlet?.id, authUser?.id]);

  const hasPermission = useCallback(
    (key: string, action: PermissionAction = "VIEW"): boolean => {
      if (isSuperAdmin) return true;
      if (!userPermissions) return false;

      const perms = userPermissions[key];
      if (!perms) return false;

      if (perms === "MANAGE") return true;
      if (Array.isArray(perms)) {
        if (action === "VIEW")
          return perms.includes("VIEW") || perms.includes("MANAGE");
        return perms.includes(action);
      }

      return false;
    },
    [isSuperAdmin, userPermissions],
  );

  return { hasPermission, isSuperAdmin, isLoading, userPermissions };
};
