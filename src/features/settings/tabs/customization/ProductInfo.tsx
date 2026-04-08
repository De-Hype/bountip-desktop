import { useEffect, useMemo, useState } from "react";
import AssetsFiles from "@/assets";
import storeFrontService from "@/services/storefrontService";
import useToastStore from "@/stores/toastStore";
import { useBusinessStore } from "@/stores/useBusinessStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { getCurrencySymbol } from "@/utils/getCurrencySymbol";
import { Pagination } from "@/shared/Pagination/pagination";
import { ProductType } from "@/types/storefront";
import ProductAssets from "@/assets/images/products";

const ProductItemSkeleton = () => (
  <div className="flex items-center justify-between gap-4 rounded-[16px] border border-[#E5E7EB] bg-white px-4 py-3 animate-pulse">
    <div className="flex items-center gap-4">
      <div className="h-14 w-14 rounded-[10px] bg-gray-200" />
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-4 w-24 rounded bg-gray-200" />
          <div className="h-5 w-20 rounded-full bg-gray-200" />
        </div>
        <div className="h-3 w-32 rounded bg-gray-200" />
      </div>
    </div>
    <div className="h-10 w-40 rounded-[9.8px] bg-gray-200" />
  </div>
);

const ProductInfo = () => {
  const { selectedOutlet } = useBusinessStore();
  const { isOnline } = useNetworkStore();
  const { showToast } = useToastStore();

  const [isAvailabilityMode, setIsAvailabilityMode] = useState(false);
  const [selection, setSelection] = useState<"available" | "unavailable">(
    "available",
  );

  const [allProducts, setAllProducts] = useState<ProductType[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const currencySymbol = selectedOutlet?.currency
    ? getCurrencySymbol(selectedOutlet.currency)
    : "";

  const formatAmount = (value: number) =>
    new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(value) ? value : 0);

  const totalItems = allProducts.length;

  const totalAvailable = useMemo(() => {
    return allProducts.filter((p) => Boolean(p.availableAtStorefront)).length;
  }, [allProducts]);

  const totalUnavailable = totalItems - totalAvailable;

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / (limit || 10)));
  }, [limit, totalItems]);

  const products = useMemo(() => {
    const start = (page - 1) * limit;
    const end = start + limit;
    return allProducts.slice(start, end);
  }, [allProducts, limit, page]);

  const normalizeLogoUrl = (value: any) => {
    const raw = String(value ?? "").trim();
    if (!raw) return "";
    return raw.replace(/`/g, "").trim();
  };

  const fetchProducts = async () => {
    if (!selectedOutlet?.id) return;

    setIsLoadingProducts(true);
    try {
      const res = await storeFrontService.loadProducts(
        selectedOutlet.id,
        5000,
        1,
      );
      console.log(res, "This is the response");

      const payload = (res as any)?.data;
      const dataBlock = payload?.data ?? payload;

      const list = Array.isArray(dataBlock?.data)
        ? dataBlock.data
        : Array.isArray(dataBlock)
          ? dataBlock
          : [];

      const mapped = (list as any[])
        .filter(
          (r: any) => r?.isDeleted !== true && r?.createdAtStorefront === true,
        )
        .map((r: any) => ({
          ...r,
          logoUrl: normalizeLogoUrl(r?.logoUrl),
        }));

      setAllProducts(mapped);
      setPage(1);
    } catch {
      showToast("error", "Error", "Failed to load products");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    setAllProducts([]);
    setPage(1);
    fetchProducts();
  }, [selectedOutlet?.id]);

  const handleBulkUpdate = async () => {
    if (!selectedOutlet?.id) return;
    if (!isOnline) {
      showToast(
        "error",
        "You’re offline",
        "Connect to the internet to update product availability.",
      );
      return;
    }

    setIsUpdating(true);
    try {
      const availableAtStorefront = selection === "available";

      await storeFrontService.bulkProductAvailability(selectedOutlet.id, {
        id: "all",
        availableAtStorefront,
        updateData: true,
      });

      setAllProducts((prev) =>
        prev.map((p) => ({
          ...p,
          availableAtStorefront,
        })),
      );

      setIsAvailabilityMode(false);

      showToast(
        "success",
        "Updated",
        availableAtStorefront
          ? "All products are now available."
          : "All products are now unavailable.",
      );
    } catch {
      showToast("error", "Update failed", "Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleProduct = async (
    productId: string,
    nextAvailable: boolean,
  ) => {
    if (!selectedOutlet?.id) return;
    if (!isOnline) {
      showToast(
        "error",
        "You’re offline",
        "Connect to the internet to update product availability.",
      );
      return;
    }

    setIsUpdating(true);
    try {
      await storeFrontService.markAvailability(selectedOutlet.id, productId, {
        availableAtStorefront: nextAvailable,
      });

      setAllProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, availableAtStorefront: nextAvailable }
            : p,
        ),
      );
    } catch {
      showToast("error", "Update failed", "Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[24px] font-bold text-[#000000]">
              Product Management
            </h2>
            <p className="mt-1 text-sm text-[#737373]">
              Manage your products in one place
            </p>
          </div>

          {!isAvailabilityMode && (
            <button
              type="button"
              onClick={() => setIsAvailabilityMode(true)}
              className="text-sm font-medium text-[#15BA5C] cursor-pointer hover:underline"
            >
              Set Availability
            </button>
          )}
        </div>

        {isAvailabilityMode && (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => setSelection("available")}
                className="flex items-center gap-2 text-sm text-[#111827]"
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-[4px] border ${
                    selection === "available"
                      ? "border-[#15BA5C] bg-[#15BA5C]"
                      : "border-[#D1D5DB] bg-white"
                  }`}
                >
                  {selection === "available" && (
                    <span className="h-3 w-3 rounded-[2px] bg-white" />
                  )}
                </span>
                <span>Make all available</span>
              </button>

              <button
                type="button"
                onClick={() => setSelection("unavailable")}
                className="flex items-center gap-2 text-sm text-[#111827]"
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-[4px] border ${
                    selection === "unavailable"
                      ? "border-[#15BA5C] bg-[#15BA5C]"
                      : "border-[#D1D5DB] bg-white"
                  }`}
                >
                  {selection === "unavailable" && (
                    <span className="h-3 w-3 rounded-[2px] bg-white" />
                  )}
                </span>
                <span>Make all unavailable</span>
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleBulkUpdate}
                disabled={isUpdating}
                className="text-sm font-medium text-[#15BA5C] cursor-pointer hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setIsAvailabilityMode(false)}
                className="flex items-center gap-1 text-sm font-medium text-[#EF4444] cursor-pointer hover:underline"
              >
                <span className="text-base leading-none">×</span>
                <span>Cancel</span>
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="relative rounded-[16px] bg-white px-6 py-5 shadow-[0_6px_20px_rgba(0,0,0,0.06)]">
            <span className="text-sm font-medium text-[#898989]">
              Total Available
            </span>
            <p className="mt-3 text-3xl font-semibold text-[#111827]">
              {totalAvailable}
            </p>
            <span className="absolute inset-y-0 left-0 w-1 rounded-l-[16px] bg-[#34D05E]" />
          </div>

          <div className="relative rounded-[16px] bg-white px-6 py-5 shadow-[0_6px_20px_rgba(0,0,0,0.06)]">
            <span className="text-sm font-medium text-[#898989]">
              Total Unavailable
            </span>
            <p className="mt-3 text-3xl font-semibold text-[#111827]">
              {totalUnavailable}
            </p>
            <span className="absolute inset-y-0 left-0 w-1 rounded-l-[16px] bg-[#EF4444]" />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {isLoadingProducts ? (
          <>
            <ProductItemSkeleton />
            <ProductItemSkeleton />
            <ProductItemSkeleton />
            <ProductItemSkeleton />
            <ProductItemSkeleton />
          </>
        ) : (
          products.map((product) => {
            const isAvailable = Boolean(product.availableAtStorefront);

            return (
              <div
                key={product.id}
                className="flex items-center justify-between gap-4 rounded-[16px] border border-[#E5E7EB] bg-white px-4 py-3"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={product.logoUrl || ProductAssets.Broken}
                    alt={product.name}
                    className="h-14 w-14 rounded-[10px] object-cover"
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-sm font-medium text-[#111827]">
                        {product.name}
                      </p>
                      <span
                        className={`rounded-full border px-3 py-0.5 text-xs ${
                          isAvailable
                            ? "border-[#15BA5C] bg-[#ECFDF3] text-[#15BA5C]"
                            : "border-[#EF4444] bg-[#FEF2F2] text-[#EF4444]"
                        }`}
                      >
                        {isAvailable ? "Available" : "Unavailable"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#6B7280]">
                      {product.category} • {currencySymbol}
                      {formatAmount(Number(product.price))}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleToggleProduct(product.id, !isAvailable)}
                  className={`w-40 rounded-[9.8px] px-5 py-2.5 text-sm font-medium text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                    isAvailable
                      ? "bg-[#EF4444] hover:bg-[#DC2626]"
                      : "bg-[#15BA5C] hover:bg-[#13A652]"
                  }`}
                >
                  {isAvailable ? "Make Unavailable" : "Make Available"}
                </button>
              </div>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="pt-4">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            itemsPerPage={limit}
            onItemsPerPageChange={(next) => {
              setLimit(next);
              setPage(1);
            }}
            totalItems={totalItems}
          />
        </div>
      )}
    </section>
  );
};

export default ProductInfo;
