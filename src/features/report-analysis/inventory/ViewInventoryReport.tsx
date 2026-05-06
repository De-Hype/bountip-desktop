import { useEffect, useMemo, useState } from "react";
import { Calendar, Clock, X } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useAuthStore } from "@/stores/authStore";

type AnyRow = Record<string, any>;

type InventoryLogRow = {
  key: string;
  timeStampIso: string | null;
  lotNo: string;
  changeType: string;
  oldStockLevel: number;
  newStockLevel: number;
  currentLevel: number;
  actionTakenBy: string;
  reason: string;
  unitOfMeasure: string;
};

type ViewInventoryReportProps = {
  isOpen: boolean;
  onClose: () => void;
  inventoryItemId: string | null;
  itemName: string;
};

const toNumber = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const formatDayTime = (iso: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const label = format(d, "dd MMMM yyyy h:mm a");
  return label.replace("AM", "am").replace("PM", "pm");
};

const formatCreatedOn = (iso: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return format(d, "MMMM do, yyyy");
};

const formatLastUpdated = (iso: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return formatDistanceToNow(d, { addSuffix: true });
};

const resolveDisplayedUnit = (item: AnyRow) => {
  const keyRaw = String(item?.displayedUnitOfMeasure ?? "").trim();
  const key = keyRaw.toLowerCase().replace(/\s+/g, "");

  const unitOfPurchase = String(item?.unitOfPurchase ?? "").trim();
  const unitOfTransfer = String(item?.unitOfTransfer ?? "").trim();
  const unitOfConsumption = String(item?.unitOfConsumption ?? "").trim();

  if (key === "unitofpurchase") return unitOfPurchase || "-";
  if (key === "unitoftransfer") return unitOfTransfer || "-";
  if (key === "unitofconsumption") return unitOfConsumption || "-";

  return keyRaw || unitOfPurchase || unitOfTransfer || unitOfConsumption || "-";
};

