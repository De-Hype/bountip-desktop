import React, { useState } from "react";
import { X, Copy, Search, Trash2 } from "lucide-react";
import ImageHandler from "@/shared/Image/ImageHandler";

interface CreateComponentProps {
  onClose?: () => void;
}

const CreateComponent = ({ onClose }: CreateComponentProps) => {
  const [formData, setFormData] = useState({
    name: "",
    id: "C002",
    description: "",
    steps: "",
    searchItem: "",
    imageUrl: "",
  });

  const [selectedItems, setSelectedItems] = useState([
    {
      id: 1,
      name: "Milk",
      quantity: 20,
      cost: 0.02,
      waste: 10,
      critical: true,
      required: false,
      total: 0.03,
    },
    {
      id: 2,
      name: "Sugar",
      quantity: 4,
      cost: 0.02,
      waste: 5,
      critical: false,
      required: true,
      total: 0.03,
    },
    {
      id: 3,
      name: "Flour",
      quantity: 3,
      cost: 0.02,
      waste: 2,
      critical: false,
      required: true,
      total: 0.03,
    },
  ]);

  const handleToggle = (id: number, field: "critical" | "required") => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: !item[field] } : item,
      ),
    );
  };

  const removeItem = (id: number) => {
    setSelectedItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      {/* Modal Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
        <h2 className="text-xl font-bold text-gray-900">Create a Component</h2>
        <button
          onClick={onClose}
          className="p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors cursor-pointer"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar bg-white">
        {/* Top Fields */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Component Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter Component name"
              className="w-full h-11 px-4 bg-[#F9FAFB] border border-gray-200 rounded-lg outline-none focus:border-[#15BA5C] transition-all text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Component ID<span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.id}
                readOnly
                className="w-full h-11 px-4 bg-[#F1F3F5] border border-gray-200 rounded-lg outline-none text-sm text-gray-600"
              />
              <Copy className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 cursor-pointer hover:text-gray-600" />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            Component Description
          </label>
          <textarea
            placeholder="Enter description"
            className="w-full h-24 p-4 bg-white border border-gray-200 rounded-lg outline-none focus:border-[#15BA5C] transition-all text-sm resize-none"
          />
        </div>

        {/* Steps */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            Steps to Create this component
          </label>
          <textarea
            placeholder="Describe the process of making this mix"
            className="w-full h-24 p-4 bg-white border border-gray-200 rounded-lg outline-none focus:border-[#15BA5C] transition-all text-sm resize-none"
          />
        </div>

        {/* Search Items */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            Search Items to use
          </label>
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Search for an Item"
              className="flex-1 h-11 px-4 bg-white border border-gray-200 rounded-l-lg outline-none focus:border-[#15BA5C] transition-all text-sm"
            />
            <button className="h-11 px-4 bg-[#15BA5C] text-white rounded-r-lg hover:bg-[#119E4D] transition-colors">
              <Search className="size-5" />
            </button>
          </div>
        </div>

        {/* Selected Items Table */}
        <div className="overflow-x-auto border border-gray-100 rounded-lg custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-[#F9FAFB]">
              <tr>
                <th className="px-3 py-3 text-[10px] font-bold text-gray-500 uppercase whitespace-nowrap">
                  Item
                </th>
                <th className="px-3 py-3 text-[10px] font-bold text-gray-500 uppercase whitespace-nowrap">
                  Quantity
                </th>
                <th className="px-3 py-3 text-[10px] font-bold text-gray-500 uppercase text-center whitespace-nowrap">
                  Cost Per Unit Item
                </th>
                <th className="px-3 py-3 text-[10px] font-bold text-gray-500 uppercase text-center whitespace-nowrap">
                  Adjust waste (%)
                </th>
                <th className="px-3 py-3 text-[10px] font-bold text-gray-500 uppercase text-center whitespace-nowrap">
                  Critical
                </th>
                <th className="px-3 py-3 text-[10px] font-bold text-gray-500 uppercase text-center whitespace-nowrap">
                  Required
                </th>
                <th className="px-3 py-3 text-[10px] font-bold text-gray-500 uppercase text-center whitespace-nowrap">
                  total cost per item
                </th>
                <th className="px-3 py-3 text-[10px] font-bold text-gray-500 uppercase text-center whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {selectedItems.length > 0 ? (
                selectedItems.map((item) => (
                  <tr key={item.id} className="text-sm text-gray-700">
                    <td className="px-3 py-3 font-medium whitespace-nowrap">
                      {item.name}
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={item.quantity}
                        className="w-16 h-8 px-2 border border-gray-200 rounded-lg outline-none text-center text-xs"
                      />
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      £{item.cost}
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={item.waste}
                        className="w-16 h-8 px-2 mx-auto block border border-gray-200 rounded-lg outline-none text-center text-xs"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div
                        onClick={() => handleToggle(item.id, "critical")}
                        className={`w-8 h-4 mx-auto rounded-full relative cursor-pointer transition-colors ${item.critical ? "bg-[#15BA5C]" : "bg-gray-200"}`}
                      >
                        <div
                          className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${item.critical ? "right-0.5" : "left-0.5"}`}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div
                        onClick={() => handleToggle(item.id, "required")}
                        className={`w-8 h-4 mx-auto rounded-full relative cursor-pointer transition-colors ${item.required ? "bg-[#15BA5C]" : "bg-gray-200"}`}
                      >
                        <div
                          className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${item.required ? "right-0.5" : "left-0.5"}`}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center font-medium whitespace-nowrap">
                      £{item.total}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors mx-auto block"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12">
                    <div className="flex flex-col items-center justify-center text-center space-y-2">
                      <div className="p-3 bg-gray-50 rounded-full">
                        <Search className="size-6 text-gray-300" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          No items added
                        </p>
                        <p className="text-xs text-gray-500">
                          Search for items above to add them to this component
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Total Cost */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#F9FAFB] rounded-lg border border-gray-100">
          <span className="font-semibold text-gray-900">Total Cost</span>
          <div className="bg-[#E9ECEF] px-8 py-2 rounded-lg font-bold text-gray-900">
            £100
          </div>
        </div>

        {/* Upload Section */}
        <div className="space-y-3">
          
          <ImageHandler
            value={formData.imageUrl}
            onChange={({ url }) => setFormData({ ...formData, imageUrl: url })}
            label="Upload Media"
            className="w-full"
          />
        </div>

        {/* Submit Button */}
        <button className="w-full h-12 bg-[#15BA5C] text-white font-bold rounded-lg hover:bg-[#119E4D] transition-all active:scale-[0.99] cursor-pointer">
          Create Component
        </button>
      </div>
    </div>
  );
};

export default CreateComponent;
