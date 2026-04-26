"use client";

import { Calendar, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import NotFound from "@/features/inventory/NotFound";
import { Pagination } from "@/shared/Pagination/pagination";
import useToastStore from "@/stores/toastStore";
import * as XLSX from "xlsx";

type TotalNumberOfItemsModalRow = {
  inventoryItemId: string;
  itemCode: string;
  itemName: string;
  totalLotsPerItem: number;
  currentStockLevel: number;
  displayedUnitOfMeasure: string;
  unitOfPurchase: string;
  unitOfTransfer: string;
  unitOfConsumption: string;
};

type TotalNumberOfItemsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  outletId?: string | null;
  outletName?: string | null;
};

const formatLongDate = (d: Date) => {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
};

const resolveDisplayedUnit = (row: TotalNumberOfItemsModalRow) => {
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

const TotalNumberOfItemsModal = ({
  isOpen,
  onClose,
  outletId,
  outletName,
}: TotalNumberOfItemsModalProps) => {
  const { showToast } = useToastStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [rows, setRows] = useState<TotalNumberOfItemsModalRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const todayLabel = useMemo(() => formatLongDate(new Date()), []);

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

      setIsLoading(true);
      try {
        const result =
          (await api.dbQuery(
            `
              SELECT
                ii.id AS inventoryItemId,
                COALESCE(im.itemCode, '') AS itemCode,
                COALESCE(im.name, '') AS itemName,
                COUNT(il.id) AS totalLotsPerItem,
                COALESCE(ii.currentStockLevel, 0) AS currentStockLevel,
                COALESCE(im.displayedUnitOfMeasure, '') AS displayedUnitOfMeasure,
                COALESCE(im.unitOfPurchase, '') AS unitOfPurchase,
                COALESCE(im.unitOfTransfer, '') AS unitOfTransfer,
                COALESCE(im.unitOfConsumption, '') AS unitOfConsumption
              FROM inventory_item ii
              JOIN inventory i ON ii.inventoryId = i.id
              JOIN item_master im ON ii.itemMasterId = im.id
              LEFT JOIN item_lot il ON il.itemId = ii.id
              WHERE i.outletId = ? AND ii.isDeleted = 0
              GROUP BY
                ii.id,
                im.itemCode,
                im.name,
                ii.currentStockLevel,
                im.displayedUnitOfMeasure,
                im.unitOfPurchase,
                im.unitOfTransfer,
                im.unitOfConsumption
              ORDER BY im.name ASC
            `,
            [outletId],
          )) || [];

        const mapped: TotalNumberOfItemsModalRow[] = (result as any[]).map(
          (r) => ({
            inventoryItemId:
              r?.inventoryItemId != null ? String(r.inventoryItemId) : "",
            itemCode: r?.itemCode != null ? String(r.itemCode) : "",
            itemName: r?.itemName != null ? String(r.itemName) : "",
            totalLotsPerItem: Number(r?.totalLotsPerItem || 0),
            currentStockLevel: Number(r?.currentStockLevel || 0),
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
          }),
        );

        setRows(mapped);
      } catch (err) {
        console.error("Failed to fetch total items rows:", err);
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
      return itemName.includes(q) || itemCode.includes(q);
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
            {[...Array(4)].map((__, j) => (
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
        const stock =
          unit && unit !== "-"
            ? `${Number(r.currentStockLevel || 0)}${unit}`
            : `${Number(r.currentStockLevel || 0)}`;
        return {
          itemCode: r.itemCode,
          itemName: r.itemName,
          totalLotsPerItem: Number(r.totalLotsPerItem || 0),
          totalQtyInStock: stock,
        };
      });

      if (!data.length) {
        showToast("warning", "No items to export", "Nothing to export");
        return;
      }

      const ws = XLSX.utils.json_to_sheet(data, {
        header: ["itemCode", "itemName", "totalLotsPerItem", "totalQtyInStock"],
      });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Total Number of Items");

      const safeOutletName = String(outletName || "outlet")
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "_");
      const date = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(
        wb,
        `total_number_of_items_${safeOutletName}_${date}.xlsx`,
      );

      showToast("success", "Export complete", "Excel file downloaded");
    } catch (err) {
      console.error("Failed to export total items:", err);
      showToast("error", "Export failed", "Could not export items");
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-150 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-[1100px] bg-white rounded-[16px] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-4">
            <h2 className="text-[24px] font-semibold text-[#111827]">
              Total Number of Items
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
                  <g clip-path="url(#clip0_2323_43906)">
                    <path
                      fill-rule="evenodd"
                      clip-rule="evenodd"
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
                {isLoading ? 0 : rows.length}
              </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="h-[48px] w-full md:w-[340px] rounded-[10px] border border-[#E5E7EB] bg-white px-4 flex items-center gap-3">
                <Search className="size-4 text-[#9CA3AF]" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="flex-1 outline-none text-[14px] text-[#111827] placeholder:text-[#9CA3AF]"
                />
              </div>
              <button
                type="button"
                onClick={exportExcel}
                disabled={isExporting}
                className="w-full md:w-[170px] h-[48px] rounded-[10px] bg-[#15BA5C] text-white text-[14px] font-semibold hover:bg-[#119E4D] transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g clip-path="url(#clip0_2323_43909)">
                    <path
                      d="M0 3.5C0 1.56953 1.56953 0 3.5 0H12.25V7C12.25 7.96797 13.032 8.75 14 8.75H21V15.75H11.8125C11.0852 15.75 10.5 16.3352 10.5 17.0625C10.5 17.7898 11.0852 18.375 11.8125 18.375H21V24.5C21 26.4305 19.4305 28 17.5 28H3.5C1.56953 28 0 26.4305 0 24.5V3.5ZM21 18.375V15.75H27.0211L24.8883 13.6172C24.3742 13.1031 24.3742 12.2719 24.8883 11.7633C25.4023 11.2547 26.2336 11.2492 26.7422 11.7633L31.1172 16.1383C31.6313 16.6523 31.6313 17.4836 31.1172 17.9922L26.7422 22.3672C26.2281 22.8813 25.3969 22.8813 24.8883 22.3672C24.3797 21.8531 24.3742 21.0219 24.8883 20.5133L27.0211 18.3805L21 18.375ZM21 7H14V0L21 7Z"
                      fill="white"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_2323_43909">
                      <rect width="31.5" height="31.5" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
                <span className="">Export</span>
                
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="rounded-[14px]  overflow-hidden">
            {isLoading ? (
              <div className="max-h-[520px] overflow-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-[#F9FAFB]">
                    <tr className="text-left text-[14px] text-[#6B7280]">
                      <th className="px-6 py-4 font-medium">Item Code</th>
                      <th className="px-6 py-4 font-medium">Item</th>
                      <th className="px-6 py-4 font-medium">
                        Total Lots per Item
                      </th>
                      <th className="px-6 py-4 font-medium">
                        Total Qty in Stock
                      </th>
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
                        <th className="px-6 py-4 font-medium">
                          Total Lots per Item
                        </th>
                        <th className="px-6 py-4 font-medium">
                          Total Qty in Stock
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRows.map((r) => {
                        const unit = resolveDisplayedUnit(r);
                        const qty = Number(r.currentStockLevel || 0);
                        const qtyLabel =
                          unit && unit !== "-" ? `${qty}${unit}` : `${qty}`;

                        return (
                          <tr
                            key={
                              r.inventoryItemId || `${r.itemCode}-${r.itemName}`
                            }
                            className="border-t border-[#F3F4F6] text-[14px] text-[#111827]"
                          >
                            <td className="px-6 py-4">{r.itemCode || "-"}</td>
                            <td className="px-6 py-4">{r.itemName || "-"}</td>
                            <td className="px-6 py-4">
                              <span className="text-[#15BA5C] font-medium">
                                {Number(r.totalLotsPerItem || 0)}
                              </span>
                            </td>
                            <td className="px-6 py-4">{qtyLabel}</td>
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

export default TotalNumberOfItemsModal;
