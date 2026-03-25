"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronUp, Pencil, Trash2 } from "lucide-react";
import { Pagination } from "@/shared/Pagination/pagination";
import useBusinessStore from "@/stores/useBusinessStore";
import NotFound from "@/features/inventory/NotFound";
import NoSupplierEmptyState from "@/assets/images/empty-state/no-supplier.svg";

type SupplierRow = {
  id: string;
  name: string;
  representativeName: string | null;
  phoneNumbers: string | null;
  emailAddress: string | null;
  address: string | null;
  taxNumber: string | null;
};

type SuppliersTableProps = {
  searchTerm: string;
  filters: {
    supplierName: string;
    representatives: string;
    phoneNumber: string;
    emailAddress: string;
  };
  refreshNonce: number;
  onAddSupplier: () => void;
  onViewSupplier: (supplierId: string) => void;
  onEditSupplier: (supplierId: string) => void;
  onDeleteSupplier: (supplier: { id: string; name: string }) => void;
};

const safeJsonArray = (raw: unknown): string[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(String(raw));
    if (Array.isArray(parsed))
      return parsed.map((x) => String(x)).filter(Boolean);
    if (typeof parsed === "string") return [parsed].filter(Boolean);
    return [];
  } catch {
    const s = String(raw).trim();
    return s ? [s] : [];
  }
};

