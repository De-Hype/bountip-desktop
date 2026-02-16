import { ChevronsUpDown } from "lucide-react";

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

const RolePagesPermissions = () => {
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
        {pages.map((page) => (
          <div
            key={page}
            className="grid grid-cols-12 gap-6 px-6 py-3 text-sm text-[#374151] border-t border-[#F3F4F6] items-center"
          >
            <div className="col-span-6 truncate">{page}</div>
            <div className="col-span-2 flex justify-center">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-[#15BA5C] focus:ring-[#15BA5C]"
              />
            </div>
            <div className="col-span-2 flex justify-center">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-[#15BA5C] focus:ring-[#15BA5C]"
              />
            </div>
            <div className="col-span-2 flex justify-center">
              <input
                type="checkbox"
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

