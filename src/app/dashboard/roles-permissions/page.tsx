import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  User,
  PenLine,
  Trash2,
  ChevronLeft,
  ChevronRight,
  SquarePen,
  Search,
  Plus,
  Lock,
  MoreVertical,
  UserX,
  ChevronsUpDown,
  X,
} from "lucide-react";
import NotFound from "@/features/roles-permissions/NotFound";
import useActionMenuStore from "@/stores/rolesAndPermissionStore";
import CreateRole from "@/features/roles-permissions/CreateRole";
import CreateUser from "@/features/roles-permissions/CreateUser";
import AssignPinModal from "@/features/roles-permissions/AssignPinModal";

const RolesAndPermissionPage = () => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);

  const permissionTabs = [
    "All",
    "Cashier",
    "Manager",
    "Bakery Manager",
    "Storekeeper",
    "Production Manager",
    "Front desk help",
    "Admin Officer",
  ];

  const [activePermissionTab, setActivePermissionTab] = useState<string>("All");
  const {
    openUserId,
    toggleMenu,
    closeMenu,
    isCreateRoleOpen,
    openCreateRole,
    closeCreateRole,
    isCreateUserOpen,
    openCreateUser,
    closeCreateUser,
    isAssignPinOpen,
    openAssignPin,
    closeAssignPin,
  } = useActionMenuStore();

  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true);

  const roles = [
    { id: "super-admin", name: "Super Admin" },
    { id: "waiter", name: "Waiter" },
    { id: "cashier", name: "Cashier" },
    { id: "baker", name: "Baker" },
  ];

  const usersTable = [
    {
      id: 1,
      name: "Darrell Steward",
      role: "Cashier",
      status: "Active",
      initiator: "Brooklyn Simmons",
      timestampDate: "2025-07-11",
      timestampTime: "10:00 am",
    },
    {
      id: 2,
      name: "Darlene Robertson",
      role: "Manager",
      status: "Active",
      initiator: "Bessie Cooper",
      timestampDate: "2025-07-11",
      timestampTime: "10:00 am",
    },
    {
      id: 3,
      name: "Guy Hawkins",
      role: "Storekeeper",
      status: "Active",
      initiator: "Darrell Steward",
      timestampDate: "2025-07-11",
      timestampTime: "10:00 am",
    },
    {
      id: 4,
      name: "Cameron Williamson",
      role: "Production Manager",
      status: "Active",
      initiator: "Marvin McKinney",
      timestampDate: "2025-07-11",
      timestampTime: "10:00 am",
    },
    {
      id: 5,
      name: "Kristin Watson",
      role: "Front desk help",
      status: "Active",
      initiator: "Wade Warren",
      timestampDate: "2025-07-11",
      timestampTime: "10:00 am",
    },
    {
      id: 6,
      name: "Brooklyn Simmons",
      role: "Super Admin",
      status: "Active",
      initiator: "Leslie Alexander",
      timestampDate: "2025-07-11",
      timestampTime: "10:00 am",
    },
    {
      id: 7,
      name: "Savannah Nguyen",
      role: "Cashier",
      status: "Active",
      initiator: "Savannah Nguyen",
      timestampDate: "2025-07-11",
      timestampTime: "10:00 am",
    },
  ];

  const statusStyles: Record<string, string> = {
    Active: "bg-[#0087531A] text-[#15BA5C]",
    Invited: "bg-blue-50 text-blue-700",
    Suspended: "bg-red-50 text-red-700",
  };

  const handleScroll = (direction: "left" | "right") => {
    const container = scrollRef.current;
    if (!container) return;
    const amount = container.clientWidth * 0.6;
    container.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    setIsLoadingUsers(true);
    const id = setTimeout(() => {
      setIsLoadingUsers(false);
    }, 700);
    return () => clearTimeout(id);
  }, [activePermissionTab]);

  const filteredUsers = useMemo(
    () =>
      usersTable.filter(
        (user) =>
          activePermissionTab === "All" || user.role === activePermissionTab,
      ),
    [activePermissionTab],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!actionMenuRef.current || !target) return;
      if (!actionMenuRef.current.contains(target)) {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [closeMenu]);

  return (
    <section className="flex flex-col relative">
      <section className="bg-white px-7 py-5 my-4 ">
        <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="max-w-xl">
            <h3 className="text-[1.25rem] font-medium text-[#1C1B20] mb-1">
              Available Roles
            </h3>
            <p className="text-sm text-[#737373] leading-relaxed">
              Roles provides access to predefined menus and features so that
              depending on the assigned role (Super Admin, Manager) a registered
              user can access what he needs on Bountip.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              className="inline-flex items-center cursor-pointer gap-2 border border-[#15BA5C] text-nowrap px-4 py-2 rounded-[12px] text-sm font-medium text-[#15BA5C] bg-white hover:bg-green-50 transition-colors"
              type="button"
            >
              <svg
                width="23"
                height="21"
                viewBox="0 0 23 21"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11.2575 5.75312e-05C11.8905 -0.00444247 12.5235 0.255058 13.0065 0.774058L15.9315 3.84906C16.251 4.19106 16.251 4.74906 15.9315 5.09106C15.8584 5.17183 15.7691 5.23639 15.6695 5.28057C15.57 5.32476 15.4622 5.34758 15.3533 5.34758C15.2443 5.34758 15.1365 5.32476 15.037 5.28057C14.9374 5.23639 14.8481 5.17183 14.775 5.09106L12 2.17656V14.1661C12 14.6266 11.664 15.0001 11.25 15.0001C10.836 15.0001 10.5 14.6266 10.5 14.1661V2.22606L7.77 5.09106C7.69689 5.17159 7.60774 5.23594 7.50829 5.27997C7.40883 5.32401 7.30127 5.34675 7.1925 5.34675C7.08373 5.34675 6.97617 5.32401 6.87671 5.27997C6.77726 5.23594 6.68811 5.17159 6.615 5.09106C6.46058 4.9208 6.37505 4.69916 6.37505 4.46931C6.37505 4.23945 6.46058 4.01782 6.615 3.84756L9.54 0.772557C9.75743 0.534176 10.0213 0.342702 10.3153 0.209869C10.6093 0.0770357 10.9274 0.00564027 11.25 5.75312e-05H11.2575ZM4.77 9.00006C4.0605 9.00006 3.45 9.44106 3.312 10.0546L1.5285 17.9296C1.51156 18.0146 1.50203 18.1009 1.5 18.1876C1.5 18.9121 2.166 19.5001 2.985 19.5001H19.515C19.613 19.5001 19.71 19.4916 19.806 19.4746C20.6115 19.3321 21.1335 18.6406 20.973 17.9296L19.188 10.0546C19.05 9.44106 18.4395 9.00006 17.733 9.00006H4.77ZM7.5 7.50006V9.00006H15V7.50006H17.7375C19.1565 7.50006 20.3775 8.40906 20.6565 9.67056L22.4415 17.7706C22.764 19.2331 21.7185 20.6551 20.1075 20.9476C19.9147 20.9841 19.7187 21.0017 19.5225 21.0001H2.9775C1.332 21.0001 0 19.7911 0 18.3001C0 18.1211 0.0195001 17.9446 0.0585001 17.7706L1.8435 9.67056C2.121 8.40906 3.3435 7.50006 4.761 7.50006H7.5Z"
                  fill="#15BA5C"
                />
              </svg>
              <span>Export</span>
            </button>
            <button
              className="inline-flex items-center cursor-pointer gap-2 border border-[#15BA5C] text-nowrap px-4 py-2 rounded-[12px] text-sm font-medium text-[#15BA5C] bg-white hover:bg-green-50 transition-colors"
              type="button"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M12 2C10.8426 1.99976 9.70976 2.3343 8.73814 2.96329C7.76653 3.59229 6.99759 4.48888 6.524 5.545C6.45663 5.69641 6.38763 5.84708 6.317 5.997L6.297 5.998C6.233 6 6.146 6 6 6C4.93913 6 3.92172 6.42143 3.17157 7.17157C2.42143 7.92172 2 8.93913 2 10C2 11.0609 2.42143 12.0783 3.17157 12.8284C3.92172 13.5786 4.93913 14 6 14H6.172L8.172 12H6C5.46957 12 4.96086 11.7893 4.58579 11.4142C4.21071 11.0391 4 10.5304 4 10C4 9.46957 4.21071 8.96086 4.58579 8.58579C4.96086 8.21071 5.46957 8 6 8H6.064C6.272 8 6.514 8.001 6.714 7.96C6.96296 7.91742 7.20093 7.82563 7.414 7.69C7.655 7.534 7.821 7.34 7.947 7.163C8.0242 7.04899 8.09145 6.92854 8.148 6.803C8.20133 6.69167 8.26667 6.549 8.344 6.375L8.348 6.365C8.66342 5.66016 9.17607 5.06165 9.82408 4.6417C10.4721 4.22175 11.2278 3.99829 12 3.99829C12.7722 3.99829 13.5279 4.22175 14.1759 4.6417C14.8239 5.06165 15.3366 5.66016 15.652 6.365L15.657 6.375C15.7337 6.54833 15.7987 6.691 15.852 6.803C15.898 6.9 15.966 7.041 16.053 7.163C16.179 7.339 16.344 7.534 16.586 7.691C16.828 7.847 17.073 7.918 17.286 7.961C17.486 8.001 17.728 8.001 17.936 8.001L18 8C18.5304 8 19.0391 8.21071 19.4142 8.58579C19.7893 8.96086 20 9.46957 20 10C20 10.5304 19.7893 11.0391 19.4142 11.4142C19.0391 11.7893 18.5304 12 18 12H15.828L17.828 14H18C19.0609 14 20.0783 13.5786 20.8284 12.8284C21.5786 12.0783 22 11.0609 22 10C22 8.93913 21.5786 7.92172 20.8284 7.17157C20.0783 6.42143 19.0609 6 18 6C17.854 6 17.767 6 17.703 5.998H17.683L17.658 5.945C17.5961 5.81223 17.5354 5.67889 17.476 5.545C17.0024 4.48888 16.2335 3.59229 15.2619 2.96329C14.2902 2.3343 13.1574 1.99976 12 2Z"
                  fill="#15BA5C"
                />
                <path
                  d="M12 11.9999L11.293 11.2929L12 10.5859L12.707 11.2929L12 11.9999ZM13 20.9999C13 21.2652 12.8946 21.5195 12.7071 21.707C12.5195 21.8946 12.2652 21.9999 12 21.9999C11.7348 21.9999 11.4804 21.8946 11.2929 21.707C11.1053 21.5195 11 21.2652 11 20.9999H13ZM7.29297 15.2929L11.293 11.2929L12.707 12.7069L8.70697 16.7069L7.29297 15.2929ZM12.707 11.2929L16.707 15.2929L15.293 16.7069L11.293 12.7069L12.707 11.2929ZM13 11.9999V20.9999H11V11.9999H13Z"
                  fill="#15BA5C"
                />
              </svg>

              <span>Staff Bulk Upload</span>
            </button>
            <button
              type="button"
              onClick={openCreateUser}
              className="inline-flex items-center cursor-pointer justify-center bg-[#15BA5C] text-nowrap px-4 py-2.5 text-white rounded-[10px] text-sm font-medium hover:bg-green-600 transition-colors"
            >
              Add New User
            </button>
          </div>
        </section>
        <section className="relative mt-6">
          <button
            type="button"
            onClick={() => handleScroll("left")}
            className="hidden lg:flex absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-md items-center justify-center text-gray-700 hover:bg-gray-50"
            aria-label="Scroll roles left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div ref={scrollRef} className="flex gap-4 overflow-x-auto py-2 pr-2">
            {roles.map((role) => (
              <div
                key={role.id}
                className="min-w-[240px] max-w-[280px] bg-[#1F2933] rounded-2xl overflow-hidden flex-shrink-0"
              >
                <div className="px-4 py-4 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 text-white text-[0.95rem] font-semibold">
                      <div className="w-8 h-8 rounded-lg bg-[#2D3742] flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <span>0 User</span>
                    </div>
                    <p className="mt-4 text-sm text-white">{role.name}</p>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      className="w-7 h-7 rounded-full bg-[#15BA5C] flex items-center justify-center hover:bg-green-500"
                      aria-label={`Edit ${role.name}`}
                    >
                      <SquarePen className="w-3.5 h-3.5 text-white" />
                    </button>
                    <button
                      type="button"
                      className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600"
                      aria-label={`Delete ${role.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                </div>
                <div className="h-[6px] bg-[#15BA5C] rounded-b-2xl" />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => handleScroll("right")}
            className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-md items-center justify-center text-gray-700 hover:bg-gray-50"
            aria-label="Scroll roles right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </section>
      </section>
      <section className="bg-white px-7 py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h3 className="font-bold text-[1.5rem] text-[#1C1B20]">Roles</h3>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex w-full md:w-[260px] h-10 rounded-l-[10px] overflow-hidden border border-[#E5E7EB] bg-white">
              <input
                type="text"
                placeholder="Search"
                className="flex-1 px-3 text-sm text-[#4B5563] outline-none border-none"
              />
              <button
                type="button"
                className="w-10 flex items-center justify-center bg-[#15BA5C] text-white hover:bg-green-600 transition-colors"
                aria-label="Search roles"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={openCreateRole}
              type="button"
              className="inline-flex items-center cursor-pointer gap-2 bg-[#15BA5C] text-white px-4 py-2.5 rounded-[10px] text-sm font-medium hover:bg-green-600 transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Role</span>
            </button>
            <button
              type="button"
              onClick={openAssignPin}
              className="inline-flex items-center cursor-pointer gap-2 bg-[#15BA5C] text-white px-4 py-2.5 rounded-[10px] text-sm font-medium hover:bg-green-600 transition-colors whitespace-nowrap"
            >
              <Lock className="w-4 h-4" />
              <span>Assign User Pin</span>
            </button>
          </div>
        </div>
        <div className="mt-4">
          <div className="my-4 overflow-x-auto">
            <div className="flex gap-8 min-w-max py-2">
              {permissionTabs.map((tab) => {
                const isActive = tab === activePermissionTab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActivePermissionTab(tab)}
                    className={`relative cursor-pointer pb-2 text-base whitespace-nowrap ${
                      isActive
                        ? "text-[#111827] font-semibold"
                        : "text-[#898989] font-medium"
                    }`}
                  >
                    {tab}
                    {isActive && (
                      <span className="absolute left-0 -bottom-[2px] h-[2px] w-full bg-[#111827]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div ref={actionMenuRef} className="mt-1">
            <div className="bg-[#F9FAFB] px-6 py-3">
              <div className="grid grid-cols-12 gap-6 text-[.875rem] font-medium text-[#737373]">
                <div className="flex items-center gap-1 col-span-3">
                  <span>Name</span>
                  <ChevronsUpDown className="w-3 h-3 text-[#9CA3AF]" />
                </div>
                <div className="flex items-center gap-1 col-span-2">
                  <span>Roles</span>
                  <ChevronsUpDown className="w-3 h-3 text-[#C7C7C7]" />
                </div>
                <div className="flex items-center gap-1 col-span-2">
                  <span>Status</span>
                  <ChevronsUpDown className="w-3 h-3 text-[#C7C7C7]" />
                </div>
                <div className="flex items-center gap-1 col-span-2">
                  <span>Initiator</span>
                  <ChevronsUpDown className="w-3 h-3 text-[#C7C7C7]" />
                </div>
                <div className="flex items-center gap-1 col-span-2">
                  <span>Time Stamp</span>
                  <ChevronsUpDown className="w-3 h-3 text-[#C7C7C7]" />
                </div>
                <div className="flex items-center gap-1 col-span-1 justify-end">
                  <span>Action</span>
                  <ChevronsUpDown className="w-3 h-3 text-[#C7C7C7]" />
                </div>
              </div>
            </div>
            <div className="bg-white">
              {isLoadingUsers && (
                <div className="animate-pulse">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-6 px-6 py-3 border-t border-[#F3F4F6] items-center"
                    >
                      <div className="col-span-3">
                        <div className="h-3 w-32 rounded-full bg-gray-200" />
                      </div>
                      <div className="col-span-2">
                        <div className="h-3 w-20 rounded-full bg-gray-200" />
                      </div>
                      <div className="col-span-2">
                        <div className="h-7 w-20 rounded-full bg-gray-200" />
                      </div>
                      <div className="col-span-2">
                        <div className="h-3 w-28 rounded-full bg-gray-200" />
                      </div>
                      <div className="col-span-2">
                        <div className="h-3 w-24 rounded-full bg-gray-200 mb-1" />
                        <div className="h-3 w-16 rounded-full bg-gray-100" />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <div className="h-6 w-6 rounded-full bg-gray-200" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!isLoadingUsers && filteredUsers.length === 0 && (
                <div className="px-6 py-10 my-5">
                  <NotFound />
                </div>
              )}

              {!isLoadingUsers &&
                filteredUsers.length > 0 &&
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="grid grid-cols-12 gap-6 px-6 py-3 text-[14px] md:text-[15px] text-[#374151] border-t border-[#F3F4F6] items-center"
                  >
                    <div className="truncate col-span-3">{user.name}</div>
                    <div className="truncate col-span-2">{user.role}</div>
                    <div className="col-span-2">
                      <span
                        className={`inline-flex items-center px-2 py-[10px] rounded-[10px] text-[14px] md:text-[15px] font-normal ${
                          statusStyles[user.status] ??
                          "bg-gray-50 text-gray-700"
                        }`}
                      >
                        {user.status}
                      </span>
                    </div>
                    <div className="truncate col-span-2">{user.initiator}</div>
                    <div className="truncate col-span-2">
                      <span className="block">{user.timestampDate}</span>
                      <span className="block text-[0.7rem] text-[#9CA3AF]">
                        {user.timestampTime}
                      </span>
                    </div>
                    <div className="relative flex items-center justify-end col-span-1">
                      <button
                        type="button"
                        onClick={() => toggleMenu(user.id)}
                        className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
                        aria-label="Open user actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {openUserId === user.id && (
                        <div className="absolute right-0 bottom-full mb-2 z-[1000000] w-44 rounded-[14px] bg-black py-2 shadow-lg">
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 px-4 py-2 text-xs text-white hover:bg-[#111111]"
                          >
                            <PenLine className="w-4 h-4" />
                            <span>Edit User</span>
                          </button>
                          <div className="mx-4 my-1 h-px bg-[#3F3F3F]" />
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 px-4 py-2 text-xs text-[#FACC15] hover:bg-[#111111]"
                          >
                            <UserX className="w-4 h-4" />
                            <span>Suspend User</span>
                          </button>
                          <div className="mx-4 my-1 h-px bg-[#3F3F3F]" />
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 px-4 py-2 text-xs text-[#F87171] hover:bg-[#111111]"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete User</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>

      {isCreateRoleOpen && (
        <div className="fixed inset-0 z-[2000000] flex items-center justify-center bg-black/40">
          <div className="w-full max-w-5xl bg-white rounded-[20px] shadow-xl">
            <div className="relative flex items-center justify-between px-8 pt-6 pb-4 border-[#E5E7EB]">
              <h2 className="text-[20px] font-bold text-[#111827]">
                Add a Role
              </h2>
              <button
                type="button"
                onClick={closeCreateRole}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-8 py-6 max-h-[70vh] overflow-y-auto">
              <CreateRole />
            </div>

            <div className="flex items-center justify-between gap-4 px-8 py-4">
              <button
                type="button"
                onClick={closeCreateRole}
                className="cursor-pointer w-full items-center justify-center rounded-[10px] px-6 py-2.5 text-sm font-medium text-[#111827] bg-[#E5E7EB] hover:bg-[#D1D5DB]"
              >
                Cancel
              </button>
              <button
                type="button"
                className="cursor-pointer w-full items-center justify-center rounded-[10px] px-8 py-2.5 text-sm font-medium text-white bg-[#15BA5C] hover:bg-green-600"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {isCreateUserOpen && (
        <div className="fixed inset-0 z-[2000000] flex items-center justify-center bg-black/40">
          <div className="w-full max-w-5xl bg-white rounded-[20px] shadow-xl">
            <div className="flex items-center justify-between px-8 pt-6 pb-4 ">
              <h2 className="text-[20px] font-semibold text-[#111827]">
                Add a User
              </h2>
              <button
                type="button"
                onClick={closeCreateUser}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-8 py-6 max-h-[70vh] overflow-y-auto">
              <CreateUser />
            </div>
          </div>
        </div>
      )}

      <AssignPinModal isOpen={isAssignPinOpen} onClose={closeAssignPin} />
    </section>
  );
};

export default RolesAndPermissionPage;
