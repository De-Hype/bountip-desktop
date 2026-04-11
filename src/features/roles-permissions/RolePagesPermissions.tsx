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

  const toggle = (
    page: string,
    key: "canView" | "canReport" | "canManage",
  ) => {
    update(
      permissions.map((p: RolePagePermission) =>
        p.page === page ? { ...p, [key]: !p[key] } : p,
      ),
    );
  };

  return (
    <section className="mt-6 rounded-[10px] overflow-hidden">
      <div className="bg-[#F9FAFB] px-6 py-3">
        <div className="grid grid-cols-12 gap-6 text-sm font-medium text-[#737373]">
          <div className="flex items-center gap-1 col-span-6">
            <span>Pages</span>
            <ChevronsUpDown className="w-3 h-3 text-[#C7C7C7]" />
          </div>
          <div className="flex items-center gap-1 col-span-2 justify-center">
            <span>Can View</span>
            <ChevronsUpDown className="w-3 h-3 text-[#C7C7C7]" />
          </div>
          <div className="flex items-center gap-1 col-span-2 justify-center">
            <span>Can Report</span>
            <ChevronsUpDown className="w-3 h-3 text-[#C7C7C7]" />
          </div>
          <div className="flex items-center gap-1 col-span-2 justify-center">
            <span>Can Manage</span>
            <ChevronsUpDown className="w-3 h-3 text-[#C7C7C7]" />
          </div>
        </div>
      </div>

      <div className="bg-white">
        {permissions.map((row: RolePagePermission) => (
          <div
            key={row.page}
            className="grid grid-cols-12 gap-6 px-6 py-3 text-sm text-[#374151] border-t border-[#F3F4F6] items-center"
          >
            <div className="col-span-6 truncate">{row.page}</div>
            <div className="col-span-2 flex justify-center">
              <input
                type="checkbox"
                checked={row.canView}
                onChange={() => toggle(row.page, "canView")}
                className="h-4 w-4 rounded border-gray-300 text-[#15BA5C] focus:ring-[#15BA5C]"
              />
            </div>
            <div className="col-span-2 flex justify-center">
              <input
                type="checkbox"
                checked={row.canReport}
                onChange={() => toggle(row.page, "canReport")}
                className="h-4 w-4 rounded border-gray-300 text-[#15BA5C] focus:ring-[#15BA5C]"
              />
            </div>
            <div className="col-span-2 flex justify-center">
              <input
                type="checkbox"
                checked={row.canManage}
                onChange={() => toggle(row.page, "canManage")}
                className="h-4 w-4 rounded border-gray-300 text-[#15BA5C] focus:ring-[#15BA5C]"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RolePagesPermissions;
