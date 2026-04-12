import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  User,
  PenLine,
  Trash2,
  ChevronLeft,
  ChevronRight,
  SquarePen,
  Search,
  Plus,
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
import ManagePermission from "@/features/roles-permissions/ManagePermission";
import EditRole from "@/features/roles-permissions/EditRole";
import { useBusinessStore } from "@/stores/useBusinessStore";
import { Pagination } from "@/shared/Pagination/pagination";
import EditUser from "@/features/roles-permissions/EditUser";

const RolesAndPermissionPage = () => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);

  const [dbRoles, setDbRoles] = useState<any[]>([]);
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [activePermissionTab, setActivePermissionTab] = useState<string>("All");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
  } | null>(null);

  // Pagination for Users (Vertical)
  const [usersCurrentPage, setUsersCurrentPage] = useState(1);
  const [usersItemsPerPage, setUsersItemsPerPage] = useState(10);

  const { selectedOutletId } = useBusinessStore();

  const permissionTabs = useMemo(() => {
    const roleNames = dbRoles.map((r) => r.name);
    return ["All", ...roleNames];
  }, [dbRoles]);

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    dbUsers.forEach((user) => {
      const roleName = user.roleName || "Unassigned";
      counts[roleName] = (counts[roleName] || 0) + 1;
    });
    return counts;
  }, [dbUsers]);

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
    closeAssignPin,
    isManagePermissionOpen,
    openManagePermission,
    closeManagePermission,
    isEditRoleOpen,
    openEditRole,
    closeEditRole,
  } = useActionMenuStore();

  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true);

  const fetchRolesAndUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const rolesData = await (window as any).electronAPI.getBusinessRoles(
        selectedOutletId,
      );
      const usersData = await (
        window as any
      ).electronAPI.getBusinessUsersWithRoles(selectedOutletId);
      setDbRoles(rolesData || []);
      setDbUsers(usersData || []);
    } catch (error) {
      console.error("Failed to fetch roles or users:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleToggleSuspendUser = async (
    userId: string,
    currentStatus: string,
  ) => {
    try {
      const nextStatus = currentStatus === "locked" ? "active" : "locked";
      await (window as any).electronAPI.setUserStatus({
        userId,
        status: nextStatus,
      });
      await fetchRolesAndUsers();
    } catch (error) {
      console.error("Failed to update user status:", error);
    }
  };

  const handleExportUsers = () => {
    if (searchedUsers.length === 0) return;

    try {
      // Prepare data for export
      const exportData = searchedUsers.map((user) => ({
        Name: user.name,
        Email: user.email,
        Role: user.role,
        Status: user.status,
        Initiator: user.initiator,
        Date: user.timestampDate,
        Time: user.timestampTime,
      }));

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

      // Generate buffer and download
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const data = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Users_Export_${new Date().toISOString().split("T")[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export users:", error);
    }
  };

  useEffect(() => {
    fetchRolesAndUsers();
  }, [selectedOutletId]);

  const usersTable = useMemo(() => {
    return dbUsers.map((u) => ({
      id: u.id,
      name: u.fullName || "Unknown User",
      email: u.email || u.emailAddress || u.userEmail || "",
      role: u.roleName || "Unassigned",
      status:
        u.status === "active"
          ? "Active"
          : u.status === "inactive"
            ? "Inactive"
            : u.status,
      initiator: u.initiator || "System",
      timestampDate: u.createdAt ? u.createdAt.split("T")[0] : "-",
      timestampTime: u.createdAt
        ? new Date(u.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "-",
    }));
  }, [dbUsers]);

  const filteredUsers = useMemo(
    () =>
      usersTable.filter(
        (user) =>
          activePermissionTab === "All" || user.role === activePermissionTab,
      ),
    [activePermissionTab, usersTable],
  );

  const searchedUsers = useMemo(() => {
    const q = userSearchQuery.trim().toLowerCase();
    if (!q) return filteredUsers;

    return filteredUsers.filter((user) => {
      const haystack = [
        user.name,
        user.email,
        user.role,
        user.status,
        user.initiator,
        user.timestampDate,
        user.timestampTime,
      ]
        .map((v) => String(v ?? "").toLowerCase())
        .join(" ");

      return haystack.includes(q);
    });
  }, [filteredUsers, userSearchQuery]);

  const usersTotalItems = searchedUsers.length;
  const usersTotalPages = Math.max(
    1,
    Math.ceil(usersTotalItems / usersItemsPerPage),
  );
  const usersStartIndex = (usersCurrentPage - 1) * usersItemsPerPage;
  const paginatedUsers = searchedUsers.slice(
    usersStartIndex,
    usersStartIndex + usersItemsPerPage,
  );

  useEffect(() => {
    setUsersCurrentPage((page) => Math.min(page, usersTotalPages));
  }, [usersTotalPages]);

  useEffect(() => {
    setUsersCurrentPage(1);
  }, [activePermissionTab, userSearchQuery]);

  const statusStyles: Record<string, string> = {
    Active: "bg-green-50 text-green-700",
    locked: "bg-red-50 text-red-500",
  };

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
              onClick={handleExportUsers}
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
              type="button"
              onClick={openCreateUser}
              className="inline-flex items-center cursor-pointer justify-center bg-[#15BA5C] text-nowrap px-4 py-2.5 text-white rounded-[10px] text-sm font-medium hover:bg-green-600 transition-colors"
            >
              Add New User
            </button>
          </div>
        </section>

        <section className="relative mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2 items-end">
              <button
                type="button"
                onClick={() =>
                  scrollRef.current?.scrollBy({
                    left: -320,
                    behavior: "smooth",
                  })
                }
                className="absolute -left-[20px] top-[50%]  -translate-y-[50%] cursor-pointer w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50"
                aria-label="Scroll roles left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  scrollRef.current?.scrollBy({ left: 320, behavior: "smooth" })
                }
                className="absolute -right-[20px] top-[50%]  -translate-y-[50%] cursor-pointer w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50"
                aria-label="Scroll roles right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto py-2 pr-2 scroll-smooth snap-x snap-mandatory"
          >
            {dbRoles.map((role) => (
              <div
                key={role.id}
                className="min-w-[240px] max-w-[280px] bg-[#1F2933] rounded-2xl overflow-hidden shrink-0 snap-start"
              >
                <div className="px-4 py-4 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 text-white text-[0.95rem] font-semibold">
                      <div className="w-8 h-8 rounded-lg bg-[#2D3742] flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <span>{roleCounts[role.name] || 0} Users</span>
                    </div>
                    <p className="mt-4 text-sm text-white">{role.name}</p>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => openEditRole(role)}
                      className="w-7 h-7 rounded-full bg-[#15BA5C] flex items-center justify-center hover:bg-green-500"
                      aria-label={`Edit ${role.name}`}
                    >
                      <SquarePen className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                </div>
                <div className="h-[6px] bg-[#15BA5C] rounded-b-2xl" />
              </div>
            ))}
          </div>
        </section>
      </section>
      <section className="bg-white px-7 py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h3 className="font-bold text-[1.5rem] text-[#1C1B20]">Roles</h3>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex w-full md:w-[260px] h-10 rounded-l-[10px] overflow-hidden border border-[#E5E7EB] bg-white">
              <input
                type="text"
                placeholder="Search users"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="flex-1 px-3 text-sm text-[#4B5563] outline-none border-none"
              />
              <button
                type="button"
                className="w-10 flex items-center justify-center bg-[#15BA5C] text-white hover:bg-green-600 transition-colors"
                aria-label="Search users"
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
              onClick={openManagePermission}
              className="inline-flex items-center cursor-pointer gap-2 border border-[#15BA5C] text-nowrap px-4 py-2 rounded-[12px] text-sm font-medium text-[#15BA5C] bg-white hover:bg-green-50 transition-colors"
              type="button"
            >
              <svg
                width="21"
                height="21"
                viewBox="0 0 21 21"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13.72 12.7636C16.7738 12.7636 19.25 10.2979 19.25 7.25638C19.25 4.21488 16.7738 1.75 13.72 1.75C10.6663 1.75 8.19263 4.21575 8.19263 7.25638C8.19263 8.66513 8.83488 9.68975 8.83488 9.68975L2.14813 16.3485C1.848 16.6478 1.428 17.4247 2.14813 18.1422L2.91988 18.9105C3.22 19.1669 3.97425 19.5256 4.59113 18.9105L5.49238 18.0145C6.39188 18.9105 7.42088 18.3986 7.80675 17.8859C8.449 16.9899 7.67813 16.093 7.67813 16.093L7.93538 15.8366C9.16913 17.0669 10.2498 16.3494 10.6356 15.8366C11.2788 14.9406 10.6356 14.0437 10.6356 14.0437C10.3784 13.5319 9.86388 13.5319 10.507 12.8914L11.2788 12.1231C11.8956 12.635 13.1644 12.7636 13.7218 12.7636H13.72Z"
                  stroke="#15BA5C"
                  stroke-width="1.3125"
                  stroke-linejoin="round"
                />
                <path
                  opacity="0.5"
                  d="M15.6494 7.25744C15.6482 7.76783 15.4444 8.25687 15.0828 8.61703C14.7211 8.9772 14.2313 9.179 13.7209 9.17807C13.4681 9.17864 13.2177 9.12942 12.9839 9.03321C12.7501 8.937 12.5376 8.79569 12.3584 8.61734C12.1793 8.439 12.037 8.22711 11.9397 7.99378C11.8424 7.76044 11.7921 7.51024 11.7915 7.25744C11.792 7.00457 11.8422 6.75427 11.9395 6.52084C12.0367 6.28741 12.1789 6.07542 12.3581 5.89698C12.5373 5.71854 12.7498 5.57715 12.9837 5.48088C13.2175 5.38462 13.468 5.33537 13.7209 5.33594C13.9737 5.33548 14.2241 5.38482 14.4578 5.48113C14.6915 5.57745 14.904 5.71886 15.0831 5.89729C15.2622 6.07571 15.4043 6.28767 15.5015 6.52104C15.5987 6.75442 15.6489 7.00465 15.6494 7.25744Z"
                  stroke="#15BA5C"
                  stroke-width="1.3125"
                />
              </svg>
              <span>Manage Permissions</span>
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

              {!isLoadingUsers && searchedUsers.length === 0 && (
                <div className="px-6 py-10 my-5">
                  <NotFound />
                </div>
              )}

              {!isLoadingUsers && searchedUsers.length > 0 && (
                <>
                  {paginatedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="grid grid-cols-12 gap-6 px-6 py-3 text-[14px] md:text-[15px] text-[#374151] border-t border-[#F3F4F6] items-center"
                    >
                      <div className="col-span-3 min-w-0">
                        <span className="block truncate">{user.name}</span>
                        <span className="block truncate text-[0.7rem] text-[#9CA3AF]">
                          {user.email || "-"}
                        </span>
                      </div>
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
                      <div className="truncate col-span-2">
                        {user.initiator}
                      </div>
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
                          <div className="absolute right-0 bottom-full mb-2 z-1000000 w-44 rounded-[14px] bg-black py-2 shadow-lg">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingUser(user);
                                closeMenu();
                              }}
                              className="flex w-full items-center gap-2 px-4 py-2 text-xs text-white hover:bg-[#111111]"
                            >
                              <PenLine className="w-4 h-4" />
                              <span>Edit User</span>
                            </button>

                            <div className="mx-4 my-1 h-px bg-[#3F3F3F]" />
                            <button
                              type="button"
                              onClick={() => {
                                handleToggleSuspendUser(
                                  user.id,
                                  String(user.status),
                                );
                                closeMenu();
                              }}
                              className={`flex w-full items-center gap-2 px-4 py-2 text-xs hover:bg-[#111111] ${
                                user.status === "locked"
                                  ? "text-[#15BA5C]"
                                  : "text-[#FACC15]"
                              }`}
                            >
                              <UserX className="w-4 h-4" />
                              <span>
                                {user.status === "locked"
                                  ? "Unsuspend User"
                                  : "Suspend User"}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  <Pagination
                    currentPage={usersCurrentPage}
                    totalPages={usersTotalPages}
                    onPageChange={setUsersCurrentPage}
                    itemsPerPage={usersItemsPerPage}
                    onItemsPerPageChange={(items) => {
                      setUsersItemsPerPage(items);
                      setUsersCurrentPage(1);
                    }}
                    totalItems={usersTotalItems}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {isCreateRoleOpen && (
        <div className="fixed inset-0 z-2000000 flex items-center justify-center bg-black/40">
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
              <CreateRole onSuccess={fetchRolesAndUsers} />
            </div>
          </div>
        </div>
      )}
      {editingUser && (
        <EditUser
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={fetchRolesAndUsers}
        />
      )}

      {isCreateUserOpen && (
        <div className="fixed inset-0 z-9000 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-5xl bg-white rounded-[20px] shadow-xl">
            <div className="flex items-center justify-between px-8 pt-6 pb-4">
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
              <CreateUser onSuccess={fetchRolesAndUsers} />
            </div>
          </div>
        </div>
      )}

      <AssignPinModal isOpen={isAssignPinOpen} onClose={closeAssignPin} />

      {isManagePermissionOpen && (
        <ManagePermission onSuccess={fetchRolesAndUsers} />
      )}

      {isEditRoleOpen && <EditRole onSuccess={fetchRolesAndUsers} />}
    </section>
  );
};

export default RolesAndPermissionPage;
