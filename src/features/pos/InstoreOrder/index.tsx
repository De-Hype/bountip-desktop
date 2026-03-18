"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Trash2,
  ChevronRight as ChevronRightIcon,
  Eye,
  EyeOff,
  X,
  PackageSearch,
} from "lucide-react";
import { useBusinessStore } from "@/stores/useBusinessStore";
import useCustomerStore, { Customer } from "@/stores/useCustomerStore";
import NotFound from "./NotFound";
import CustomerSelectionModal from "@/shared/Modals/CustomerSelectionModal";
import { getCurrencySymbol } from "@/utils/getCurrencySymbol";
import POSAssests from "@/assets/images/pos";
import ProductAssets from "@/assets/images/products";

const InStoreOrder = () => {
  const [showImages, setShowImages] = useState(true);
  const [categories, setCategories] = useState<string[]>(["All Items"]);
  const [selectedCategory, setSelectedCategory] = useState("All Items");
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  const { selectedOutlet } = useBusinessStore();

  useEffect(() => {
    setSelectedCustomer(null);
    setCart([]);
  }, [selectedOutlet?.id]);
  const currencySymbol = selectedOutlet?.currency
    ? getCurrencySymbol(selectedOutlet.currency)
    : "£";

  // Fetch categories from system_default
  const fetchCategories = useCallback(async () => {
    try {
      const api = (window as any).electronAPI;
      if (!api?.dbQuery) return;

      const result = await api.dbQuery(
        "SELECT data FROM system_default WHERE key = 'category' AND outletId = ?",
        [selectedOutlet?.id],
      );

      if (result && result[0]) {
        try {
          const parsedData = JSON.parse(result[0].data);
          const categoryList = Array.isArray(parsedData)
            ? ["All Items", ...parsedData.map((c: any) => c.name || c)]
            : ["All Items"];
          setCategories(categoryList);
        } catch (e) {
          console.error("Failed to parse category data:", e);
        }
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  }, [selectedOutlet?.id]);

  // Fetch products for the grid
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const api = (window as any).electronAPI;
      if (!api?.dbQuery) return;

      let sql = "SELECT * FROM product WHERE outletId = ? AND isActive = 1";
      const params: any[] = [selectedOutlet?.id];

      if (searchTerm) {
        sql += " AND (name LIKE ? OR category LIKE ?)";
        params.push(`%${searchTerm}%`, `%${searchTerm}%`);
      }

      if (selectedCategory !== "All Items") {
        sql += " AND category = ?";
        params.push(selectedCategory);
      }

      const result = await api.dbQuery(sql, params);
      setProducts(result || []);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedOutlet?.id, searchTerm, selectedCategory]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + (item.price || 0) * item.quantity,
    0,
  );

  return (
    <div className="bg-[#F9FAFB] h-full -my-8 py-8 relative overflow-hidden">
      {/* Container for absolute positioning on mobile, flex on desktop */}
      <div className="relative h-full lg:flex lg:flex-row lg:gap-6 lg:overflow-hidden pb-8">
        {/* Section 1: Order Details Sidebar (Top on mobile) */}
        <div
          className={`absolute lg:relative top-0 left-0 right-0 z-20 overflow-hidden
            ${cart.length === 0 ? "h-[calc(100vh-250px)]" : "h-[450px]"} 
            lg:h-fit lg:w-[400px] lg:order-2 lg:shrink-0`}
        >
          <div className="bg-white border border-[#E5E7EB] rounded-[16px] flex flex-col shadow-lg overflow-hidden h-full mx-1 lg:mx-0">
            <div className="p-4 border-b border-[#F3F4F6] flex-shrink-0 flex items-center justify-between bg-white sticky top-0 z-10">
              <h2 className="text-[18px] font-bold text-[#1C1B20]">
                Order Details
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-[#EF4444] text-white text-[11px] rounded-full">
                  {cart.length}
                </span>
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar min-h-0 overscroll-contain">
              {cart.length > 0 ? (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col border-b border-[#F3F4F6] pb-3 last:border-0"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex-1 min-w-0 mr-2">
                          <h4 className="text-[14px] font-bold text-[#1C1B20] truncate">
                            {item.name}
                          </h4>
                          <p className="text-[13px] font-medium text-[#15BA5C]">
                            {currencySymbol}
                            {item.price?.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 border border-[#E5E7EB] rounded-[6px] p-0.5 bg-[#F9FAFB]">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-5 h-5 flex items-center justify-center text-[#6B7280] hover:text-[#1C1B20] hover:bg-gray-100 rounded"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[13px] font-bold w-4 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-5 h-5 flex items-center justify-center text-[#15BA5C] hover:text-[#13A652] hover:bg-green-50 rounded"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-6">
                  <div className="w-24 h-24 mb-6 bg-[#F0FDF4] rounded-full flex items-center justify-center relative flex-shrink-0">
                    <div className="absolute inset-0 bg-green-100/30 animate-pulse rounded-full" />
                    <img
                      src={POSAssests.CartOrderDetails}
                      alt="Empty Cart"
                      className="w-16 h-16 relative z-10"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                  <h3 className="text-[18px] font-bold text-[#1C1B20] mb-2">
                    Cart is Empty
                  </h3>
                  <p className="text-[14px] text-[#6B7280]">
                    Add items from the menu to start your order
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-[#F9FAFB] border-t border-[#E5E7EB] flex-shrink-0 mt-auto">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="flex items-center gap-2 text-[#6B7280] text-[13px] hover:text-[#1C1B20]"
                >
                  <div className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center">
                    <Plus className="w-2.5 h-2.5" />
                  </div>
                  {selectedCustomer ? (
                    <span className="font-bold text-[#15BA5C]">
                      {selectedCustomer.name}
                    </span>
                  ) : (
                    "SELECT CUSTOMER"
                  )}
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCart([])}
                  className="flex items-center gap-1 text-[#EF4444] text-[13px] hover:text-[#DC2626] font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              </div>

              <div className="space-y-1.5 mb-4">
                <div className="flex justify-between text-[#6B7280] text-[14px]">
                  <span>Sub-total</span>
                  <span>
                    {currencySymbol}
                    {subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-[#1C1B20] text-[16px] font-bold pt-1.5 border-t border-gray-200">
                  <span>Total</span>
                  <span>
                    {currencySymbol}
                    {subtotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                disabled={cart.length === 0}
                className="w-full py-3 bg-[#15BA5C] text-white rounded-[10px] font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-[#13A652] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-green-200 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                Pay Now
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Product Grid Area (Bottom on mobile) */}
        <div
          className={`absolute lg:relative left-0 right-0 bottom-0 z-10 overflow-hidden
            ${cart.length === 0 ? "top-[calc(100vh-234px)]" : "top-[466px]"} 
            lg:top-0 lg:flex-1 lg:flex lg:flex-col lg:min-h-0 lg:min-w-0`}
        >
          <div className="h-full flex flex-col min-h-0 px-1">
            {/* Category Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar flex-shrink-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-[8px] whitespace-nowrap text-[13px] font-medium transition-colors ${
                    selectedCategory === cat
                      ? "bg-[#D1FAE5] text-[#065F46] border border-[#10B981]"
                      : "bg-white text-[#6B7280] border border-[#E5E7EB] hover:bg-gray-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search and Toggle */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4 flex-shrink-0">
              <div className="flex items-center border border-[#E5E7EB] rounded-[8px] overflow-hidden bg-white shadow-sm w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 w-full sm:w-[240px] outline-none text-[14px] text-[#1C1B20] placeholder-[#9CA3AF]"
                />
                <button className="bg-[#15BA5C] p-2 text-white">
                  <Search className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setShowImages(!showImages)}
                className="flex items-center gap-2 px-4 py-2 border border-[#E5E7EB] rounded-[8px] bg-white text-[#6B7280] hover:bg-gray-50 transition-colors text-[13px] font-medium shadow-sm w-full sm:w-auto justify-center"
              >
                {showImages ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                {showImages ? "Hide Images" : "Show Images"}
              </button>
            </div>

            {/* Product Grid */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-8 lg:pb-0 overscroll-contain">
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-[12px] border border-[#E5E7EB] p-2 flex flex-col animate-pulse"
                    >
                      {showImages && (
                        <div className="aspect-[5/4] bg-gray-100 rounded-[8px] mb-2" />
                      )}
                      <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                      <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
                      <div className="h-8 bg-gray-100 rounded w-full mt-auto" />
                    </div>
                  ))}
                </div>
              ) : products.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white rounded-[12px] border border-[#E5E7EB] p-2 flex flex-col shadow-sm hover:border-[#15BA5C] transition-all hover:shadow-md cursor-pointer group active:scale-95"
                      onClick={() => addToCart(product)}
                    >
                      {showImages && (
                        <div className="aspect-[5/4] bg-[#F3F4F6] rounded-[8px] mb-2 flex items-center justify-center overflow-hidden">
                          <img
                            src={product.logoUrl || ProductAssets.Broken}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <h3 className="text-[13px] font-bold text-[#1C1B20] mb-0.5 truncate">
                        {product.name}
                      </h3>
                      <p className="text-[12px] font-bold text-[#15BA5C] mb-2">
                        {currencySymbol}
                        {product.price?.toLocaleString()}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        className="w-full py-1.5 bg-[#15BA5C] cursor-pointer text-white rounded-[6px] text-[12px] font-bold hover:bg-[#13A652] transition-colors mt-auto shadow-sm active:bg-[#0E8A44]"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
                  <div className="w-20 h-20 mb-4 bg-gray-50 rounded-full flex items-center justify-center">
                    <PackageSearch className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-[16px] font-bold text-[#1C1B20] mb-1">
                    No Products Found
                  </h3>
                  <p className="text-[14px] text-[#6B7280] max-w-[280px]">
                    {searchTerm || selectedCategory !== "All Items"
                      ? "Try adjusting your search or category filters to find what you're looking for."
                      : "There are no products available for this outlet at the moment."}
                  </p>
                  {(searchTerm || selectedCategory !== "All Items") && (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedCategory("All Items");
                      }}
                      className="mt-4 text-[#15BA5C] text-[14px] font-bold hover:underline"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Selection Modal */}
      <CustomerSelectionModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSelect={(customer) => {
          setSelectedCustomer(customer);
          setIsCustomerModalOpen(false);
        }}
      />
    </div>
  );
};

export default InStoreOrder;
