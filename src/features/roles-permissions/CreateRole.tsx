import { useMemo, useState } from "react";
import { useBusinessStore } from "@/stores/useBusinessStore";
import useActionMenuStore from "@/stores/rolesAndPermissionStore";
import useToastStore from "@/stores/toastStore";
import { z } from "zod";
import RolePagesPermissions, {
  type RolePagePermission,
} from "./RolePagesPermissions";

interface CreateRoleProps {
  onSuccess?: () => void | Promise<void>;
}

const CreateRole = ({ onSuccess }: CreateRoleProps) => {
  const { selectedOutletId } = useBusinessStore();
  const { closeCreateRole } = useActionMenuStore();
  const { showToast } = useToastStore();

  const [roleName, setRoleName] = useState("");
  const [permissions, setPermissions] = useState<RolePagePermission[]>();
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

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

  const handleCreate = async () => {
    setSubmitAttempted(true);
    if (!validation.success) return;
    if (!selectedOutletId) {
      showToast("error", "Error", "Select an outlet to continue");
      return;
    }

    try {
      setIsCreating(true);

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
      if (permissions) {
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
      }

      await (window as any).electronAPI.upsertBusinessRole({
        outletId: selectedOutletId,
        name: validation.data.roleName,
        permissions: formattedPermissions,
      });
      await onSuccess?.();
      showToast("success", "Success", "Role created successfully");
      closeCreateRole();
    } catch {
      showToast("error", "Error", "Failed to create role");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
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
      </div>

      <RolePagesPermissions value={permissions} onChange={setPermissions} />

      <div className="w-full flex items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={closeCreateRole}
          className="w-full cursor-pointer items-center justify-center rounded-[10px] px-6 py-2.5 text-sm font-medium text-[#111827] bg-[#E5E7EB] hover:bg-[#D1D5DB]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleCreate}
          disabled={isCreating || !validation.success}
          className="w-full items-center cursor-pointer justify-center rounded-[10px] px-8 py-2.5 text-sm font-medium text-white bg-[#15BA5C] hover:bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isCreating ? "Creating..." : "Create"}
        </button>
      </div>
    </section>
  );
};

export default CreateRole;
