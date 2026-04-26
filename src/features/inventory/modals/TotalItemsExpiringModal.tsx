"use client";

import { Calendar, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import NotFound from "@/features/inventory/NotFound";
import { Pagination } from "@/shared/Pagination/pagination";
import useToastStore from "@/stores/toastStore";
import { getCurrencySymbol } from "@/utils/getCurrencySymbol";
import * as XLSX from "xlsx";

type TotalItemsExpiringRow = {
  lotId: string;
  itemCode: string;
  itemName: string;
  lotNumber: string;
  supplierSerialNumber: string;
  quantityExpiring: number;
  costPrice: number;
  expiryDate: string;
  displayedUnitOfMeasure: string;
  unitOfPurchase: string;
  unitOfTransfer: string;
  unitOfConsumption: string;
};

type TotalItemsExpiringModalProps = {
  isOpen: boolean;
  onClose: () => void;
  outletId?: string | null;
  outletName?: string | null;
  currencyCode?: string | null;
};

const formatLongDate = (d: Date) => {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
};

const formatShortDate = (isoLike: string) => {
  const d = new Date(isoLike);
  if (Number.isNaN(d.getTime())) return isoLike || "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
  }).format(d);
};

const resolveDisplayedUnit = (row: TotalItemsExpiringRow) => {
  const raw = String(row.displayedUnitOfMeasure || "").trim();
  const key = raw.toLowerCase().replace(/\s+/g, "");
  if (key === "unitofpurchase") return row.unitOfPurchase || "";
  if (key === "unitoftransfer") return row.unitOfTransfer || "";
  if (key === "unitofconsumption") return row.unitOfConsumption || "";
  return (
    raw ||
    row.unitOfPurchase ||
    row.unitOfTransfer ||
    row.unitOfConsumption ||
    ""
  );
};

const daysUntil = (isoLike: string) => {
  const expiry = new Date(isoLike);
  if (Number.isNaN(expiry.getTime())) return null;
  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const diffMs = expiry.getTime() - startOfToday.getTime();
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
};