const ViewInventoryReport = ({
  isOpen,
  onClose,
  inventoryItemId,
  itemName,
}: ViewInventoryReportProps) => {
  const authUser = useAuthStore((s) => s.user);
  const [isLoading, setIsLoading] = useState(false);
  const [meta, setMeta] = useState<{
    createdAt: string | null;
    updatedAt: string | null;
    updatedBy: string | null;
  }>({
    createdAt: null,
    updatedAt: null,
    updatedBy: null,
  });
  const [logs, setLogs] = useState<InventoryLogRow[]>([]);

  const loggedInUserName = useMemo(() => {
    const raw = String(authUser?.name ?? "").trim();
    return raw || "Current User";
  }, [authUser?.name]);

  useEffect(() => {
    if (!isOpen) return;
    if (!inventoryItemId) return;

    let cancelled = false;
    const run = async () => {
      const api = (window as any)?.electronAPI;
      if (!api?.dbQuery) {
        if (!cancelled) setLogs([]);
        return;
      }

      setIsLoading(true);
      try {
        const metaRows = (await api.dbQuery(
          `
            SELECT
              ii.createdAt as createdAt,
              COALESCE(ii.updatedAt, ii.createdAt) as updatedAt,
              COALESCE(ii.modifiedBy, ii.addedBy, '') as updatedBy
            FROM inventory_item ii
            WHERE ii.id = ?
            LIMIT 1
          `,
          [inventoryItemId],
        )) as AnyRow[];

        const metaRow = metaRows?.[0] || {};
        if (!cancelled) {
          setMeta({
            createdAt: metaRow?.createdAt ? String(metaRow.createdAt) : null,
            updatedAt: metaRow?.updatedAt ? String(metaRow.updatedAt) : null,
            updatedBy: metaRow?.updatedBy ? String(metaRow.updatedBy) : null,
          });
        }

        const unitRows = (await api.dbQuery(
          `
            SELECT
              COALESCE(im.displayedUnitOfMeasure, '') as displayedUnitOfMeasure,
              COALESCE(im.unitOfPurchase, '') as unitOfPurchase,
              COALESCE(im.unitOfTransfer, '') as unitOfTransfer,
              COALESCE(im.unitOfConsumption, '') as unitOfConsumption
            FROM inventory_item ii
            JOIN item_master im ON im.id = ii.itemMasterId
            WHERE ii.id = ?
            LIMIT 1
          `,
          [inventoryItemId],
        )) as AnyRow[];
        const unitOfMeasure = resolveDisplayedUnit(unitRows?.[0] || {});

        let mapped: InventoryLogRow[] = [];
        try {
          const logRows = (await api.dbQuery(
            `
              SELECT
                ill.id as id,
                COALESCE(ill.changeType, '') as changeType,
                COALESCE(ill.previousLevel, 0) as previousLevel,
                COALESCE(ill.currentLevel, 0) as currentLevel,
                COALESCE(ill.actionTakenBy, '') as actionTakenBy,
                COALESCE(ill.changeAmount, 0) as changeAmount,
                COALESCE(ill.reason, '') as reason,
                ill.createdAt as createdAt,
                ill.updatedAt as updatedAt,
                COALESCE(il.lotNumber, '') as lotNumber
              FROM item_lot_logs ill
              LEFT JOIN item_lot il ON il.id = ill.lotId
              WHERE il.itemId = ?
              ORDER BY COALESCE(ill.updatedAt, ill.createdAt) DESC
            `,
            [inventoryItemId],
          )) as AnyRow[];

          mapped = (logRows || []).map((r) => {
            const createdAt = r?.createdAt ? String(r.createdAt) : null;
            const updatedAt = r?.updatedAt ? String(r.updatedAt) : null;
            const timeStampIso = updatedAt || createdAt;
            const lotNo = String(r?.lotNumber ?? "").trim() || "-";
            const key =
              String(r?.id ?? "").trim() || `${lotNo}:${String(timeStampIso)}`;

            const actorRaw = String(r?.actionTakenBy ?? "").trim();
            const actor =
              actorRaw.toLowerCase() === "current-user"
                ? loggedInUserName
                : actorRaw || "-";

            return {
              key,
              timeStampIso,
              lotNo,
              changeType: String(r?.changeType ?? "").trim() || "-",
              oldStockLevel: toNumber(r?.previousLevel),
              newStockLevel: toNumber(r?.changeAmount),
              currentLevel: toNumber(r?.currentLevel),
              actionTakenBy: actor,
              reason: String(r?.reason ?? "").trim() || "-",
              unitOfMeasure,
            };
          });
        } catch {
          mapped = [];
        }

        if (!cancelled) setLogs(mapped);
      } catch {
        if (!cancelled) {
          setMeta({ createdAt: null, updatedAt: null, updatedBy: null });
          setLogs([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [inventoryItemId, isOpen, loggedInUserName]);

  const headerSubtitle = useMemo(() => {
    const updatedBy = meta.updatedBy ? String(meta.updatedBy).trim() : "";
    const created = formatCreatedOn(meta.createdAt);
    const updated = formatLastUpdated(meta.updatedAt);
    return {
      updatedLabel:
        updated !== "-"
          ? `Last Updated ${updated}${updatedBy ? ` by ${updatedBy}` : ""}`
          : "-",
      createdLabel: created !== "-" ? `Created on ${created}` : "-",
    };
  }, [meta.createdAt, meta.updatedAt, meta.updatedBy]);

  const TableSkeleton = () => (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={`sk-${i}`} className="animate-pulse">
          {Array.from({ length: 8 }).map((__, j) => (
            <td
              key={`sk-${i}-${j}`}
              className="px-6 py-5 border border-[#EEF2F7]"
            >
              <div className="h-4 w-full rounded bg-gray-200" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );

  const formatLevel = (value: number, unit: string) => {
    const n = Number.isFinite(value) ? value : 0;
    const rounded = Math.abs(n) >= 1000 ? Math.round(n) : Number(n.toFixed(2));
    return `${rounded}${unit ? ` ${unit}` : ""}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[220]">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/30 cursor-pointer"
      />

      <div className="absolute right-0 top-0 h-full w-full max-w-[1200px] bg-white rounded-l-[16px] overflow-hidden flex flex-col">
        <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4 border-b border-[#EEF2F7]">
          <div className="min-w-0">
            <div className="text-[22px] font-bold text-[#111827] truncate">
              {itemName || "Item"}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-[#6B7280]">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#9CA3AF]" />
                <span>{headerSubtitle.updatedLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#9CA3AF]" />
                <span>{headerSubtitle.createdLabel}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-10 w-10 rounded-full bg-[#F3F4F6] text-[#6B7280] flex items-center justify-center cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-6 pb-6 pt-4">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1100px] border border-[#EEF2F7] border-collapse">
              <thead className="bg-[#F9FAFB]">
                <tr className="text-left text-[12px] font-medium text-[#9CA3AF]">
                  <th className="px-6 py-4 border border-[#EEF2F7]">
                    Time Stamp
                  </th>
                  <th className="px-6 py-4 border border-[#EEF2F7]">Lot No</th>
                  <th className="px-6 py-4 border border-[#EEF2F7]">
                    Change Type
                  </th>
                  <th className="px-6 py-4 border border-[#EEF2F7]">
                    Old Stock level
                  </th>
                  <th className="px-6 py-4 border border-[#EEF2F7]">
                    New Stock Level
                  </th>
                  <th className="px-6 py-4 border border-[#EEF2F7]">
                    Current level
                  </th>
                  <th className="px-6 py-4 border border-[#EEF2F7]">
                    Action taken by
                  </th>
                  <th className="px-6 py-4 border border-[#EEF2F7]">
                    Reason for adjustment
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <TableSkeleton />
                ) : logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-10 text-center text-[14px] text-[#6B7280] border border-[#EEF2F7]"
                    >
                      No activity found for this item.
                    </td>
                  </tr>
                ) : (
                  logs.map((r) => {
                    const unit = r.unitOfMeasure || "";
                    const delta = r.newStockLevel || 0;
                    const deltaLabel = `${delta > 0 ? "+" : ""}${formatLevel(delta, unit)}`;
                    const deltaCls =
                      delta > 0
                        ? "bg-[#E9FBF0] text-[#15BA5C]"
                        : delta < 0
                          ? "bg-[#FEE2E2] text-[#EF4444]"
                          : "bg-[#F3F4F6] text-[#6B7280]";
                    return (
                      <tr key={r.key}>
                        <td className="px-6 py-5 text-[14px] text-[#111827] border border-[#EEF2F7] whitespace-nowrap">
                          {formatDayTime(r.timeStampIso)}
                        </td>
                        <td className="px-6 py-5 text-[14px] text-[#111827] border border-[#EEF2F7] whitespace-nowrap">
                          {r.lotNo}
                        </td>
                        <td className="px-6 py-5 text-[14px] text-[#111827] border border-[#EEF2F7]">
                          {r.changeType}
                        </td>
                        <td className="px-6 py-5 text-[14px] text-[#111827] border border-[#EEF2F7] whitespace-nowrap">
                          {formatLevel(r.oldStockLevel, unit)}
                        </td>
                        <td className="px-6 py-5 text-[14px] text-[#111827] border border-[#EEF2F7] whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-3 py-2 rounded-[10px] ${deltaCls}`}
                          >
                            {deltaLabel}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-[14px] text-[#111827] border border-[#EEF2F7] whitespace-nowrap">
                          {formatLevel(r.currentLevel, unit)}
                        </td>
                        <td className="px-6 py-5 text-[14px] text-[#111827] border border-[#EEF2F7] whitespace-nowrap">
                          {r.actionTakenBy || "-"}
                        </td>
                        <td className="px-6 py-5 text-[14px] text-[#111827] border border-[#EEF2F7]">
                          {r.reason || "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewInventoryReport;
