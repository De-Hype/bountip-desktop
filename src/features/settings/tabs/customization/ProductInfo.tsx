import { useState } from "react";
import AssetsFiles from "@/assets";

type Product = {
  id: number;
  name: string;
  category: string;
  price: string;
  status: "available" | "unavailable";
};

const initialProducts: Product[] = [
  {
    id: 1,
    name: "Classic sourdough loaf",
    category: "Bread",
    price: "£25",
    status: "available",
  },
  {
    id: 2,
    name: "Classic sourdough loaf",
    category: "Bread",
    price: "£25",
    status: "unavailable",
  },
  {
    id: 3,
    name: "Classic sourdough loaf",
    category: "Bread",
    price: "£25",
    status: "available",
  },
  {
    id: 4,
    name: "Classic sourdough loaf",
    category: "Bread",
    price: "£25",
    status: "available",
  },
];

const ProductInfo = () => {
  const [isAvailabilityMode, setIsAvailabilityMode] = useState(false);
  const [selection, setSelection] = useState<"available" | "unavailable">(
    "available",
  );
  const [products, setProducts] = useState<Product[]>(initialProducts);

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
                onClick={() => {
                  setProducts((prev) =>
                    prev.map((product) => ({
                      ...product,
                      status:
                        selection === "available" ? "available" : "unavailable",
                    })),
                  );
                }}
                className="text-sm font-medium text-[#15BA5C] cursor-pointer hover:underline"
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
            <p className="mt-3 text-3xl font-semibold text-[#111827]">127</p>
            <span className="absolute inset-y-0 left-0 w-1 rounded-l-[16px] bg-[#34D05E]" />
          </div>

          <div className="relative rounded-[16px] bg-white px-6 py-5 shadow-[0_6px_20px_rgba(0,0,0,0.06)]">
            <span className="text-sm font-medium text-[#898989]">
              Total Unavailable
            </span>
            <p className="mt-3 text-3xl font-semibold text-[#111827]">127</p>
            <span className="absolute inset-y-0 left-0 w-1 rounded-l-[16px] bg-[#34D05E]" />
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {products.map((product) => {
          const isAvailable = product.status === "available";

          return (
            <div
              key={product.id}
              className="flex items-center justify-between gap-4 rounded-[16px] border border-[#E5E7EB] bg-white px-4 py-3"
            >
              <div className="flex items-center gap-4">
                <img
                  src={AssetsFiles.product}
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
                    {product.category} • {product.price}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setProducts((prev) =>
                    prev.map((item) =>
                      item.id === product.id
                        ? {
                            ...item,
                            status: isAvailable ? "unavailable" : "available",
                          }
                        : item,
                    ),
                  )
                }
                className={`w-40 rounded-[9.8px] px-5 py-2.5 text-sm font-medium text-white cursor-pointer ${
                  isAvailable
                    ? "bg-[#EF4444] hover:bg-[#DC2626]"
                    : "bg-[#15BA5C] hover:bg-[#13A652]"
                }`}
              >
                {isAvailable ? "Make Unavailable" : "Make Available"}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ProductInfo;
