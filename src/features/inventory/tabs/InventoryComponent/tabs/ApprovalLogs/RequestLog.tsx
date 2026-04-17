import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ApprovalLogStatusBadge from "./getStatusBadge";

 const formatDate = (raw: string | null | undefined) => {
   if (!raw) return "-";
   const d = new Date(raw);
   if (Number.isNaN(d.getTime())) return String(raw);
   const dd = String(d.getDate()).padStart(2, "0");
   const mm = String(d.getMonth() + 1).padStart(2, "0");
   const yyyy = d.getFullYear();
   return `${dd}-${mm}-${yyyy}`;
 };

type RequestLogProps = {
  isOpen: boolean;
  onClose: () => void;
  request?: {
    key?: string;
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
  } | null;
};

type RequestOrderRow = {
  id: string;
  productsOrdered: string;
  status: string;
  comment: string;
};

type ApprovalLogItemRow = {
  id: string;
  itemName: string;
  requiredQuantity: string;
  availableQuantity: string;
  isSufficient: boolean;
  ingredientType: string;
};

const RequestLog = ({ isOpen, onClose, request }: RequestLogProps) => {
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [commentsByRowId, setCommentsByRowId] = useState<
    Record<string, string>
  >({});
  const [shouldRender, setShouldRender] = useState<boolean>(false);
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);
  const [isDetailsLoading, setIsDetailsLoading] = useState<boolean>(false);
  const [approvalLogItems, setApprovalLogItems] = useState<
    ApprovalLogItemRow[]
  >([]);
  const [approvalLogMeta, setApprovalLogMeta] = useState<{
    status: string;
    createdAt: string;
    approvedBy: string | null;
    rejectedBy: string | null;
    approvedAt: string | null;
    rejectedAt: string | null;
    notes: string | null;
  } | null>(null);

  const orderRows = useMemo<RequestOrderRow[]>(() => {
    if (!request?.requestId) return [];
    if (request.requestId === "0047573") {
      return [
        {
          id: "ORD01",
          productsOrdered: "Cake +2",
          status: "Pending",
          comment: "",
        },
        {
          id: "ORD02",
          productsOrdered: "Pizza +2",
          status: "Pending",
          comment: "",
        },
        {
          id: "ORD03",
          productsOrdered: "Indomie +2",
          status: "Pending",
          comment: "",
        },
      ];
    }
    return [
      {
        id: "ORD01",
        productsOrdered: "Bread +1",
        status: "Pending",
        comment: "",
      },
      {
        id: "ORD02",
        productsOrdered: "Milk +3",
        status: "Pending",
        comment: "",
      },
      {
        id: "ORD03",
        productsOrdered: "Flour +2",
        status: "Pending",
        comment: "",
      },
    ];
  }, [request?.requestId]);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const raf = requestAnimationFrame(() => setIsPanelOpen(true));
      setSelectedRowIds([]);
      setCommentsByRowId({});
      return () => cancelAnimationFrame(raf);
    }

    setIsPanelOpen(false);
    const timeout = setTimeout(() => setShouldRender(false), 250);
    return () => clearTimeout(timeout);
  }, [isOpen, request?.requestId]);

  const isProductionApprovalLog =
    request?.meta?.type === "production" && !!request?.meta?.approvalLogId;

  useEffect(() => {
    if (!isOpen) return;
    if (!isProductionApprovalLog) {
      setApprovalLogItems([]);
      setApprovalLogMeta(null);
      setIsDetailsLoading(false);
      return;
    }

    const api: any = (window as any).electronAPI;
    if (!api?.dbQuery) {
      setApprovalLogItems([]);
      setApprovalLogMeta(null);
      setIsDetailsLoading(false);
      return;
    }

    setIsDetailsLoading(true);
    (async () => {
      const approvalLogId = request?.meta?.approvalLogId || "";
      const metaRows = await api.dbQuery(
        `
          SELECT
            pal.status as status,
            pal.createdAt as createdAt,
            pal.approvedBy as approvedBy,
            pal.rejectedBy as rejectedBy,
            pal.approvedAt as approvedAt,
            pal.rejectedAt as rejectedAt,
            pal.notes as notes
          FROM production_v2_approval_logs pal
          WHERE pal.id = ?
          LIMIT 1
        `,
        [approvalLogId],
      );

      const items = await api.dbQuery(
        `
          SELECT
            id,
            itemName,
            requiredQuantity,
            availableQuantity,
            isSufficient,
            ingredientType
          FROM production_v2_approval_log_items
          WHERE approvalLogId = ?
          ORDER BY createdAt ASC
        `,
        [approvalLogId],
      );

      const m = metaRows?.[0] ?? null;
      setApprovalLogMeta(
        m
          ? {
              status: String(m.status || ""),
              createdAt: String(m.createdAt || ""),
              approvedBy: m.approvedBy != null ? String(m.approvedBy) : null,
              rejectedBy: m.rejectedBy != null ? String(m.rejectedBy) : null,
              approvedAt: m.approvedAt != null ? String(m.approvedAt) : null,
              rejectedAt: m.rejectedAt != null ? String(m.rejectedAt) : null,
              notes: m.notes != null ? String(m.notes) : null,
            }
          : null,
      );

      setApprovalLogItems(
        (items || []).map((it: any) => ({
          id: String(it.id || ""),
          itemName: String(it.itemName || ""),
          requiredQuantity: String(it.requiredQuantity || ""),
          availableQuantity: String(it.availableQuantity || ""),
          isSufficient: Number(it.isSufficient || 0) === 1,
          ingredientType: String(it.ingredientType || ""),
        })),
      );
    })()
      .catch((e: any) => {
        console.error("Failed to fetch approval log details:", e);
        setApprovalLogItems([]);
        setApprovalLogMeta(null);
      })
      .finally(() => setIsDetailsLoading(false));
  }, [isOpen, isProductionApprovalLog, request?.meta?.approvalLogId]);

  const isAllSelected =
    (isProductionApprovalLog ? approvalLogItems : orderRows).length > 0 &&
    (isProductionApprovalLog ? approvalLogItems : orderRows).every((r: any) =>
      selectedRowIds.includes(r.id),
    );

  const toggleAll = (checked: boolean) => {
    if (checked) {
      const ids = (isProductionApprovalLog ? approvalLogItems : orderRows).map(
        (r: any) => r.id,
      );
      setSelectedRowIds(ids);
      return;
    }
    setSelectedRowIds([]);
  };

  const toggleOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRowIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      return;
    }
    setSelectedRowIds((prev) => prev.filter((x) => x !== id));
  };

  if (!shouldRender) return null;

  const headerRequestId = request?.requestId || "";
  const requestedBy = request?.requestedBy || "";
  const status = approvalLogMeta?.status || request?.status || "";
  const dateCreated = request?.date || "";

  return (
    <div className="fixed inset-0 z-220 flex justify-end">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 cursor-pointer"
      />
      <div
        className={`relative h-full w-full max-w-[860px] bg-white shadow-2xl rounded-l-[24px] p-6 overflow-y-auto transform transition-transform duration-200 ${
          isPanelOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-[22px] font-bold text-[#1C1B20]">
            Request ID : {headerRequestId}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-[#E33629] text-white flex items-center justify-center cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5 border border-[#EDEDED] rounded-[10px] overflow-hidden">
          <div className="grid grid-cols-2 border-b border-[#EDEDED]">
            <div className="px-4 py-3 text-[14px] text-[#1C1B20] font-medium">
              Request ID
            </div>
            <div className="px-4 py-3 text-[14px] text-[#1C1B20] font-medium text-right">
              {headerRequestId}
            </div>
          </div>
          <div className="grid grid-cols-2 border-b border-[#EDEDED]">
            <div className="px-4 py-3 text-[14px] text-[#1C1B20] font-medium">
              Requested By
            </div>
            <div className="px-4 py-3 text-[14px] text-[#1C1B20] font-medium text-right">
              {requestedBy}
            </div>
          </div>
          <div className="grid grid-cols-2 border-b border-[#EDEDED]">
            <div className="px-4 py-3 text-[14px] text-[#1C1B20] font-medium">
              Amount of Orders
            </div>
            <div className="px-4 py-3 text-[14px] text-[#1C1B20] font-medium text-right">
              {request?.itemCount ?? orderRows.length}
            </div>
          </div>
          <div className="grid grid-cols-2 border-b border-[#EDEDED]">
            <div className="px-4 py-3 text-[14px] text-[#1C1B20] font-medium">
              Status
            </div>
            <div className="px-4 py-3 text-right">
              {<ApprovalLogStatusBadge status={status} />}
            </div>
          </div>
          <div className="grid grid-cols-2">
            <div className="px-4 py-3 text-[14px] text-[#1C1B20] font-medium">
              Date Created
            </div>
            <div className="px-4 py-3 text-[14px] text-[#1C1B20] font-medium text-right">
              {formatDate(approvalLogMeta?.createdAt || dateCreated)}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-[16px] font-bold text-[#1C1B20]">
            {isProductionApprovalLog
              ? "Inventory Items in this Approval Log"
              : "Requested Orders in this Batch"}
          </h3>

          <div className="mt-4 border border-[#F0F0F0] rounded-[14px] overflow-hidden">
            <div
              className={`grid gap-4 py-4 text-[#A0A0A0] text-[14px] font-medium border-b border-[#F4F4F4] px-5 ${
                isProductionApprovalLog
                  ? "grid-cols-[44px_1.4fr_0.8fr_0.8fr_0.6fr]"
                  : "grid-cols-[44px_0.7fr_1.6fr_0.9fr_1fr]"
              }`}
            >
              <div className="flex items-center justify-center">
                {(isProductionApprovalLog ? approvalLogItems : orderRows)
                  .length > 0 && (
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => toggleAll(e.target.checked)}
                    className="size-[18px] cursor-pointer accent-[#15BA5C]"
                  />
                )}
              </div>
              {isProductionApprovalLog ? (
                <>
                  <div>Item</div>
                  <div>Required</div>
                  <div>Available</div>
                  <div>Sufficient</div>
                </>
              ) : (
                <>
                  <div>ID</div>
                  <div>Products Ordered</div>
                  <div>Status</div>
                  <div>Comments (optional)</div>
                </>
              )}
            </div>

            {isDetailsLoading ? (
              <div className="divide-y divide-[#F4F4F4]">
                {[...Array(4)].map((_, idx) => (
                  <div
                    key={`s-${idx}`}
                    className={`grid gap-4 py-5 px-5 animate-pulse ${
                      isProductionApprovalLog
                        ? "grid-cols-[44px_1.4fr_0.8fr_0.8fr_0.6fr]"
                        : "grid-cols-[44px_0.7fr_1.6fr_0.9fr_1fr]"
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      <div className="w-[18px] h-[18px] rounded-[4px] bg-gray-200" />
                    </div>
                    <div className="h-4 rounded bg-gray-200 w-full" />
                    <div className="h-4 rounded bg-gray-200 w-full" />
                    <div className="h-4 rounded bg-gray-200 w-full" />
                    <div className="h-4 rounded bg-gray-200 w-full" />
                  </div>
                ))}
              </div>
            ) : (isProductionApprovalLog ? approvalLogItems : orderRows)
                .length === 0 ? (
              <div className="py-14 flex flex-col items-center justify-center text-center">
                <p className="text-[#1C1B20] font-semibold text-[16px]">
                  {isProductionApprovalLog
                    ? "No Items Found"
                    : "No Orders Found"}
                </p>
                <p className="text-[#8B8B8B] text-[14px] mt-1">
                  {isProductionApprovalLog
                    ? "This approval log has no attached inventory items."
                    : "This request currently has no attached orders."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#F4F4F4]">
                {(isProductionApprovalLog ? approvalLogItems : orderRows).map(
                  (row: any) => (
                    <div
                      key={row.id}
                      className={`grid gap-4 py-5 px-5 ${
                        isProductionApprovalLog
                          ? "grid-cols-[44px_1.4fr_0.8fr_0.8fr_0.6fr]"
                          : "grid-cols-[44px_0.7fr_1.6fr_0.9fr_1fr]"
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={selectedRowIds.includes(row.id)}
                          onChange={(e) => toggleOne(row.id, e.target.checked)}
                          className="size-[18px] cursor-pointer accent-[#15BA5C]"
                        />
                      </div>
                      {isProductionApprovalLog ? (
                        <>
                          <div className="text-[#1C1B20] text-[15px] font-medium">
                            {row.itemName || "-"}
                          </div>
                          <div className="text-[#1C1B20] text-[15px] font-medium">
                            {row.requiredQuantity || "-"}
                          </div>
                          <div className="text-[#1C1B20] text-[15px] font-medium">
                            {row.availableQuantity || "-"}
                          </div>
                          <div className="text-[#1C1B20] text-[15px] font-medium">
                            {row.isSufficient ? "Yes" : "No"}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-[#1C1B20] text-[15px] font-medium">
                            {row.id}
                          </div>
                          <div className="text-[#1C1B20] text-[15px] font-medium">
                            {row.productsOrdered}
                          </div>
                          <div>
                            <ApprovalLogStatusBadge status={row.status} />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={commentsByRowId[row.id] || ""}
                              onChange={(e) =>
                                setCommentsByRowId((prev) => ({
                                  ...prev,
                                  [row.id]: e.target.value,
                                }))
                              }
                              placeholder="Nil"
                              className="w-full h-10 px-3 border border-[#E5E7EB] rounded-[10px] outline-none"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 mt-10">
          <button
            type="button"
            disabled={selectedRowIds.length === 0}
            className="bg-[#E33629] flex-1 cursor-pointer text-white px-5 py-3 text-[15px] rounded-[10px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reject Selected
          </button>
          <button
            type="button"
            disabled={selectedRowIds.length === 0}
            className="bg-[#15BA5C] flex-1 cursor-pointer text-white px-5 py-3 text-[15px] rounded-[10px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Approval Selected
          </button>
          <button
            type="button"
            className="bg-[#15BA5C] flex-1 cursor-pointer text-white px-5 py-3 text-[15px] rounded-[10px]"
          >
            Approval All
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestLog;
