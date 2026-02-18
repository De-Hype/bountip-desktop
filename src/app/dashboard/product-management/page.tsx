import CatalogueProductList from "@/features/product-management/CatalogueProductList";
import { Download, Plus, ChevronDown, Upload, CloudUpload } from "lucide-react";
import { useState } from "react";

const ProductManagementPage = () => {
  const [activeTab, setActiveTab] = useState<"catalogue" | "basket">(
    "catalogue",
  );
  const [isBulkMenuOpen, setIsBulkMenuOpen] = useState(false);

  return (
    <section className="flex flex-col gap-4">
      <div className="px-4 py-4 flex items-center justify-between bg-white w-full">
        <div className="flex p-2 rounded-[10px] bg-[#F2F4F5]">
          <button
            onClick={() => setActiveTab("catalogue")}
            className={`flex-1 py-1 px-6 h-10 cursor-pointer rounded-lg font-medium transition-colors ${
              activeTab === "catalogue"
                ? "bg-white text-gray-900"
                : "bg-gray-100 text-gray-500 border-2 border-transparent hover:bg-gray-200"
            }`}
          >
            Catalogue
          </button>
          <button
            onClick={() => setActiveTab("basket")}
            className={`flex-1 py-1 px-6 h-10 cursor-pointer rounded-lg font-medium transition-colors ${
              activeTab === "basket"
                ? "bg-white text-gray-900 "
                : "bg-gray-100 text-gray-500 border-2 border-transparent hover:bg-gray-200"
            }`}
          >
            Basket
          </button>
        </div>
        {activeTab === "catalogue" && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsBulkMenuOpen((prev) => !prev)}
                className="inline-flex cursor-pointer h-11 items-center gap-2 rounded-[10px] border border-[#15BA5C] px-4 py-2 text-sm font-medium bg-white hover:bg-[#F2FFF8] transition-colors"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 28 28"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M19.25 8.75C19.0925 8.75 18.9525 8.75 18.795 8.7675C18.2576 7.22818 17.2546 5.89416 15.9251 4.95034C14.5956 4.00653 13.0054 3.49966 11.375 3.5C7.035 3.5 3.5 7.035 3.5 11.375C3.5 11.935 3.57 12.495 3.71 13.09C1.435 14.2975 0 16.625 0 19.25C0 23.1175 3.1325 26.25 7 26.25H14V17.29L11.27 20.02C10.85 20.44 10.15 20.44 9.73 20.02C9.31 19.6 9.31 18.9 9.73 18.48L13.475 14.7175C14.245 13.9475 15.4875 13.9475 16.2575 14.7175L20.02 18.48C20.44 18.9 20.44 19.6 20.02 20.02C19.81 20.23 19.53 20.335 19.25 20.335C18.97 20.335 18.69 20.23 18.48 20.02L15.75 17.29V26.25H19.25C24.08 26.25 28 22.33 28 17.5C28 12.67 24.08 8.75 19.25 8.75Z"
                    fill="#15BA5C"
                  />
                </svg>

                <span className="text-[#1C1B20]">Bulk Upload</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {isBulkMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-[10px] border border-gray-200 bg-white shadow-lg py-2 z-10">
                  <button
                    type="button"
                    onClick={() => setIsBulkMenuOpen(false)}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBulkMenuOpen(false)}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-400 text-[10px] text-gray-500">
                      ↺
                    </span>
                    <span>View Upload History</span>
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              className="inline-flex cursor-pointer h-11 items-center gap-2 rounded-[10px] border border-[#15BA5C] px-4 py-2 text-sm font-medium bg-white hover:bg-[#F2FFF8] transition-colors"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 28 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15.8396 20.1476L9.87797 16.8961C9.30571 17.4641 8.57808 17.85 7.78682 18.0052C6.99556 18.1603 6.17609 18.0777 5.43171 17.7677C4.68734 17.4578 4.05139 16.9344 3.60404 16.2635C3.15669 15.5927 2.91797 14.8044 2.91797 13.9981C2.91797 13.1918 3.15669 12.4035 3.60404 11.7327C4.05139 11.0618 4.68734 10.5384 5.43171 10.2285C6.17609 9.91854 6.99556 9.83591 7.78682 9.99103C8.57808 10.1461 9.30571 10.532 9.87797 11.1001L15.8396 7.84859C15.6352 6.88929 15.7828 5.88843 16.2557 5.02906C16.7285 4.16968 17.4948 3.50921 18.4146 3.16843C19.3343 2.82765 20.346 2.82933 21.2646 3.17316C22.1833 3.51699 22.9474 4.18 23.4174 5.04094C23.8873 5.90188 24.0317 6.90322 23.824 7.86184C23.6164 8.82046 23.0706 9.67231 22.2865 10.2616C21.5024 10.8509 20.5324 11.1383 19.5539 11.0712C18.5753 11.004 17.6536 10.5869 16.9573 9.89609L10.9956 13.1476C11.1149 13.7079 11.1149 14.2871 10.9956 14.8474L16.9573 18.1001C17.6536 17.4093 18.5753 16.9921 19.5539 16.925C20.5324 16.8579 21.5024 17.1453 22.2865 17.7346C23.0706 18.3239 23.6164 19.1757 23.824 20.1343C24.0317 21.093 23.8873 22.0943 23.4174 22.9552C22.9474 23.8162 22.1833 24.4792 21.2646 24.823C20.346 25.1669 19.3343 25.1685 18.4146 24.8278C17.4948 24.487 16.7285 23.8265 16.2557 22.9671C15.7828 22.1078 15.6352 21.1069 15.8396 20.1476Z"
                  fill="#15BA5C"
                />
              </svg>

              <span className="text-[#1C1B20]">Export</span>
            </button>

            <button
              type="button"
              className="inline-flex cursor-pointer h-11 items-center gap-2 rounded-[10px] bg-[#15BA5C] px-4 py-2 text-sm font-medium text-white hover:bg-[#13A652] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add a Product</span>
            </button>
          </div>
        )}
      </div>
      {activeTab === "catalogue" && <CatalogueProductList />}
    </section>
  );
};

export default ProductManagementPage;
