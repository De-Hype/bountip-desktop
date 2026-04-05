import {
  ChevronsUpDown,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import NotFound from "./NotFound";
import useBusinessStore from "@/stores/useBusinessStore";
import { Switch } from "@/features/settings/ui/Switch";
import { Pagination } from "@/shared/Pagination/pagination";
import ProductAssets from "@/assets/images/products";
import ProductFilters, {
  FilterState,
} from "@/features/product-management/ProductFilters";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  allergenList: string | string[];
  isActive: number;
  availableAtStorefront: number;
  logoUrl: string | null;
}

interface CatalogueProductListProps {
  lastUpdated: number;
  onEdit?: (product: any) => void;
}

const CatalogueProductList = ({
  lastUpdated,
  onEdit,
}: CatalogueProductListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [hideImages, setHideImages] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [refreshNonce, setRefreshNonce] = useState(0);

  const { selectedOutlet } = useBusinessStore();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterBounds, setFilterBounds] = useState<{
    minPrice: number;
    maxPrice: number;
    categories: string[];
  }>({ minPrice: 0, maxPrice: 1000, categories: [] });
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    priceRange: [0, 1000],
    category: "All Categories",
    availability: "All",
  });
  const [filtersInitialized, setFiltersInitialized] = useState(false);
  const lastBoundsRef = useRef<{ minPrice: number; maxPrice: number }>({
    minPrice: 0,
    maxPrice: 1000,
  });

  useEffect(() => {
    const handler = () => setRefreshNonce((n) => n + 1);
    window.addEventListener("products:changed", handler);
    return () => {
      window.removeEventListener("products:changed", handler);
    };
  }, []);

  useEffect(() => {
    if (lastUpdated) {
      setCurrentPage(1);
    }
  }, [lastUpdated]);

  // Fetch filter stats (bounds)
  useEffect(() => {
    const fetchStats = async () => {
      if (!selectedOutlet?.id) return;
      try {
        const api = window.electronAPI;
        if (api && api.dbQuery) {
          // Get Min/Max Price
          const priceRes = await api.dbQuery(
            "SELECT MIN(CAST(price AS REAL)) as minPrice, MAX(CAST(price AS REAL)) as maxPrice FROM product WHERE outletId = ? AND isDeleted = 0",
            [selectedOutlet.id],
          );
          const min = priceRes[0]?.minPrice || 0;
          const max = priceRes[0]?.maxPrice || 1000;

          // Get Categories
          const catRes = await api.dbQuery(
            "SELECT DISTINCT category FROM product WHERE outletId = ? AND isDeleted = 0 AND category IS NOT NULL AND category != '' ORDER BY category ASC",
            [selectedOutlet.id],
          );
          const cats = Array.isArray(catRes)
            ? catRes.map((c: any) => c.category)
            : [];

          setFilterBounds({ minPrice: min, maxPrice: max, categories: cats });

          setActiveFilters((prev) => {
            const prevMin = prev.priceRange?.[0] ?? 0;
            const prevMax = prev.priceRange?.[1] ?? 0;
            const wasAuto =
              !filtersInitialized ||
              (prevMin === lastBoundsRef.current.minPrice &&
                prevMax === lastBoundsRef.current.maxPrice);
            if (!wasAuto) return prev;
            return { ...prev, priceRange: [min, max] };
          });
          lastBoundsRef.current = { minPrice: min, maxPrice: max };
          if (!filtersInitialized) setFiltersInitialized(true);
        }
      } catch (error) {
        console.error("Failed to fetch product stats:", error);
      }
    };
    fetchStats();
  }, [selectedOutlet?.id, lastUpdated, refreshNonce]);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: selectedOutlet?.currency || "NGN",
    }).format(price);
  };

  const ProductListSkeleton = () => {
    if (viewMode === "list") {
      return (
        <div className="flex flex-col">
          {[...Array(itemsPerPage)].map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center px-6 py-4 border-b border-[#F3F4F6] animate-pulse"
            >
              <div className="flex items-center gap-3">
                {!hideImages && (
                  <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-gray-200" />
                )}
                <div className="h-4 w-32 bg-gray-200 rounded" />
              </div>
              <div className="h-4 w-16 bg-gray-200 rounded" />
              <div className="h-6 w-20 bg-gray-200 rounded-md" />
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-gray-200 rounded-md" />
                <div className="h-6 w-16 bg-gray-200 rounded-md" />
              </div>
              <div className="justify-self-end h-5 w-9 bg-gray-200 rounded-full" />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {[...Array(itemsPerPage)].map((_, i) => (
          <div
            key={i}
            className="flex flex-col rounded-xl border border-gray-100 bg-white p-4 shadow-sm animate-pulse"
          >
            {hideImages ? (
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gray-200 rounded-t-xl" />
            ) : (
              <div className="mb-4 aspect-[4/3] w-full rounded-lg bg-gray-200" />
            )}
            <div className="mb-2 h-4 w-16 bg-gray-200 rounded" />
            <div className="mb-2 h-4 w-3/4 bg-gray-200 rounded" />
            <div className="mb-4 h-4 w-1/3 bg-gray-200 rounded" />
            <div className="flex items-end justify-between mt-auto pt-4">
              <div className="flex flex-col gap-2">
                <div className="h-5 w-16 bg-gray-200 rounded-md" />
                <div className="h-5 w-12 bg-gray-200 rounded-md" />
              </div>
              <div className="h-5 w-9 bg-gray-200 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handleViewModeChange = (mode: "list" | "grid") => {
    setViewMode(mode);
    setItemsPerPage(mode === "grid" ? 15 : 10);
    setCurrentPage(1);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      if (!selectedOutlet?.id) return;

      setLoading(products.length === 0);
      try {
        const api = window.electronAPI;
        if (api && api.dbQuery) {
          let query =
            "SELECT * FROM product WHERE outletId = ? AND isDeleted = 0";
          const params: any[] = [selectedOutlet.id];

          if (debouncedSearchTerm) {
            query += " AND (name LIKE ? OR description LIKE ?)";
            params.push(`%${debouncedSearchTerm}%`, `%${debouncedSearchTerm}%`);
          }

          // Apply Filters
          if (filtersInitialized) {
            // Price Range
            if (
              activeFilters.priceRange &&
              activeFilters.priceRange.length === 2
            ) {
              query +=
                " AND CAST(price AS REAL) >= ? AND CAST(price AS REAL) <= ?";
              params.push(
                activeFilters.priceRange[0],
                activeFilters.priceRange[1],
              );
            }

            // Category
            if (activeFilters.category !== "All Categories") {
              query += " AND category = ?";
              params.push(activeFilters.category);
            }

            // Availability
            if (activeFilters.availability !== "All") {
              const isAvailable =
                activeFilters.availability === "Available" ? 1 : 0;
              query += " AND availableAtStorefront = ?";
              params.push(isAvailable);
            }
          }

          // Use COLLATE NOCASE for case-insensitive sorting to ensure products
          // like "apple" and "Apple" are grouped together, and prevent
          // new products from appearing at the top/bottom incorrectly due to case.
          query += " ORDER BY name COLLATE NOCASE ASC";

          const result = await api.dbQuery(query, params);

          if (Array.isArray(result)) {
            const parsedProducts = result.map((p: any) => {
              let allergenList: string[] = [];
              try {
                const parsed = p.allergenList ? JSON.parse(p.allergenList) : [];
                allergenList = Array.isArray(parsed) ? parsed : [];
              } catch (e) {
                // ignore parsing error
              }
              return {
                ...p,
                allergenList,
              };
            });
            setProducts(parsedProducts);
            // Reset to first page when search changes
            if (debouncedSearchTerm) {
              setCurrentPage(1);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [
    selectedOutlet?.id,
    debouncedSearchTerm,
    lastUpdated,
    refreshNonce,
    filtersInitialized,
    activeFilters,
  ]);

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = products.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <section className="bg-white rounded-[14px]  mx-5 px-4 py-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-[16px] w-[380px]">
          <h2 className="text-xl font-semibold text-[#1C1B20]">All Products</h2>
          <p className="text-sm text-[#737373]">
            Create, organize, and manage all your bakery products in one place
          </p>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3">
          <div className="flex w-full max-w-md items-stretch rounded-[10px] border border-[#E5E7EB] overflow-hidden h-11">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search"
              className="flex-1 px-3 py-2.5 text-sm outline-none placeholder-[#A6A6A6]"
            />
            <button
              type="button"
              title="Search products"
              className="flex h-11 w-11 items-center justify-center bg-[#15BA5C] text-white"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setHideImages((prev) => !prev)}
            className="flex h-11 items-center gap-2 rounded-[10px] border border-[#E7E7E7] bg-white px-3 text-sm font-medium text-[#1C1B20]"
          >
            <span>Hide Images</span>
            <span
              className={`relative inline-flex cursor-pointer h-5 w-9 items-center rounded-full transition-colors ${
                hideImages ? "bg-[#15BA5C]" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  hideImages ? "translate-x-4" : "translate-x-1"
                }`}
              />
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-sm font-medium text-[#1C1B20]"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>

          <div className="flex items-center gap-2 rounded-[10px] bg-[#F9FAFB] p-1.5">
            <button
              type="button"
              title="List view"
              onClick={() => handleViewModeChange("list")}
              className={`flex h-9 w-9 items-center cursor-pointer justify-center rounded-[8px] ${
                viewMode === "list"
                  ? "bg-white text-[#15BA5C] shadow-sm"
                  : "text-[#9CA3AF]"
              }`}
            >
              <List className="w-4 h-4 font-bold text-[#1C1B20]" />
            </button>
            <button
              type="button"
              title="Grid view"
              onClick={() => handleViewModeChange("grid")}
              className={`flex h-9 w-9 items-center cursor-pointer justify-center rounded-[8px] ${
                viewMode === "grid"
                  ? "bg-white text-[#15BA5C] shadow-sm"
                  : "text-[#9CA3AF]"
              }`}
            >
              <LayoutGrid className="w-4 h-4 font-bold text-[#1C1B20]" />
            </button>
          </div>
        </div>
      </div>
      <div className="mt-4">
        {viewMode === "list" && (
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center rounded-[10px] bg-[#FAFAFC] px-6 h-[50px] text-sm font-medium text-[#4B5563]">
            {[
              "Product Name",
              "Price",
              "Category",
              "Allergens",
              "Availability",
            ].map((label) => (
              <button
                key={label}
                type="button"
                className={`flex items-center gap-1 text-left text-[#4B5563] ${
                  label === "Availability" ? "justify-self-end" : ""
                }`}
              >
                <span>{label}</span>
                <ChevronsUpDown className="h-4 w-4 text-[#D1D5DB]" />
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <ProductListSkeleton />
        ) : products.length > 0 ? (
          viewMode === "list" ? (
            <div className="flex flex-col">
              {paginatedProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => onEdit?.(product)}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center px-6 py-4 border-b border-[#F3F4F6] hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {/* Product Name & Image */}
                  <div className="flex items-center gap-3">
                    {!hideImages && (
                      <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-gray-100 overflow-hidden">
                        {product.logoUrl ? (
                          <img
                            src={product.logoUrl}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <img
                            src={ProductAssets.Broken}
                            alt="No image"
                            className="h-full w-full object-cover opacity-50"
                          />
                        )}
                      </div>
                    )}
                    <span className="font-medium text-[#1C1B20]">
                      {product.name}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="text-sm font-semibold text-[#1C1B20]">
                    {formatPrice(product.price || 0)}
                  </div>

                  {/* Category */}
                  <div>
                    {product.category && (
                      <span className="inline-flex items-center rounded-md bg-pink-50 px-2 py-1 text-xs font-medium text-pink-700 ring-1 ring-inset ring-pink-700/10">
                        {product.category}
                      </span>
                    )}
                  </div>

                  {/* Allergens */}
                  <div className="flex flex-wrap items-center gap-2">
                    {Array.isArray(product.allergenList) &&
                    product.allergenList.length > 0 ? (
                      <>
                        {product.allergenList
                          .slice(0, 2)
                          .map((allergen: string) => (
                            <span
                              key={allergen}
                              className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10"
                            >
                              {allergen}
                            </span>
                          ))}
                        {product.allergenList.length > 2 && (
                          <span className="inline-flex items-center rounded-full bg-[#15BA5C] px-2 py-0.5 text-xs font-medium text-white">
                            +{product.allergenList.length - 2}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-sm text-gray-400">None</span>
                    )}
                  </div>

                  {/* Availability & Actions */}
                  <div className="justify-self-end flex items-center gap-4">
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center"
                    >
                      <Switch
                        checked={!!product.availableAtStorefront}
                        onChange={() => {}}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {paginatedProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => onEdit?.(product)}
                  className="group flex flex-col rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden cursor-pointer"
                >
                  {hideImages ? (
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#15BA5C]" />
                  ) : (
                    <div className="mb-3 aspect-[4/3] w-full rounded-lg bg-gray-100 overflow-hidden relative flex items-center justify-center">
                      {product.logoUrl ? (
                        <img
                          src={product.logoUrl}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <img
                          src={ProductAssets.Broken}
                          alt="No image"
                          className="h-full w-full object-cover opacity-50"
                        />
                      )}
                    </div>
                  )}

                  <div className="mb-2">
                    {product.category && (
                      <span className="inline-flex items-center rounded-md bg-pink-50 px-2 py-1 text-xs font-medium text-pink-700 ring-1 ring-inset ring-pink-700/10">
                        {product.category}
                      </span>
                    )}
                  </div>

                  <h3
                    className="font-semibold text-[#1C1B20] text-sm mb-1 truncate"
                    title={product.name}
                  >
                    {product.name}
                  </h3>

                  <div className="text-sm font-bold text-[#15BA5C] mb-3">
                    {formatPrice(product.price || 0)}
                  </div>

                  <div className="flex items-end justify-between mt-auto">
                    <div className="flex flex-col gap-1 w-[70%]">
                      {Array.isArray(product.allergenList) &&
                      product.allergenList.length > 0 ? (
                        <>
                          <span className="inline-flex w-fit items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 truncate max-w-full">
                            {product.allergenList[0]}
                          </span>
                          {product.allergenList.length > 1 && (
                            <div className="flex items-center gap-1">
                              <span className="inline-flex w-fit items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 truncate max-w-full">
                                {product.allergenList[1]}
                              </span>
                              {product.allergenList.length > 2 && (
                                <span className="inline-flex items-center justify-center rounded-full bg-[#15BA5C] h-5 min-w-[20px] px-1 text-[10px] font-medium text-white">
                                  +{product.allergenList.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">
                          No allergen
                        </span>
                      )}
                    </div>

                    <div onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={!!product.availableAtStorefront}
                        onChange={() => {}}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <NotFound />
        )}
      </div>

      {!loading && products.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={(items) => {
            setItemsPerPage(items);
            setCurrentPage(1);
          }}
        />
      )}

      {/* Filters Modal */}
      <ProductFilters
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={(filters) => {
          setActiveFilters(filters);
          setIsFilterOpen(false);
        }}
        minPrice={filterBounds.minPrice}
        maxPrice={filterBounds.maxPrice}
        categories={filterBounds.categories}
      />
    </section>
  );
};

export default CatalogueProductList;
