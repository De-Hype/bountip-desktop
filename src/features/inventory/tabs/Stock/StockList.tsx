import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  SlidersHorizontal,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import NotFound from "../../NotFound";

interface LotRecord {
  id: string;
  lotNumber: string;
  unitOfMeasure: string;
  recordedLevel: number;
  countedQuantity: string;
  variance: number;
  reason: string;
}

interface StockItem {
  name: string;
  lots: LotRecord[];
  totalStock: number;
}

const StockList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Select Category");

  const searchRef = useRef<HTMLDivElement>(null);

  // Simulated search results
  const dummyOptions = [
    { name: "Onions", totalStock: 13949492, unit: "Kg" },
    { name: "Pepper", totalStock: 139494, unit: "Kg" },
    { name: "Salt", totalStock: 50000, unit: "g" },
  ];

  // Simulated lots for Onions
  const onionsLots: LotRecord[] = [
    {
      id: "1",
      lotNumber: "LOT23",
      unitOfMeasure: "Kilogram",
      recordedLevel: 4000,
      countedQuantity: "",
      variance: 0,
      reason: "",
    },
    {
      id: "2",
      lotNumber: "LOT39",
      unitOfMeasure: "Grams",
      recordedLevel: 3449,
      countedQuantity: "",
      variance: 0,
      reason: "",
    },
    {
      id: "3",
      lotNumber: "LOT94",
      unitOfMeasure: "Ounce",
      recordedLevel: 2283,
      countedQuantity: "",
      variance: 0,
      reason: "",
    },
    {
      id: "4",
      lotNumber: "LOT12",
      unitOfMeasure: "Each",
      recordedLevel: 1823,
      countedQuantity: "",
      variance: 0,
      reason: "",
    },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectItem = (item: (typeof dummyOptions)[0]) => {
    setIsLoading(true);
    // Simulate API delay
    setTimeout(() => {
      setSelectedItem({
        name: item.name,
        lots: item.name === "Onions" ? onionsLots : [], // Only Onions has dummy lots for now
        totalStock: item.totalStock,
      });
      setShowSearchResults(false);
      setSearchTerm("");
      setIsLoading(false);
    }, 500);
  };

  const updateLot = (id: string, field: keyof LotRecord, value: string) => {
    if (!selectedItem) return;
    setSelectedItem({
      ...selectedItem,
      lots: selectedItem.lots.map((lot) => {
        if (lot.id === id) {
          const updatedLot = { ...lot, [field]: value };
          // Calculate variance if countedQuantity changes
          if (field === "countedQuantity") {
            const counted = parseFloat(value) || 0;
            updatedLot.variance = counted - lot.recordedLevel;
          }
          return updatedLot;
        }
        return lot;
      }),
    });
  };

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8 px-1">
        <h1 className="text-[20px] font-bold text-gray-900">Stock Count</h1>

        <div className="flex items-center gap-3">
          {/* Category Dropdown */}
          <div className="relative">
            <button className="h-11 px-4 min-w-[160px] bg-white border border-gray-200 rounded-[10px] flex items-center justify-between text-sm text-gray-700 hover:bg-gray-50 transition-all cursor-pointer">
              {selectedCategory}
              <ChevronDown className="size-4 text-gray-400" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-[240px]" ref={searchRef}>
            <div className="flex items-center">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSearchResults(e.target.value.length > 0);
                }}
                onFocus={() =>
                  searchTerm.length > 0 && setShowSearchResults(true)
                }
                placeholder="Search"
                className="w-full h-11 px-4 bg-white border border-gray-200 rounded-l-[10px] outline-none focus:border-[#15BA5C] transition-all text-sm placeholder:text-gray-400"
              />
              <button className="h-11 px-4 bg-[#15BA5C] text-white rounded-r-[10px] hover:bg-[#119E4D] transition-colors cursor-pointer flex items-center justify-center shrink-0">
                <Search className="size-5" />
              </button>
            </div>

            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-[10px] shadow-xl z-[100] py-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                {dummyOptions
                  .filter((opt) =>
                    opt.name.toLowerCase().includes(searchTerm.toLowerCase()),
                  )
                  .map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectItem(opt)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <span className="text-sm font-medium text-gray-700 group-hover:text-[#15BA5C]">
                        {opt.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {opt.totalStock} {opt.unit}
                      </span>
                    </button>
                  ))}
                {dummyOptions.filter((opt) =>
                  opt.name.toLowerCase().includes(searchTerm.toLowerCase()),
                ).length === 0 && (
                  <div className="px-4 py-3 text-sm text-gray-400 italic text-center">
                    No items found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Activity Log Button */}
          <button className="h-11 px-5 bg-white border border-gray-200 rounded-[10px] text-[14px] font-medium text-[#4B5563] hover:bg-gray-50 transition-all flex items-center gap-2 cursor-pointer shadow-sm">
            Activity Log
            <ChevronRight className="size-4 text-gray-400" />
          </button>

          {/* Filters Button */}
          <button className="h-11 px-5 bg-white border border-gray-200 rounded-[10px] text-[14px] font-medium text-[#4B5563] hover:bg-gray-50 transition-all flex items-center gap-2 cursor-pointer shadow-sm">
            <SlidersHorizontal className="size-4 text-gray-400" />
            Filters
          </button>
        </div>
      </div>

      {/* Main Content Section */}
      <div className="flex-1 overflow-hidden">
        {selectedItem ? (
          <div className="space-y-6">
            <h2 className="text-[24px] font-bold text-gray-900 px-1">
              {selectedItem.name}
            </h2>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead className="bg-[#F9FAFB]">
                  <tr>
                    <th className="px-4 py-4 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                      <div className="flex items-center gap-1.5 cursor-pointer hover:text-gray-600 transition-colors group">
                        Lot Number
                        <ChevronUp className="size-3.5 text-gray-300 group-hover:text-gray-400" />
                      </div>
                    </th>
                    <th className="px-4 py-4 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                      <div className="flex items-center gap-1.5 cursor-pointer hover:text-gray-600 transition-colors group">
                        Unit of Measure
                        <ChevronUp className="size-3.5 text-gray-300 group-hover:text-gray-400" />
                      </div>
                    </th>
                    <th className="px-4 py-4 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                      <div className="flex items-center gap-1.5 cursor-pointer hover:text-gray-600 transition-colors group">
                        Recorded Level
                        <ChevronUp className="size-3.5 text-gray-300 group-hover:text-gray-400" />
                      </div>
                    </th>
                    <th className="px-4 py-4 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                      Counted Quantity
                    </th>
                    <th className="px-4 py-4 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                      <div className="flex items-center gap-1.5 cursor-pointer hover:text-gray-600 transition-colors group">
                        Variance
                        <ChevronUp className="size-3.5 text-gray-300 group-hover:text-gray-400" />
                      </div>
                    </th>
                    <th className="px-4 py-4 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                      <div className="flex items-center gap-1.5 cursor-pointer hover:text-gray-600 transition-colors group">
                        Reason for Discrepancy
                        <ChevronUp className="size-3.5 text-gray-300 group-hover:text-gray-400" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {selectedItem.lots.map((lot) => (
                    <tr
                      key={lot.id}
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="px-4 py-5 text-sm font-medium text-gray-700">
                        {lot.lotNumber}
                      </td>
                      <td className="px-4 py-5 text-sm text-gray-600">
                        {lot.unitOfMeasure}
                      </td>
                      <td className="px-4 py-5 text-sm text-gray-600">
                        {lot.recordedLevel}
                      </td>
                      <td className="px-4 py-5">
                        <input
                          type="text"
                          value={lot.countedQuantity}
                          onChange={(e) =>
                            updateLot(lot.id, "countedQuantity", e.target.value)
                          }
                          className="w-[120px] h-10 px-3 border border-gray-200 rounded-[8px] outline-none focus:border-[#15BA5C] transition-all text-sm text-center"
                        />
                      </td>
                      <td
                        className={`px-4 py-5 text-sm font-medium ${lot.variance < 0 ? "text-red-500" : lot.variance > 0 ? "text-[#15BA5C]" : "text-gray-600"}`}
                      >
                        {lot.variance > 0 ? `+${lot.variance}` : lot.variance}
                      </td>
                      <td className="px-4 py-5">
                        <input
                          type="text"
                          value={lot.reason}
                          onChange={(e) =>
                            updateLot(lot.id, "reason", e.target.value)
                          }
                          className="w-full min-w-[200px] h-10 px-3 border border-gray-200 rounded-[8px] outline-none focus:border-[#15BA5C] transition-all text-sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Summary Section */}
            <div className="flex items-center justify-between py-6 px-4 border-t border-gray-100">
              <span className="text-[16px] font-bold text-gray-900 uppercase">
                Total Stock
              </span>
              <span className="text-[18px] font-bold text-gray-900 uppercase">
                {selectedItem.totalStock}
              </span>
            </div>

            {/* Action Buttons Footer */}
            <div className="grid grid-cols-2 gap-4 pt-6">
              <button className="h-12 bg-[#15BA5C] text-white font-bold rounded-[8px] hover:bg-[#119E4D] transition-all active:scale-[0.99] cursor-pointer">
                Save Stock Count
              </button>
              <button
                onClick={() => setSelectedItem(null)}
                className="h-12 bg-[#F3F4F6] text-[#4B5563] font-bold rounded-[8px] hover:bg-gray-200 transition-all active:scale-[0.99] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white w-full rounded-[12px] border border-dashed border-gray-200">
            <NotFound
              title="No Inventory Item Selected"
              description="Search for an inventory item to start the stock count process."
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default StockList;
