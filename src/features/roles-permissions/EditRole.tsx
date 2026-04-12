import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useBusinessStore } from "@/stores/useBusinessStore";
import useActionMenuStore from "@/stores/rolesAndPermissionStore";
import useToastStore from "@/stores/toastStore";
import { z } from "zod";
import RolePagesPermissions, {
  type RolePagePermission,
} from "./RolePagesPermissions";

interface EditRoleProps {
  onSuccess?: () => void | Promise<void>;
}

const EditRole = ({ onSuccess }: EditRoleProps) => {
  const { selectedOutletId } = useBusinessStore();
  const { closeEditRole, editingRole } = useActionMenuStore();
  const { showToast } = useToastStore();

  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<RolePagePermission[]>([]);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editingRole) {
      setRoleName(editingRole.name || "");

      let rolePerms = editingRole.permissions || {};
      if (typeof rolePerms === "string") {
        try {
          rolePerms = JSON.parse(rolePerms);
        } catch {
          rolePerms = {};
        }
      }

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
    }
  }, [editingRole]);

  const schema = useMemo(
    () =>
      z.object({
        roleName: z.string().trim().min(1, "Role name is required"),
      }),
    [],
  );

  const validation = useMemo(
    () =>
      schema.safeParse({
        roleName,
      }),
    [roleName, schema],
  );

  const errors = useMemo(() => {
    const empty = { roleName: "" };
    if (validation.success) return empty;

    const next = { ...empty };
    for (const issue of validation.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && key in next && !next.roleName) {
        next.roleName = issue.message;
      }
    }
    return next;
  }, [validation]);

  const handleSave = async () => {
    setSubmitAttempted(true);
    if (!validation.success) return;
    if (!selectedOutletId) {
      showToast("error", "Error", "Select an outlet to continue");
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
        id: editingRole.id,
        outletId: selectedOutletId,
        name: validation.data.roleName,
        permissions: formattedPermissions,
      });
      await onSuccess?.();
      showToast("success", "Success", "Role updated successfully");
      closeEditRole();
    } catch {
      showToast("error", "Error", "Failed to update role");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#F3F4F6] px-8 py-6">
          <h2 className="text-2xl font-bold text-[#1C1B20]">Edit Role</h2>
          <button
            onClick={closeEditRole}
            className="rounded-full p-2 hover:bg-gray-100 transition-colors"
          >
            <X className="h-6 w-6 text-[#9CA3AF] cursor-pointer" />
          </button>
        </div>

        <div className="px-8 py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-base font-medium text-[#1C1B20] mb-2">
                Role Name
              </label>
              <input
                type="text"
                placeholder="Enter role name"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                className={`w-full rounded-[10px] bg-[#FAFAFC] border px-4.5 py-2.5 text-sm text-[#111827] placeholder-[#A6A6A6] outline-none focus:ring-1 ${
                  submitAttempted && errors.roleName
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-[#D1D1D1] focus:border-[#15BA5C] focus:ring-[#15BA5C]"
                }`}
              />
              {submitAttempted && errors.roleName && (
                <span className="mt-1 block text-xs text-red-500">
                  {errors.roleName}
                </span>
              )}
            </div>
            <div>
              <label className="block text-base font-medium text-[#1C1B20] mb-2">
                Description
              </label>
              <input
                type="text"
                placeholder="Describe the role"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-[10px] bg-[#FAFAFC] border border-[#D1D1D1] px-4.5 py-2.5 text-sm text-[#111827] placeholder-[#A6A6A6] outline-none focus:border-[#15BA5C] focus:ring-1 focus:ring-[#15BA5C]"
              />
            </div>
          </div>

          <div className="max-h-[50vh] overflow-y-auto">
            <RolePagesPermissions
              value={permissions}
              onChange={setPermissions}
            />
          </div>

          <div className="flex items-center justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={closeEditRole}
              className="px-10 py-2.5 flex-1 cursor-pointer text-sm font-medium text-[#111827] bg-[#E5E7EB] rounded-[10px] hover:bg-[#D1D5DB] min-w-[150px]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !validation.success}
              className="px-10 py-2.5 flex-1 cursor-pointer text-sm font-medium text-white bg-[#15BA5C] rounded-[10px] hover:bg-green-600 disabled:opacity-60 min-w-[150px]"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditRole;