const TotalItemsExpiringModal = ({
  isOpen,
  onClose,
  outletId,
  outletName,
  currencyCode,
}: TotalItemsExpiringModalProps) => {
  const { showToast } = useToastStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [rows, setRows] = useState<TotalItemsExpiringRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const todayLabel = useMemo(() => formatLongDate(new Date()), []);
  const currencySymbol = useMemo(() => {
    if (!currencyCode) return "";
    return getCurrencySymbol(currencyCode);
  }, [currencyCode]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchRows = async () => {
      if (!outletId) {
        setRows([]);
        return;
      }

      const api = (window as any).electronAPI;
      if (!api?.dbQuery) {
        setRows([]);
        return;
      }

      const now = new Date();
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      ).toISOString();
      const expiringUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const expiringUntilIso = expiringUntil.toISOString();

      setIsLoading(true);
      try {
        const result =
          (await api.dbQuery(
            `
              SELECT
                il.id AS lotId,
                COALESCE(im.itemCode, '') AS itemCode,
                COALESCE(im.name, '') AS itemName,
                COALESCE(il.lotNumber, '') AS lotNumber,
                COALESCE(il.supplierSesrialNumber, '') AS supplierSerialNumber,
                COALESCE(il.currentStockLevel, 0) AS quantityExpiring,
                COALESCE(il.costPrice, 0) AS costPrice,
                COALESCE(il.expiryDate, '') AS expiryDate,
                COALESCE(im.displayedUnitOfMeasure, '') AS displayedUnitOfMeasure,
                COALESCE(im.unitOfPurchase, '') AS unitOfPurchase,
                COALESCE(im.unitOfTransfer, '') AS unitOfTransfer,
                COALESCE(im.unitOfConsumption, '') AS unitOfConsumption
              FROM item_lot il
              JOIN inventory_item ii ON ii.id = il.itemId
              JOIN inventory i ON ii.inventoryId = i.id
              JOIN item_master im ON ii.itemMasterId = im.id
              WHERE i.outletId = ?
                AND ii.isDeleted = 0
                AND il.expiryDate IS NOT NULL
                AND il.expiryDate != ''
                AND datetime(il.expiryDate) >= datetime(?)
                AND datetime(il.expiryDate) <= datetime(?)
                AND COALESCE(il.currentStockLevel, 0) > 0
              ORDER BY datetime(il.expiryDate) ASC
            `,
            [outletId, startOfToday, expiringUntilIso],
          )) || [];

        const mapped: TotalItemsExpiringRow[] = (result as any[]).map((r) => ({
          lotId: r?.lotId != null ? String(r.lotId) : "",
          itemCode: r?.itemCode != null ? String(r.itemCode) : "",
          itemName: r?.itemName != null ? String(r.itemName) : "",
          lotNumber: r?.lotNumber != null ? String(r.lotNumber) : "",
          supplierSerialNumber:
            r?.supplierSerialNumber != null
              ? String(r.supplierSerialNumber)
              : "",
          quantityExpiring: Number(r?.quantityExpiring || 0),
          costPrice: Number(r?.costPrice || 0),
          expiryDate: r?.expiryDate != null ? String(r.expiryDate) : "",
          displayedUnitOfMeasure:
            r?.displayedUnitOfMeasure != null
              ? String(r.displayedUnitOfMeasure)
              : "",
          unitOfPurchase:
            r?.unitOfPurchase != null ? String(r.unitOfPurchase) : "",
          unitOfTransfer:
            r?.unitOfTransfer != null ? String(r.unitOfTransfer) : "",
          unitOfConsumption:
            r?.unitOfConsumption != null ? String(r.unitOfConsumption) : "",
        }));

        setRows(mapped);
      } catch (err) {
        console.error("Failed to fetch expiring items rows:", err);
        setRows([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRows();
  }, [isOpen, outletId]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    setSearchQuery("");
    setCurrentPage(1);
  }, [isOpen]);

  const filteredRows = useMemo(() => {
    const q = String(searchQuery || "")
      .trim()
      .toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const itemName = String(r.itemName || "").toLowerCase();
      const itemCode = String(r.itemCode || "").toLowerCase();
      const lotNumber = String(r.lotNumber || "").toLowerCase();
      const supplierSerialNumber = String(
        r.supplierSerialNumber || "",
      ).toLowerCase();
      return (
        itemName.includes(q) ||
        itemCode.includes(q) ||
        lotNumber.includes(q) ||
        supplierSerialNumber.includes(q)
      );
    });
  }, [rows, searchQuery]);

  useEffect(() => {
    if (!isOpen) return;
    setCurrentPage(1);
  }, [isOpen, searchQuery]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredRows.length / itemsPerPage));
  }, [filteredRows.length, itemsPerPage]);

  useEffect(() => {
    if (!isOpen) return;
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, isOpen, totalPages]);

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRows.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, filteredRows, itemsPerPage]);

  const TableSkeleton = () => {
    return (
      <>
        {[...Array(Math.min(8, itemsPerPage))].map((_, i) => (
          <tr key={i} className="animate-pulse border-t border-[#F3F4F6]">
            {[...Array(8)].map((__, j) => (
              <td key={j} className="px-6 py-4">
                <div className="h-4 bg-gray-100 rounded w-full" />
              </td>
            ))}
          </tr>
        ))}
      </>
    );
  };

  const exportExcel = async () => {
    if (!outletId) {
      showToast("error", "No outlet selected", "Please select an outlet first");
      return;
    }

    setIsExporting(true);
    try {
      const data = filteredRows.map((r) => {
        const unit = resolveDisplayedUnit(r);
        const qty = Number(r.quantityExpiring || 0);
        const qtyLabel = unit && unit !== "-" ? `${qty}${unit}` : `${qty}`;
        const valueNumber = Number(r.costPrice || 0) * qty;
        const days = daysUntil(r.expiryDate);
        return {
          itemCode: r.itemCode,
          itemName: r.itemName,
          lotNumber: r.lotNumber,
          supplierSerialNumber: r.supplierSerialNumber,
          qtyExpiring: qtyLabel,
          value: valueNumber,
          expiryDate: r.expiryDate,
          daysToExpire: days ?? "",
        };
      });

      if (!data.length) {
        showToast("warning", "No items to export", "Nothing to export");
        return;
      }

      const ws = XLSX.utils.json_to_sheet(data, {
        header: [
          "itemCode",
          "itemName",
          "lotNumber",
          "supplierSerialNumber",
          "qtyExpiring",
          "value",
          "expiryDate",
          "daysToExpire",
        ],
      });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Total Items Expiring");

      const safeOutletName = String(outletName || "outlet")
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "_");
      const date = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `total_items_expiring_${safeOutletName}_${date}.xlsx`);

      showToast("success", "Export complete", "Excel file downloaded");
    } catch (err) {
      console.error("Failed to export expiring items:", err);
      showToast("error", "Export failed", "Could not export items");
    } finally {
      setIsExporting(false);
    }
  };

  const totalLabel = useMemo(() => {
    return isLoading ? 0 : filteredRows.length;
  }, [filteredRows.length, isLoading]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-150 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-[1200px] bg-white rounded-[16px] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-4">
            <h2 className="text-[24px] font-semibold text-[#111827]">
              Total Items Expiring
            </h2>
            <div className="flex items-center gap-2 text-[#15BA5C] text-[14px] font-medium">
              <Calendar className="h-4 w-4" />
              <span>{todayLabel}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] transition-colors flex items-center justify-center cursor-pointer"
          >
            <X className="h-5 w-5 text-[#111827]" />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-[10px] bg-[#15BA5C]/10 flex items-center justify-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g clipPath="url(#clip0_2323_43906)">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M0 4.48532C0 3.81271 0.267196 3.16764 0.742808 2.69203C1.21842 2.21641 1.86349 1.94922 2.53611 1.94922H20.8741C21.5467 1.94922 22.1918 2.21641 22.6674 2.69203C23.143 3.16764 23.4102 3.81271 23.4102 4.48532V5.26566C23.4102 5.93828 23.143 6.58335 22.6674 7.05896C22.1918 7.53457 21.5467 7.80177 20.8741 7.80177H20.4839V18.1413C20.4839 19.4386 19.4402 20.4823 18.1429 20.4823H5.2673C3.96998 20.4823 2.92628 19.4386 2.92628 18.1413V7.80177H2.53611C1.86349 7.80177 1.21842 7.53457 0.742808 7.05896C0.267196 6.58335 0 5.93828 0 5.26566L0 4.48532ZM2.53611 3.90007C2.38089 3.90007 2.23202 3.96173 2.12227 4.07149C2.01251 4.18124 1.95085 4.33011 1.95085 4.48532V5.26566C1.95085 5.42088 2.01251 5.56975 2.12227 5.6795C2.23202 5.78926 2.38089 5.85092 2.53611 5.85092H20.8741C21.0293 5.85092 21.1782 5.78926 21.2879 5.6795C21.3977 5.56975 21.4594 5.42088 21.4594 5.26566V4.48532C21.4594 4.33011 21.3977 4.18124 21.2879 4.07149C21.1782 3.96173 21.0293 3.90007 20.8741 3.90007H2.53611ZM7.8034 9.75262C7.5447 9.75262 7.2966 9.85539 7.11367 10.0383C6.93075 10.2212 6.82798 10.4693 6.82798 10.728C6.82798 10.9867 6.93075 11.2348 7.11367 11.4178C7.2966 11.6007 7.5447 11.7035 7.8034 11.7035H15.6068C15.8655 11.7035 16.1136 11.6007 16.2965 11.4178C16.4795 11.2348 16.5822 10.9867 16.5822 10.728C16.5822 10.4693 16.4795 10.2212 16.2965 10.0383C16.1136 9.85539 15.8655 9.75262 15.6068 9.75262H7.8034Z"
                      fill="#15BA5C"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_2323_43906">
                      <rect width="23.4102" height="23.4102" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <div className="text-[28px] font-semibold text-[#111827]">
                {totalLabel}
              </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex w-full md:w-[420px] h-[48px] rounded-[10px] border border-[#E5E7EB] bg-white overflow-hidden">
                <div className="flex-1 px-4 flex items-center gap-3">
                  <Search className="size-4 text-[#9CA3AF]" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setCurrentPage(1);
                    }}
                    placeholder="Search..."
                    className="flex-1 outline-none text-[14px] text-[#111827] placeholder:text-[#9CA3AF]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  className="w-[52px] bg-[#15BA5C] flex items-center justify-center cursor-pointer"
                >
                  <Search className="size-4 text-white" />
                </button>
              </div>

              <button
                type="button"
                onClick={exportExcel}
                disabled={isExporting}
                className="w-full md:w-[170px] h-[48px] rounded-[10px] bg-[#15BA5C] text-white text-[14px] font-semibold hover:bg-[#119E4D] transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Export Excel
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="rounded-[14px] overflow-hidden">
            {isLoading ? (
              <div className="max-h-[520px] overflow-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-[#F9FAFB]">
                    <tr className="text-left text-[14px] text-[#6B7280]">
                      <th className="px-6 py-4 font-medium">Item Code</th>
                      <th className="px-6 py-4 font-medium">Item</th>
                      <th className="px-6 py-4 font-medium">Lot Number</th>
                      <th className="px-6 py-4 font-medium">
                        Supplier Serial No.
                      </th>
                      <th className="px-6 py-4 font-medium">Qty Expiring</th>
                      <th className="px-6 py-4 font-medium">Value</th>
                      <th className="px-6 py-4 font-medium">Expiry Date</th>
                      <th className="px-6 py-4 font-medium">Days to Expire</th>
                    </tr>
                  </thead>
                  <tbody>
                    <TableSkeleton />
                  </tbody>
                </table>
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="bg-white">
                <NotFound
                  title="No items found"
                  description="Try a different search term."
                />
              </div>
            ) : (
              <>
                <div className="max-h-[520px] overflow-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-[#F9FAFB]">
                      <tr className="text-left text-[14px] text-[#6B7280]">
                        <th className="px-6 py-4 font-medium">Item Code</th>
                        <th className="px-6 py-4 font-medium">Item</th>
                        <th className="px-6 py-4 font-medium">Lot Number</th>
                        <th className="px-6 py-4 font-medium">
                          Supplier Serial No.
                        </th>
                        <th className="px-6 py-4 font-medium">Qty Expiring</th>
                        <th className="px-6 py-4 font-medium">Value</th>
                        <th className="px-6 py-4 font-medium">Expiry Date</th>
                        <th className="px-6 py-4 font-medium">
                          Days to Expire
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRows.map((r) => {
                        const unit = resolveDisplayedUnit(r);
                        const qty = Number(r.quantityExpiring || 0);
                        const qtyLabel =
                          unit && unit !== "-" ? `${qty}${unit}` : `${qty}`;
                        const valueNumber = Number(r.costPrice || 0) * qty;
                        const formattedValue = `${currencySymbol}${new Intl.NumberFormat(
                          undefined,
                          { maximumFractionDigits: 0 },
                        ).format(valueNumber)}`;
                        const days = daysUntil(r.expiryDate);

                        return (
                          <tr
                            key={r.lotId || `${r.itemCode}-${r.lotNumber}`}
                            className="border-t border-[#F3F4F6] text-[14px] text-[#111827]"
                          >
                            <td className="px-6 py-4">{r.itemCode || "-"}</td>
                            <td className="px-6 py-4">{r.itemName || "-"}</td>
                            <td className="px-6 py-4">{r.lotNumber || "-"}</td>
                            <td className="px-6 py-4">
                              {r.supplierSerialNumber || "-"}
                            </td>
                            <td className="px-6 py-4">{qtyLabel}</td>
                            <td className="px-6 py-4">{formattedValue}</td>
                            <td className="px-6 py-4">
                              {r.expiryDate
                                ? formatShortDate(r.expiryDate)
                                : "-"}
                            </td>
                            <td className="px-6 py-4">
                              {days != null ? days : "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={(nextItemsPerPage: number) => {
                    setItemsPerPage(nextItemsPerPage);
                    setCurrentPage(1);
                  }}
                  totalItems={filteredRows.length}
                  className="bg-white"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TotalItemsExpiringModal;
