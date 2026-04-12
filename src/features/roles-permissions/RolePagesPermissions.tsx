import { ChevronsUpDown } from "lucide-react";
import { useState } from "react";

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

export type RolePagePermission = {
  page: string;
  canView: boolean;
  canReport: boolean;
  canManage: boolean;
};

interface RolePagesPermissionsProps {
  value?: RolePagePermission[];
  onChange?: (value: RolePagePermission[]) => void;
}

const RolePagesPermissions = ({
  value,
  onChange,
}: RolePagesPermissionsProps) => {
  const [internalValue, setInternalValue] = useState<RolePagePermission[]>(() =>
    pages.map((page) => ({
      page,
      canView: false,
      canReport: false,
      canManage: false,
    })),
  );

  const permissions = value ?? internalValue;

  const update = (next: RolePagePermission[]) => {
    if (value === undefined) setInternalValue(next);
    onChange?.(next);
  };

  const toggle = (page: string, key: "canView" | "canReport" | "canManage") => {
    update(
      permissions.map((p: RolePagePermission) => {
        if (p.page !== page) return p;

        const next = { ...p, [key]: !p[key] };

        // If canManage is checked, canView and canReport must be checked
        if (key === "canManage" && next.canManage) {
          next.canView = true;
          next.canReport = true;
        }
        // If canReport is checked, canView must be checked
        if (key === "canReport" && next.canReport) {
          next.canView = true;
        }

        // If canView is unchecked, canReport and canManage must be unchecked
        if (key === "canView" && !next.canView) {
          next.canReport = false;
          next.canManage = false;
        }
        // If canReport is unchecked, canManage must be unchecked
        if (key === "canReport" && !next.canReport) {
          next.canManage = false;
        }

        return next;
      }),
    );
  };

  return (
    <section className="mt-6 rounded-[10px] overflow-hidden">
      <div className="bg-[#F9FAFB] px-6 py-3">
        <div className="grid grid-cols-12 gap-6 text-sm font-medium text-[#737373]">
          <div className="flex items-center gap-1 col-span-6">
            <span className="flex items-center gap-1 cursor-pointer">
              Pages
              <ChevronsUpDown className="w-3 h-3 text-[#C7C7C7]" />
            </span>
          </div>
          <div className="flex items-center gap-1 col-span-2 justify-center">
            <span className="flex items-center gap-1 cursor-pointer">
              Can View
              <ChevronsUpDown className="w-3 h-3 text-[#C7C7C7]" />
            </span>
          </div>
          <div className="flex items-center gap-1 col-span-2 justify-center">
            <span className="flex items-center gap-1 cursor-pointer">
              Can Report
              <ChevronsUpDown className="w-3 h-3 text-[#C7C7C7]" />
            </span>
          </div>
          <div className="flex items-center gap-1 col-span-2 justify-center">
            <span className="flex items-center gap-1 cursor-pointer">
              Can Manage
              <ChevronsUpDown className="w-3 h-3 text-[#C7C7C7]" />
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white">
        {permissions.map((row: RolePagePermission) => {
          const isViewDisabled = row.canReport || row.canManage;
          const isReportDisabled = row.canManage;

          return (
            <div
              key={row.page}
              className="grid grid-cols-12 gap-6 px-6 py-4 text-sm text-[#374151] border-t border-[#F3F4F6] items-center"
            >
              <div className="col-span-6 truncate font-medium">{row.page}</div>
              <div className="col-span-2 flex justify-center">
                <input
                  type="checkbox"
                  checked={row.canView}
                  disabled={isViewDisabled}
                  onChange={() => toggle(row.page, "canView")}
                  className={`h-5 w-5 rounded border-gray-300 text-[#15BA5C] focus:ring-[#15BA5C] ${
                    isViewDisabled
                      ? "opacity-30 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                />
              </div>
              <div className="col-span-2 flex justify-center">
                <input
                  type="checkbox"
                  checked={row.canReport}
                  disabled={isReportDisabled}
                  onChange={() => toggle(row.page, "canReport")}
                  className={`h-5 w-5 rounded border-gray-300 text-[#15BA5C] focus:ring-[#15BA5C] ${
                    isReportDisabled
                      ? "opacity-30 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                />
              </div>
              <div className="col-span-2 flex justify-center">
                <input
                  type="checkbox"
                  checked={row.canManage}
                  onChange={() => toggle(row.page, "canManage")}
                  className="h-5 w-5 rounded border-gray-300 text-[#15BA5C] focus:ring-[#15BA5C] cursor-pointer"
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default RolePagesPermissions;