const SuppliersTable = ({
  searchTerm,
  filters,
  refreshNonce,
  onAddSupplier,
  onViewSupplier,
  onEditSupplier,
  onDeleteSupplier,
}: SuppliersTableProps) => {
  const { selectedOutlet } = useBusinessStore();

  const [isLoading, setIsLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const headers = useMemo(
    () => [
      "Supplier Name",
      "Representative Name",
      "Phone number",
      "Email Address",
      "Address",
      "Tax Number",
      "Action",
    ],
    [],
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    filters.supplierName,
    filters.representatives,
    filters.phoneNumber,
    filters.emailAddress,
  ]);

  const fetchSuppliers = useCallback(async () => {
    if (!selectedOutlet?.id) return;
    const api = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    setIsLoading(true);
    try {
      const where: string[] = ["outletId = ?", "deletedAt IS NULL"];
      const params: any[] = [selectedOutlet.id];

      if (searchTerm.trim()) {
        where.push(
          "(name LIKE ? OR address LIKE ? OR taxNumber LIKE ? OR id LIKE ?)",
        );
        const pattern = `%${searchTerm.trim()}%`;
        params.push(pattern, pattern, pattern, pattern);
      }

      if (filters.supplierName !== "All") {
        where.push("name = ?");
        params.push(filters.supplierName);
      }
      if (filters.representatives !== "All") {
        where.push("representativeName LIKE ?");
        params.push(`%${filters.representatives}%`);
      }
      if (filters.phoneNumber !== "All") {
        where.push("phoneNumbers LIKE ?");
        params.push(`%${filters.phoneNumber}%`);
      }
      if (filters.emailAddress !== "All") {
        where.push("emailAddress LIKE ?");
        params.push(`%${filters.emailAddress}%`);
      }

      const whereClause = `WHERE ${where.join(" AND ")}`;

      const countRows = await api.dbQuery(
        `
          SELECT COUNT(*) as count
          FROM suppliers
          ${whereClause}
        `,
        params,
      );
      const count = countRows?.[0]?.count || 0;
      setTotalCount(count);

      const totalPagesLocal = Math.max(1, Math.ceil(count / itemsPerPage));
      const safePage = Math.min(Math.max(1, currentPage), totalPagesLocal);
      if (safePage !== currentPage) {
        setCurrentPage(safePage);
        return;
      }

      const offset = (currentPage - 1) * itemsPerPage;
      const rows = await api.dbQuery(
        `
          SELECT
            id,
            name,
            representativeName,
            phoneNumbers,
            emailAddress,
            address,
            taxNumber
          FROM suppliers
          ${whereClause}
          ORDER BY name ASC
          LIMIT ? OFFSET ?
        `,
        [...params, itemsPerPage, offset],
      );
      setSuppliers(rows || []);
    } catch (err) {
      console.error("Failed to fetch suppliers:", err);
    } finally {
      setIsLoading(false);
    }
  }, [
    currentPage,
    itemsPerPage,
    searchTerm,
    filters.supplierName,
    filters.representatives,
    filters.phoneNumber,
    filters.emailAddress,
    selectedOutlet?.id,
  ]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers, refreshNonce]);

  return (
    <div className="rounded-[12px] overflow-hidden">
      {isLoading || suppliers.length > 0 ? (
        <div className="custom-scrollbar overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#F9FAFB]">
              <tr>
                {headers.map((h) => (
                  <th
                    key={h}
                    className="px-3 py-4 text-[11px] font-bold text-[#9CA3AF] tracking-wider whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5 cursor-pointer hover:text-gray-600 transition-colors group">
                      {h}
                      <ChevronUp className="size-3.5 text-gray-300 group-hover:text-gray-400 transition-colors" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50 bg-white">
              {isLoading
                ? [...Array(6)].map((_, i) => (
                    <tr
                      key={i}
                      className="animate-pulse border-b border-gray-50"
                    >
                      {headers.map((_, j) => (
                        <td key={j} className="px-3 py-4">
                          <div className="h-4 bg-gray-100 rounded w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                : suppliers.map((s) => {
                    const reps = safeJsonArray(s.representativeName);
                    const phones = safeJsonArray(s.phoneNumbers);
                    const emails = safeJsonArray(s.emailAddress);
                    const repMain = reps[0] || "-";
                    const repExtra = Math.max(0, reps.length - 1);

                    return (
                      <tr
                        key={s.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-3 py-5 text-sm font-medium text-[#15BA5C] whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => onViewSupplier(s.id)}
                            className="hover:underline"
                          >
                            {s.name || "-"}
                          </button>
                        </td>
                        <td className="px-3 py-5 text-sm font-bold text-[#1C1B20]">
                          <div className="flex items-center gap-3">
                            <span className="whitespace-nowrap">{repMain}</span>
                            {repExtra > 0 && (
                              <span className="inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-full bg-[#15BA5C] text-white text-[12px] font-semibold whitespace-nowrap">
                                +{repExtra}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-5 text-sm text-gray-600 font-medium whitespace-nowrap">
                          {phones[0] || "-"}
                        </td>
                        <td className="px-3 py-5 text-sm text-gray-600 whitespace-nowrap">
                          {emails[0] || "-"}
                        </td>
                        <td className="px-3 py-5 text-sm text-gray-600 whitespace-nowrap">
                          {s.address || "-"}
                        </td>
                        <td className="px-3 py-5 text-sm text-gray-600 whitespace-nowrap">
                          {s.taxNumber || "-"}
                        </td>
                        <td className="px-3 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => onEditSupplier(s.id)}
                              className="h-9 px-4 border border-[#86EFAC] text-[#15BA5C] rounded-[10px] text-[13px] font-medium hover:bg-green-50 transition-all flex items-center gap-2 cursor-pointer"
                            >
                              <Pencil className="size-4" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onDeleteSupplier({
                                  id: s.id,
                                  name: s.name || "Supplier",
                                })
                              }
                              className="h-9 px-4 border border-[#FCA5A5] text-[#EF4444] rounded-[10px] text-[13px] font-medium hover:bg-red-50 transition-all flex items-center gap-2 cursor-pointer"
                            >
                              <Trash2 className="size-4" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-6 py-4">
          <NotFound
            title="No Supplier"
            description="You don’t have any Supplier , Click on “Add” to add a supplier"
            actionText="Add Supplier"
            onAddClick={onAddSupplier}
            imageSrc={NoSupplierEmptyState}
            imageAlt="no suppliers"
          />
        </div>
      )}

      {!isLoading && suppliers.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={(n) => {
            setItemsPerPage(n);
            setCurrentPage(1);
          }}
          totalItems={totalCount}
        />
      )}
    </div>
  );
};

export default SuppliersTable;
