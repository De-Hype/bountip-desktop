import { useState } from "react";
import RolePagesPermissions from "./RolePagesPermissions";
import { Camera } from "lucide-react";
import useActionMenuStore from "@/stores/rolesAndPermissionStore";

const CreateUser = () => {
  const [activeTab, setActiveTab] = useState<"profile" | "permissions">(
    "profile",
  );
  const { closeCreateUser } = useActionMenuStore();

  return (
    <section className="space-y-8">
      <div className="flex justify-center">
        <div className="inline-flex w-full  rounded-[8px] border border-[#E5E7EB] bg-[#7878801F] text-sm font-medium text-[#4B5563] overflow-hidden">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`flex-1 px-6 py-3 ${
              activeTab === "profile"
                ? "bg-white text-[#000000]"
                : "bg-transparent text-[#898989]"
            }`}
          >
            Profile information
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("permissions")}
            className={`flex-1 px-6 py-3 ${
              activeTab === "permissions"
                ? "bg-white text-[#111827]"
                : "bg-transparent text-[#9CA3AF]"
            }`}
          >
            Permissions Management
          </button>
        </div>
      </div>

      {activeTab === "profile" && (
        <>
          <div className="flex flex-col items-center gap-3">
            <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-[#F3F4F6] border-4 border-[#15BA5C33]">
              <div className="w-20 h-20 rounded-full bg-[#E5E7EB] flex items-center justify-center text-[32px] text-[#9CA3AF]">
                <span>👤</span>
              </div>
              <button
                type="button"
                className="absolute bottom-2 -right-2 w-7 h-7 rounded-full bg-[#15BA5C] flex items-center justify-center"
                aria-label="Upload photo"
              >
                <Camera className="w-3.5 h-3.5 rounded-sm text-white" />
              </button>
            </div>
            <button
              type="button"
              className="text-sm font-medium text-[#1C1B20]"
            >
              Upload photo
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">
                First Name
              </label>
              <input
                type="text"
                placeholder="First Name"
                className="w-full rounded-[10px] bg-[#FAFAFC] border border-[#D1D1D1] px-4.5 py-2.5 text-sm text-[#111827] placeholder-[#A6A6A6] outline-none focus:border-[#15BA5C] focus:ring-1 focus:ring-[#15BA5C]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">
                Last Name
              </label>
              <input
                type="text"
                placeholder="Last Name"
                className="w-full rounded-[10px] bg-[#FAFAFC] border border-[#D1D1D1] px-4.5 py-2.5 text-sm text-[#111827] placeholder-[#A6A6A6] outline-none focus:border-[#15BA5C] focus:ring-1 focus:ring-[#15BA5C]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full rounded-[10px] bg-[#FAFAFC] border border-[#D1D1D1] px-4.5 py-2.5 text-sm text-[#111827] placeholder-[#A6A6A6] outline-none focus:border-[#15BA5C] focus:ring-1 focus:ring-[#15BA5C]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="Enter your profile number"
                className="w-full rounded-[10px] bg-[#FAFAFC] border border-[#D1D1D1] px-4.5 py-2.5 text-sm text-[#111827] placeholder-[#A6A6A6] outline-none focus:border-[#15BA5C] focus:ring-1 focus:ring-[#15BA5C]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">
                Set User Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Enter a password"
                  className="w-full rounded-[10px] bg-[#FAFAFC] border border-[#D1D1D1] px-4.5 py-2.5 text-sm text-[#111827] placeholder-[#A6A6A6] outline-none focus:border-[#15BA5C] focus:ring-1 focus:ring-[#15BA5C]"
                />
                {/* <span className="absolute inset-y-0 right-3 flex items-center text-[#9CA3AF] text-xs">
                  👁
                </span> */}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">
                Confirm User Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Enter a password"
                  className="w-full rounded-[10px] bg-[#FAFAFC] border border-[#D1D1D1] px-4.5 py-2.5 text-sm text-[#111827] placeholder-[#A6A6A6] outline-none focus:border-[#15BA5C] focus:ring-1 focus:ring-[#15BA5C]"
                />
                {/* <span className="absolute inset-y-0 right-3 flex items-center text-[#9CA3AF] text-xs">
                  👁
                </span> */}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">
                Role Assignment
              </label>
              <div className="relative">
                <select
                  className="w-full appearance-none rounded-[10px] bg-[#FAFAFC] border border-[#D1D1D1] px-3 py-2.5 pr-10 text-sm text-[#111827] placeholder-[#A6A6A6] outline-none focus:border-[#15BA5C] focus:ring-1 focus:ring-[#15BA5C] bg-white"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select Role
                  </option>
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#9CA3AF] text-xs">
                  ▼
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">
                Department (Access)
              </label>
              <div className="relative">
                <select
                  className="w-full appearance-none rounded-[10px] bg-[#FAFAFC] border border-[#D1D1D1] px-3 py-2.5 pr-10 text-sm text-[#111827] placeholder-[#A6A6A6] outline-none focus:border-[#15BA5C] focus:ring-1 focus:ring-[#15BA5C] bg-white"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select Department
                  </option>
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#9CA3AF] text-xs">
                  ▼
                </span>
              </div>
            </div>
          </div>

          <div className="w-full flex items-center justify-between gap-4  py-4  ">
            <button
              type="button"
              onClick={closeCreateUser}
              className="w-full cursor-pointer items-center justify-center rounded-[10px] px-6 py-2.5 text-sm font-medium text-[#111827] bg-[#E5E7EB] hover:bg-[#D1D5DB]"
            >
              Cancel
            </button>
            <button
              type="button"
              className="w-full cursor-pointer items-center justify-center rounded-[10px] px-8 py-2.5 text-sm font-medium text-white bg-[#15BA5C] hover:bg-green-600"
            >
              Create
            </button>
          </div>
        </>
      )}

      {activeTab === "permissions" && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h3 className="text-base font-semibold text-[#1C1B20]">Roles</h3>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-stretch rounded-[10px] border border-[#15BA5C] overflow-hidden">
                <button
                  type="button"
                  className="px-4 py-2 text-sm text-[#898989] bg-white"
                >
                  select role
                </button>
                <button
                  type="button"
                  className="px-3 py-2 bg-[#15BA5C] flex items-center justify-center"
                  aria-label="Open roles dropdown"
                >
                  <span className="text-white text-xs">▼</span>
                </button>
              </div>
              <button
                type="button"
                className="inline-flex items-center cursor-pointer gap-2 border border-[#15BA5C] px-4 py-2 rounded-[10px] text-sm font-medium text-[#15BA5C] bg-white hover:bg-green-50"
              >
                <span>＋</span>
                <span>Add New Role</span>
              </button>
              <button
                type="button"
                className="inline-flex items-center cursor-pointer justify-center bg-[#15BA5C] px-6 py-2 text-sm font-medium text-white rounded-[10px] hover:bg-green-600"
              >
                Save
              </button>
            </div>
          </div>

          <RolePagesPermissions />
        </div>
      )}
    </section>
  );
};

export default CreateUser;
