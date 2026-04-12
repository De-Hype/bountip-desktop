import { useEffect, useMemo, useState } from "react";
import { X, RotateCcw, Download, Save } from "lucide-react";
import * as XLSX from "xlsx";
import { useBusinessStore } from "@/stores/useBusinessStore";
import useActionMenuStore from "@/stores/rolesAndPermissionStore";
import useToastStore from "@/stores/toastStore";
import RolePagesPermissions, {
  type RolePagePermission,
} from "./RolePagesPermissions";
import { Dropdown, type DropdownOption } from "@/features/settings/ui/Dropdown";

interface ManagePermissionProps {
  onSuccess?: () => void | Promise<void>;
}

const ManagePermission = ({ onSuccess }: ManagePermissionProps) => {
  const { selectedOutletId } = useBusinessStore();
  const { closeManagePermission } = useActionMenuStore();
  const { showToast } = useToastStore();

  const [dbRoles, setDbRoles] = useState<any[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [permissions, setPermissions] = useState<RolePagePermission[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  useEffect(() => {
    const fetchRoles = async () => {
      if (!selectedOutletId) return;
      setIsLoadingRoles(true);
      try {
        const rolesData = await (window as any).electronAPI.getBusinessRoles(
          selectedOutletId,
        );
        setDbRoles(rolesData || []);
      } catch (error) {
        console.error("Failed to fetch roles:", error);
        showToast("error", "Error", "Failed to fetch roles");
      } finally {
        setIsLoadingRoles(false);
      }
    };
    fetchRoles();
  }, [selectedOutletId, showToast]);

  const roleOptions: DropdownOption[] = useMemo(() => {
    return dbRoles.map((role) => ({
      value: role.id,
      label: role.name,
    }));
  }, [dbRoles]);

  const selectedRole = useMemo(() => {
    return dbRoles.find((r) => r.id === selectedRoleId);
  }, [dbRoles, selectedRoleId]);

  useEffect(() => {
    if (selectedRole) {
      let rolePerms = selectedRole.permissions || {};
      if (typeof rolePerms === "string") {
        try {
          rolePerms = JSON.parse(rolePerms);
        } catch {
          rolePerms = {};
        }
      }

      // Transform the stored format back to RolePagePermission[] for the UI
      const pageToKey: Record<string, string> = {
        Dashboard: "dashboard",
        Settings: "settings",
        "Product module": "productManagement",
        "Point of Sale": "pos",
        "Production Module": "production",
        "Report & Analysis": "reportAnalytics",
        "Roles & Permissions": "rolesPermissions",
        Inventory: "inventory",
        "Customer Management": "customerManagement",
      };

      const pages = [
        "Dashboard",
        "Settings",
        "Product module",
        "Point of Sale",
        "Production Module",
        "Report & Analysis",
        "Roles & Permissions",
        "Inventory",
        "Customer Management",
      ];

      const initialPerms = pages.map((page) => {
        const key = pageToKey[page] || page.toLowerCase();
        const perms = rolePerms[key] || [];
        return {
          page,
          canView: perms.includes("VIEW"),
          canReport: perms.includes("REPORT"),
          canManage: perms.includes("MANAGE"),
        };
      });
      setPermissions(initialPerms);
    } else {
      setPermissions([]);
    }
  }, [selectedRole]);

  const handleSave = async () => {
    if (!selectedRoleId || !selectedRole) {
      showToast("error", "Error", "Select a role to save permissions");
      return;
    }

    try {
      setIsSaving(true);

      const pageToKey: Record<string, string> = {
        Dashboard: "dashboard",
        Settings: "settings",
        "Product module": "productManagement",
        "Point of Sale": "pos",
        "Production Module": "production",
        "Report & Analysis": "reportAnalytics",
        "Roles & Permissions": "rolesPermissions",
        Inventory: "inventory",
        "Customer Management": "customerManagement",
      };

      const formattedPermissions: Record<string, string[]> = {};
      for (const p of permissions) {
        const key = pageToKey[p.page] || p.page.toLowerCase();
        const perms: string[] = [];
        if (p.canView) perms.push("VIEW");
        if (p.canReport) perms.push("REPORT");
        if (p.canManage) perms.push("MANAGE");

        if (perms.length > 0) {
          formattedPermissions[key] = perms;
        }
      }

      await (window as any).electronAPI.upsertBusinessRole({
        id: selectedRoleId,
        outletId: selectedOutletId,
        name: selectedRole.name,
        permissions: formattedPermissions,
      });

      await onSuccess?.();
      showToast("success", "Success", "Permissions updated successfully");
      closeManagePermission();
    } catch (error) {
      console.error("Failed to update permissions:", error);
      showToast("error", "Error", "Failed to update permissions");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    if (dbRoles.length === 0) {
      showToast("error", "Error", "No roles available to export");
      return;
    }

    try {
      // Prepare data for export
      const exportData = dbRoles.map((role) => {
        let perms = role.permissions || {};
        if (typeof perms === "string") {
          try {
            perms = JSON.parse(perms);
          } catch {
            perms = {};
          }
        }

        const row: Record<string, string> = {
          "Role Name": role.name,
          Version: role.version?.toString() || "0",
          "Created At": role.createdAt
            ? new Date(role.createdAt).toLocaleString()
            : "-",
        };

        // Add columns for each page
        const pages = [
          "Dashboard",
          "Settings",
          "Product module",
          "Point of Sale",
          "Production Module",
          "Report & Analysis",
          "Roles & Permissions",
          "Inventory",
          "Customer Management",
        ];

        const pageToKey: Record<string, string> = {
          Dashboard: "dashboard",
          Settings: "settings",
          "Product module": "productManagement",
          "Point of Sale": "pos",
          "Production Module": "production",
          "Report & Analysis": "reportAnalytics",
          "Roles & Permissions": "rolesPermissions",
          Inventory: "inventory",
          "Customer Management": "customerManagement",
        };

        pages.forEach((page) => {
          const key = pageToKey[page] || page.toLowerCase();
          const p = perms[key] || [];
          row[page] = p.length > 0 ? p.join(", ") : "None";
        });

        return row;
      });

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Business Roles");

      // Generate buffer
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const data = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Download file
      const url = window.URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Business_Roles_${new Date().toISOString().split("T")[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      showToast("success", "Success", "Roles exported successfully");
    } catch (error) {
      console.error("Failed to export roles:", error);
      showToast("error", "Error", "Failed to export roles");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#F3F4F6] px-8 py-6">
          <h2 className="text-2xl font-bold text-[#1C1B20]">
            Permission Management
          </h2>
          <button
            onClick={closeManagePermission}
            className="rounded-full p-2 hover:bg-gray-100 transition-colors"
          >
            <X className="h-6 w-6 text-[#9CA3AF]" />
          </button>
        </div>

        <div className="px-8 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex items-center cursor-pointer gap-2 rounded-[10px] border border-[#15BA5C] px-4 py-2.5 text-sm font-medium text-[#15BA5C] hover:bg-green-50 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Reset Defaults
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center cursor-pointer gap-2 rounded-[10px] border border-[#15BA5C] px-4 py-2.5 text-sm font-medium text-[#15BA5C] hover:bg-green-50 transition-colors"
              >
                <Download className="h-4 w-4" />
                Export Roles
              </button>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving || !selectedRoleId}
              className="inline-flex items-center cursor-pointer gap-2 rounded-[10px] bg-[#15BA5C] px-10 py-2.5 text-sm font-medium text-white hover:bg-green-600 transition-colors disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>

          <div>
            <label className="block text-base font-medium text-[#1C1B20] mb-2">
              Select Role
            </label>
            <Dropdown
              options={roleOptions}
              selectedValue={selectedRoleId}
              onChange={setSelectedRoleId}
              placeholder="Select Role"
              searchPlaceholder="Search roles..."
              loading={isLoadingRoles}
              className="w-full"
            />
          </div>

          <div className="max-h-[50vh] overflow-y-auto">
            {selectedRoleId ? (
              <RolePagesPermissions
                value={permissions}
                onChange={setPermissions}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-[#F9FAFB] rounded-[10px] border border-dashed border-[#D1D1D1]">
                <h3 className="text-lg font-semibold text-[#1C1B20] mb-1">
                  No Role Selected
                </h3>
                <p className="text-[#898989] text-sm max-w-[280px] text-center">
                  Please select a role from the dropdown above to view and
                  manage its permissions.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagePermission;
