import {
  ChevronsUpDown,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useState } from "react";
import NotFound from "./NotFound";

const CatalogueProductList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [hideImages, setHideImages] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

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
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-sm font-medium text-[#1C1B20]"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>

          <div className="flex items-center gap-2 rounded-[10px] bg-[#F9FAFB] p-1.5">
            <button
              type="button"
              title="List view"
              onClick={() => setViewMode("list")}
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
              onClick={() => setViewMode("grid")}
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
        <NotFound />
      </div>
    </section>
  );
};

export default CatalogueProductList;
