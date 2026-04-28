import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Pagination } from "@/shared/Pagination/pagination";
import RequestLog from "./RequestLog";
import { useBusinessStore } from "@/stores/useBusinessStore";
import useToastStore from "@/stores/toastStore";
import ApprovalLogStatusBadge from "./getStatusBadge";

type ApprovalRow = {
  key: string;
  requestId: string;
  requestedBy: string;
  preparationArea: string;
  itemCount: number;
  status: string;
  date: string;
  meta?: {
    type: "inventory" | "production";
    approvalLogId?: string;
    productionId?: string;
  };
};

type ActivityLogMainTabProps = {
  onClose: () => void;
};

const ActivityLogMainTab = ({ onClose }: ActivityLogMainTabProps) => {
  const selectedOutlet = useBusinessStore((s) => s.selectedOutlet);
  const { showToast } = useToastStore();
  const [activeTab, setActiveTab] = useState<
    "inventory_request" | "production_request"
  >("inventory_request");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [, setIsFilterOpen] = useState<boolean>(false);
  const [isTableLoading, setIsTableLoading] = useState<boolean>(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [isRequestLogOpen, setIsRequestLogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRow | null>(
    null,
  );
  const [productionRows, setProductionRows] = useState<ApprovalRow[]>([]);
  const [hasTriedProductionSync, setHasTriedProductionSync] =
    useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => setRefreshKey((k) => k + 1);
    window.addEventListener("production-approval-updated", handler as any);
    return () => {
      window.removeEventListener("production-approval-updated", handler as any);
    };
  }, []);

  const inventoryRows: ApprovalRow[] = [
    {
      requestId: "0047573",
      requestedBy: "David",
      preparationArea: "Bakery",
      itemCount: 20,
      status: "Pending",
      date: "09-09-2025",
    },
    {
      requestId: "0083742",
      requestedBy: "Chioma",
      preparationArea: "Kitchen",
      itemCount: 12,
      status: "Pending",
      date: "09-09-2025",
    },
    {
      requestId: "0083742",
      requestedBy: "Henry",
      preparationArea: "Bakery",
      itemCount: 20,
      status: "Pending",
      date: "09-09-2025",
    },
    {
      requestId: "0061128",
      requestedBy: "Amina",
      preparationArea: "Kitchen",
      itemCount: 8,
      status: "Pending",
      date: "10-09-2025",
    },
    {
      requestId: "0090441",
      requestedBy: "Kelechi",
      preparationArea: "Bakery",
      itemCount: 14,
      status: "Pending",
      date: "10-09-2025",
    },
    {
      requestId: "0029183",
      requestedBy: "Grace",
      preparationArea: "Kitchen",
      itemCount: 6,
      status: "Pending",
      date: "11-09-2025",
    },
    {
      requestId: "0017740",
      requestedBy: "Samuel",
      preparationArea: "Bakery",
      itemCount: 24,
      status: "Pending",
      date: "11-09-2025",
    },
    {
      requestId: "0075032",
      requestedBy: "Ibrahim",
      preparationArea: "Kitchen",
      itemCount: 10,
      status: "Pending",
      date: "12-09-2025",
    },
    {
      requestId: "0039814",
      requestedBy: "Efe",
      preparationArea: "Bakery",
      itemCount: 18,
      status: "Pending",
      date: "12-09-2025",
    },
    {
      requestId: "0056609",
      requestedBy: "Tola",
      preparationArea: "Kitchen",
      itemCount: 9,
      status: "Pending",
      date: "13-09-2025",
    },
    {
      requestId: "0082216",
      requestedBy: "Mariam",
      preparationArea: "Bakery",
      itemCount: 16,
      status: "Pending",
      date: "13-09-2025",
    },
    {
      requestId: "0097712",
      requestedBy: "Daniel",
      preparationArea: "Kitchen",
      itemCount: 11,
      status: "Pending",
      date: "14-09-2025",
    },
    {
      requestId: "0031145",
      requestedBy: "Zainab",
      preparationArea: "Bakery",
      itemCount: 7,
      status: "Pending",
      date: "14-09-2025",
    },
    {
      requestId: "0064908",
      requestedBy: "Victor",
      preparationArea: "Kitchen",
      itemCount: 13,
      status: "Pending",
      date: "15-09-2025",
    },
    {
      requestId: "0026089",
      requestedBy: "Ruth",
      preparationArea: "Bakery",
      itemCount: 21,
      status: "Pending",
      date: "15-09-2025",
    },
    {
      requestId: "0071180",
      requestedBy: "Fatima",
      preparationArea: "Kitchen",
      itemCount: 5,
      status: "Pending",
      date: "16-09-2025",
    },
    {
      requestId: "0045501",
      requestedBy: "Ola",
      preparationArea: "Bakery",
      itemCount: 19,
      status: "Pending",
      date: "16-09-2025",
    },
    {
      requestId: "0013207",
      requestedBy: "Chinedu",
      preparationArea: "Kitchen",
      itemCount: 15,
      status: "Pending",
      date: "17-09-2025",
    },
    {
      requestId: "0091038",
      requestedBy: "Esther",
      preparationArea: "Bakery",
      itemCount: 12,
      status: "Pending",
      date: "17-09-2025",
    },
    {
      requestId: "0057126",
      requestedBy: "Bola",
      preparationArea: "Kitchen",
      itemCount: 9,
      status: "Pending",
      date: "18-09-2025",
    },
  ].map((r, idx) => ({
    ...r,
    key: `inv-${r.requestId}-${idx}`,
    meta: { type: "inventory" as const },
  }));

  const formatDate = (raw: string | null | undefined) => {
    if (!raw) return "-";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return String(raw);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const titleCase = (value: string) => {
    const s = String(value || "").trim();
    if (!s) return "-";
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  useEffect(() => {
    const fetchProductionApprovalLogs = async () => {
      const api: any = (window as any).electronAPI;
      if (!api?.dbQuery || !selectedOutlet?.id) {
        setProductionRows([]);
        return;
      }

      let rows: any[] = [];
      let approvalStatusExpr = "'Pending'";
      try {
        let approvalLogColumns: string[] = [];
        try {
          const info = await api.dbQuery(
            "PRAGMA table_info('production_v2_approval_logs')",
          );
          approvalLogColumns = (info || [])
            .map((c: any) => String(c?.name || "").trim())
            .filter(Boolean);
        } catch {
          approvalLogColumns = [];
        }

        const approvalLogHasStatus = approvalLogColumns.includes("status");
        const approvalLogHasApprovedAt =
          approvalLogColumns.includes("approvedAt");
        const approvalLogHasRejectedAt =
          approvalLogColumns.includes("rejectedAt");
        const approvalLogHasApprovedBy =
          approvalLogColumns.includes("approvedBy");
        const approvalLogHasRejectedBy =
          approvalLogColumns.includes("rejectedBy");

        const rejectedChecks: string[] = [];
        if (approvalLogHasRejectedAt) {
          rejectedChecks.push("COALESCE(pal.rejectedAt, '') <> ''");
        }
        if (approvalLogHasRejectedBy) {
          rejectedChecks.push("COALESCE(pal.rejectedBy, '') <> ''");
        }

        const approvedChecks: string[] = [];
        if (approvalLogHasApprovedAt) {
          approvedChecks.push("COALESCE(pal.approvedAt, '') <> ''");
        }
        if (approvalLogHasApprovedBy) {
          approvedChecks.push("COALESCE(pal.approvedBy, '') <> ''");
        }

        approvalStatusExpr = approvalLogHasStatus
          ? "COALESCE(pal.status, 'Pending')"
          : `CASE
              WHEN (${rejectedChecks.length ? rejectedChecks.join(" OR ") : "0"}) THEN 'Rejected'
              WHEN (${approvedChecks.length ? approvedChecks.join(" OR ") : "0"}) THEN 'Approved'
              ELSE 'Pending'
            END`;

        rows = await api.dbQuery(
          `
            SELECT
              pal.id as approvalLogId,
              (${approvalStatusExpr}) as approvalStatus,
              pal.createdAt as approvalCreatedAt,
              p.id as productionId,
              p.batchId as batchId,
              p.initiator as initiator,
              p.workflowPath as workflowPath,
              (
                SELECT COUNT(*)
                FROM production_v2_items pi
                WHERE pi.productionId = p.id
              ) as ordersCount
            FROM production_v2_approval_logs pal
            JOIN productions_v2 p ON p.id = pal.productionId
            WHERE p.outletId = ?
            ORDER BY pal.createdAt DESC
          `,
          [selectedOutlet.id],
        );
        console.log(rows, "This is the rows");
      } catch (e: any) {
        const msg = String(e?.message || e || "");
        if (msg.includes("no such table: production_v2_approval_logs")) {
          showToast(
            "error",
            "Update required",
            "Restart the app to load production approval logs",
          );
        } else {
          showToast(
            "error",
            "Error",
            "Failed to load production approval logs",
          );
        }
        console.error("Failed to query production approval logs:", e);
        rows = [];
      }

      if (
        rows.length === 0 &&
        !hasTriedProductionSync &&
        typeof api?.triggerSync === "function"
      ) {
        setHasTriedProductionSync(true);
        try {
          await api.triggerSync();
          rows = await api.dbQuery(
            `
              SELECT
                pal.id as approvalLogId,
                (${approvalStatusExpr}) as approvalStatus,
                pal.createdAt as approvalCreatedAt,
                p.id as productionId,
                p.batchId as batchId,
                p.initiator as initiator,
                p.workflowPath as workflowPath,
                (
                  SELECT COUNT(*)
                  FROM production_v2_items pi
                  WHERE pi.productionId = p.id
                ) as ordersCount
              FROM production_v2_approval_logs pal
              JOIN productions_v2 p ON p.id = pal.productionId
              WHERE p.outletId = ?
              ORDER BY pal.createdAt DESC
            `,
            [selectedOutlet.id],
          );
        } catch (e) {
          console.error(
            "Failed to sync and reload production approval logs:",
            e,
          );
        }
      }

      setProductionRows(
        (rows || []).map((r: any) => ({
          key: String(r.approvalLogId || r.productionId || ""),
          requestId: String(r.batchId || r.productionId || ""),
          requestedBy: String(r.initiator || "-"),
          preparationArea: String(r.workflowPath || "-"),
          itemCount: Number(r.ordersCount || 0),
          status: titleCase(String(r.approvalStatus || "pending")),
          date: formatDate(r.approvalCreatedAt),
          meta: {
            type: "production",
            approvalLogId: String(r.approvalLogId || ""),
            productionId: String(r.productionId || ""),
          },
        })),
      );
    };

    setIsTableLoading(true);

    if (activeTab === "production_request") {
      fetchProductionApprovalLogs()
        .catch((e) => {
          console.error("Failed to fetch production approval logs:", e);
          setProductionRows([]);
        })
        .finally(() => setIsTableLoading(false));
      return;
    }

    const timeout = setTimeout(() => setIsTableLoading(false), 700);
    return () => clearTimeout(timeout);
  }, [activeTab, refreshKey, selectedOutlet?.id]);

  const filteredRows = useMemo(() => {
    const baseRows =
      activeTab === "inventory_request" ? inventoryRows : productionRows;
    const value = searchTerm.trim().toLowerCase();
    if (!value) return baseRows;
    return baseRows.filter(
      (row) =>
        row.requestId.toLowerCase().includes(value) ||
        row.requestedBy.toLowerCase().includes(value) ||
        row.preparationArea.toLowerCase().includes(value) ||
        row.status.toLowerCase().includes(value) ||
        row.date.toLowerCase().includes(value),
    );
  }, [activeTab, inventoryRows, productionRows, searchTerm]);

  const rowKeys = useMemo(
    () => filteredRows.map((row) => row.key),
    [filteredRows],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / itemsPerPage));

  const paginatedRowsWithKeys = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRows
      .slice(startIndex, startIndex + itemsPerPage)
      .map((row) => ({
        row,
        rowKey: row.key,
      }));
  }, [currentPage, filteredRows, itemsPerPage]);

  const isAllSelected =
    rowKeys.length > 0 && rowKeys.every((key) => selectedRowKeys.includes(key));

  const toggleAllRows = (checked: boolean) => {
    if (checked) {
      setSelectedRowKeys(rowKeys);
      return;
    }
    setSelectedRowKeys([]);
  };

  const toggleRow = (key: string, checked: boolean) => {
    if (checked) {
      setSelectedRowKeys((prev) =>
        prev.includes(key) ? prev : [...prev, key],
      );
      return;
    }
    setSelectedRowKeys((prev) => prev.filter((k) => k !== key));
  };

  useEffect(() => {
    setSelectedRowKeys((prev) => prev.filter((key) => rowKeys.includes(key)));
  }, [rowKeys]);

  const handleOpenRequestLog = (row: ApprovalRow) => {
    setSelectedRequest(row);
    setIsRequestLogOpen(true);
  };

  return (
    <div className="w-full max-w-[860px] bg-white flex flex-col h-full overflow-hidden shadow-2xl rounded-l-[24px]">
      <div className="px-8 pt-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[24px] font-bold text-[#1C1B20]">Approval Log</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
          >
            <X className="size-6 text-[#737373]" />
          </button>
        </div>

        <div className="flex gap-8">
          <button
            type="button"
            onClick={() => setActiveTab("inventory_request")}
            className={`pb-4 text-[15px] font-medium transition-all relative ${
              activeTab === "inventory_request"
                ? "text-[#1C1B20]"
                : "text-[#6B7280]"
            }`}
          >
            Inventory Requests
            {activeTab === "inventory_request" && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#15BA5C] rounded-t-full" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("production_request")}
            className={`pb-4 text-[15px] font-medium transition-all relative ${
              activeTab === "production_request"
                ? "text-[#1C1B20]"
                : "text-[#6B7280]"
            }`}
          >
            Production Requests
            {activeTab === "production_request" && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#15BA5C] rounded-t-full" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10">
        {activeTab === "inventory_request" ? (
          <>
            <div className="">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search"
                    className="w-[180px] h-10 px-4 bg-white border border-gray-200 rounded-l-[10px] outline-none focus:border-[#15BA5C] transition-all text-sm placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    className="h-10 px-4 bg-[#15BA5C] text-white rounded-r-[10px] hover:bg-[#119E4D] transition-colors cursor-pointer flex items-center justify-center"
                  >
                    <Search className="size-5" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen(true)}
                    className="h-11 px-5 bg-white border border-gray-200 rounded-[10px] text-[14px] font-medium text-[#4B5563] hover:bg-gray-50 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    Filters
                    <SlidersHorizontal className="size-4 text-gray-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFilterOpen(true)}
                    className="h-11 px-5 bg-[#15BA5C] border border-[#15BA5C] rounded-[10px] text-[14px] font-medium text-white hover:bg-[#119E4D] transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 28 28"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M13.9998 23.3333C11.5245 23.3333 9.15051 22.35 7.40017 20.5997C5.64983 18.8493 4.6665 16.4754 4.6665 14M23.3332 14C23.334 15.3993 23.0198 16.7807 22.4139 18.042C21.8081 19.3033 20.926 20.412 19.8332 21.2858"
                        stroke="white"
                        stroke-width="1.75"
                        stroke-linecap="round"
                      />
                      <path
                        d="M14 16.3346V4.66797M14 4.66797L17.5 8.16797M14 4.66797L10.5 8.16797"
                        stroke="white"
                        stroke-width="1.75"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    Export
                  </button>
                </div>
              </div>
              <div className="mt-6  rounded-[14px] overflow-hidden">
                <div className="grid grid-cols-[44px_1.1fr_1fr_1fr_0.9fr_0.9fr_1fr] gap-4  py-4 text-[#A0A0A0] text-[15px] font-medium border-b border-[#F4F4F4]">
                  <div className="flex items-center justify-center">
                    {!isTableLoading && filteredRows.length > 0 && (
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={(e) => toggleAllRows(e.target.checked)}
                        className="size-[18px] cursor-pointer accent-[#15BA5C]"
                      />
                    )}
                  </div>
                  <p className="text-nowrap">Request ID</p>
                  <p className="text-nowrap">Requested by</p>
                  <p className="text-nowrap">Preparation Area</p>
                  <p className="text-nowrap">Item Count</p>
                  <p className="text-nowrap">Status</p>
                  <p className="text-nowrap">Date</p>
                </div>

                {isTableLoading ? (
                  <div className="divide-y divide-[#F4F4F4]">
                    {[...Array(4)].map((_, idx) => (
                      <div
                        key={`skeleton-${idx}`}
                        className="grid grid-cols-[44px_1.1fr_1fr_1fr_0.9fr_0.9fr_1fr] gap-4  py-6 animate-pulse"
                      >
                        <div className="flex items-center justify-center">
                          <div className="w-[18px] h-[18px] rounded-[4px] bg-gray-200" />
                        </div>
                        <div className="h-5 rounded bg-gray-200 w-20" />
                        <div className="h-5 rounded bg-gray-200 w-24" />
                        <div className="h-5 rounded bg-gray-200 w-24" />
                        <div className="h-5 rounded bg-gray-200 w-12" />
                        <div className="h-7 rounded-[8px] bg-gray-200 w-20" />
                        <div className="h-5 rounded bg-gray-200 w-24" />
                      </div>
                    ))}
                  </div>
                ) : filteredRows.length === 0 ? (
                  <div className=" py-16 flex flex-col items-center justify-center text-center">
                    <p className="text-[#1C1B20] font-semibold text-[16px]">
                      No Approval Logs Found
                    </p>
                    <p className="text-[#8B8B8B] text-[14px] mt-1">
                      Try another search term or clear your filters.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#F4F4F4]">
                    {paginatedRowsWithKeys.map(({ row, rowKey }) => {
                      return (
                        <div
                          key={rowKey}
                          className="grid grid-cols-[44px_1.1fr_1fr_1fr_0.9fr_0.9fr_1fr] gap-4 py-6 text-[34px]"
                        >
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={selectedRowKeys.includes(rowKey)}
                              onChange={(e) =>
                                toggleRow(rowKey, e.target.checked)
                              }
                              className="size-[18px] cursor-pointer accent-[#15BA5C]"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenRequestLog(row)}
                            className="text-left text-[#15BA5C] text-[16px] font-medium cursor-pointer hover:underline"
                          >
                            {row.requestId}
                          </button>
                          <div className="text-[#1C1B20] text-[16px] font-medium">
                            {row.requestedBy}
                          </div>
                          <div className="text-[#1C1B20] text-[16px] font-medium">
                            {row.preparationArea}
                          </div>
                          <div className="text-[#1C1B20] text-[16px] font-medium">
                            {row.itemCount}
                          </div>
                          <div>
                            <span className="inline-flex h-8 items-center px-3 rounded-[8px] text-[14px] font-medium bg-[#FFF8E5] text-[#E4A801]">
                              {row.status}
                            </span>
                          </div>
                          <div className="text-[#1C1B20] text-[15px] font-medium">
                            {row.date}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {!isTableLoading && filteredRows.length > 0 && (
                  <>
                    <Pagination
                      currentPage={Math.min(currentPage, totalPages)}
                      totalPages={totalPages}
                      onPageChange={(page) => setCurrentPage(page)}
                      itemsPerPage={itemsPerPage}
                      onItemsPerPageChange={(items) => {
                        setItemsPerPage(items);
                        setCurrentPage(1);
                      }}
                      totalItems={filteredRows.length}
                      className="bg-white"
                    />

                    <div className="flex items-center gap-4 mt-[15px]">
                      <button
                        type="button"
                        className="bg-[#E33629] flex-1 cursor-pointer text-white px-5 py-3 text-[15px] rounded-[10px]"
                      >
                        Reject Selected
                      </button>
                      <button
                        type="button"
                        className="bg-[#15BA5C] flex-1 cursor-pointer text-white px-5 py-3 text-[15px] rounded-[10px]"
                      >
                        Approve Selected
                      </button>
                      <button
                        type="button"
                        className="bg-[#15BA5C] flex-1 cursor-pointer text-white px-5 py-3 text-[15px] rounded-[10px]"
                      >
                        Approve All
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search"
                    className="w-[180px] h-10 px-4 bg-white border border-gray-200 rounded-l-[10px] outline-none focus:border-[#15BA5C] transition-all text-sm placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    className="h-10 px-4 bg-[#15BA5C] text-white rounded-r-[10px] hover:bg-[#119E4D] transition-colors cursor-pointer flex items-center justify-center"
                  >
                    <Search className="size-5" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen(true)}
                    className="h-11 px-5 bg-white border border-gray-200 rounded-[10px] text-[14px] font-medium text-[#4B5563] hover:bg-gray-50 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    Filters
                    <SlidersHorizontal className="size-4 text-gray-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFilterOpen(true)}
                    className="h-11 px-5 bg-[#15BA5C] border border-[#15BA5C] rounded-[10px] text-[14px] font-medium text-white hover:bg-[#119E4D] transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 28 28"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M13.9998 23.3333C11.5245 23.3333 9.15051 22.35 7.40017 20.5997C5.64983 18.8493 4.6665 16.4754 4.6665 14M23.3332 14C23.334 15.3993 23.0198 16.7807 22.4139 18.042C21.8081 19.3033 20.926 20.412 19.8332 21.2858"
                        stroke="white"
                        stroke-width="1.75"
                        stroke-linecap="round"
                      />
                      <path
                        d="M14 16.3346V4.66797M14 4.66797L17.5 8.16797M14 4.66797L10.5 8.16797"
                        stroke="white"
                        stroke-width="1.75"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    Export
                  </button>
                </div>
              </div>
              <div className="mt-6  rounded-[14px] overflow-hidden">
                <div className="grid grid-cols-[44px_1.1fr_1fr_0.9fr_0.9fr_1fr] gap-4  py-4 text-[#A0A0A0] text-[15px] font-medium border-b border-[#F4F4F4]">
                  <div className="flex items-center justify-center">
                    {!isTableLoading && filteredRows.length > 0 && (
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={(e) => toggleAllRows(e.target.checked)}
                        className="size-[18px] cursor-pointer accent-[#15BA5C]"
                      />
                    )}
                  </div>
                  <p className="text-nowrap">Request ID</p>
                  <p className="text-nowrap">Requested by</p>
                  <p className="text-nowrap">Amount of Orders</p>
                  <p className="text-nowrap">Status</p>
                  <p className="text-nowrap">Date</p>
                </div>

                {isTableLoading ? (
                  <div className="divide-y divide-[#F4F4F4]">
                    {[...Array(4)].map((_, idx) => (
                      <div
                        key={`skeleton-${idx}`}
                        className="grid grid-cols-[44px_1.1fr_1fr_0.9fr_0.9fr_1fr] gap-4  py-6 animate-pulse"
                      >
                        <div className="flex items-center justify-center">
                          <div className="w-[18px] h-[18px] rounded-[4px] bg-gray-200" />
                        </div>
                        <div className="h-5 rounded bg-gray-200 w-20" />
                        <div className="h-5 rounded bg-gray-200 w-24" />
                        <div className="h-5 rounded bg-gray-200 w-24" />
                        <div className="h-5 rounded bg-gray-200 w-12" />
                        <div className="h-7 rounded-[8px] bg-gray-200 w-20" />
                        <div className="h-5 rounded bg-gray-200 w-24" />
                      </div>
                    ))}
                  </div>
                ) : filteredRows.length === 0 ? (
                  <div className=" py-16 flex flex-col items-center justify-center text-center">
                    <p className="text-[#1C1B20] font-semibold text-[16px]">
                      No Approval Logs Found
                    </p>
                    <p className="text-[#8B8B8B] text-[14px] mt-1">
                      Try another search term or clear your filters.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#F4F4F4]">
                    {paginatedRowsWithKeys.map(({ row, rowKey }) => {
                      return (
                        <div
                          key={rowKey}
                          className="grid grid-cols-[44px_1.1fr_1fr_0.9fr_0.9fr_1fr] gap-4 py-6 text-[34px]"
                        >
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={selectedRowKeys.includes(rowKey)}
                              onChange={(e) =>
                                toggleRow(rowKey, e.target.checked)
                              }
                              className="size-[18px] cursor-pointer accent-[#15BA5C]"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenRequestLog(row)}
                            className="text-left text-[#15BA5C] text-[16px] font-medium cursor-pointer hover:underline"
                          >
                            {row.requestId}
                          </button>
                          <div className="text-[#1C1B20] text-[16px] font-medium">
                            {row.requestedBy}
                          </div>

                          <div className="text-[#1C1B20] text-[16px] font-medium">
                            {row.itemCount}
                          </div>
                          <div>
                            <ApprovalLogStatusBadge status={row.status} />
                          </div>
                          <div className="text-[#1C1B20] text-[15px] font-medium">
                            {row.date}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {!isTableLoading && filteredRows.length > 0 && (
                  <>
                    <Pagination
                      currentPage={Math.min(currentPage, totalPages)}
                      totalPages={totalPages}
                      onPageChange={(page) => setCurrentPage(page)}
                      itemsPerPage={itemsPerPage}
                      onItemsPerPageChange={(items) => {
                        setItemsPerPage(items);
                        setCurrentPage(1);
                      }}
                      totalItems={filteredRows.length}
                      className="bg-white"
                    />

                    <div className="flex items-center gap-4 mt-[15px]">
                      <button
                        type="button"
                        className="bg-[#E33629] flex-1 cursor-pointer text-white px-5 py-3 text-[15px] rounded-[10px]"
                      >
                        Reject Selected
                      </button>
                      <button
                        type="button"
                        className="bg-[#15BA5C] flex-1 cursor-pointer text-white px-5 py-3 text-[15px] rounded-[10px]"
                      >
                        Approve Selected
                      </button>
                      <button
                        type="button"
                        className="bg-[#15BA5C] flex-1 cursor-pointer text-white px-5 py-3 text-[15px] rounded-[10px]"
                      >
                        Approve All
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <RequestLog
        isOpen={isRequestLogOpen}
        request={selectedRequest}
        onClose={() => setIsRequestLogOpen(false)}
      />
    </div>
  );
};

export default ActivityLogMainTab;
