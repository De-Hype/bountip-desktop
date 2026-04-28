import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  Download,
  AlertCircle,
  CheckCircle,
  FileText,
  X,
  RefreshCw,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { getCurrencySymbolByCountry } from "@/utils/getCurrencySymbol";
import useBusinessStore from "@/stores/useBusinessStore";
import useToastStore from "@/stores/toastStore";

interface ParsedProduct {
  row: number;
  name: string;
  description: string;
  category: string;
  price: number;
  preparationArea: string;
  priceTierId: string[];
  weight: number;
  weightScale: string;
  packagingMethod: string[];
  allergenList: string[];
  isActive: boolean;
  logoUrl: string;
  logoHash: string;
  isValid: boolean;
  errors: string[];
  status?: "success" | "duplicate" | "error";
  isDuplicate?: boolean;
}

interface BulkUploadResult {
  success: number;
  duplicates: number;
  errors: number;
  total: number;
  successfulProducts: ParsedProduct[];
  duplicateProducts: ParsedProduct[];
  errorProducts: ParsedProduct[];
}

interface BulkUploadDataProps {
  isOpen?: boolean;
  storeCode: string;
  onClose?: () => void;
  onUploadSuccess?: () => void;
}

const BulkUploadData: React.FC<BulkUploadDataProps> = ({
  isOpen = true,
  storeCode = "",
  onClose,
  onUploadSuccess,
}) => {
  const outlet = useBusinessStore((state) => state.selectedOutlet);
  const { showToast } = useToastStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState("all");
  const [duplicatesHandled, setDuplicatesHandled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detect duplicates by name (within file and against DB for this outlet)
  const detectDuplicates = async (
    products: ParsedProduct[],
  ): Promise<ParsedProduct[]> => {
    const inFileCounts = new Map<string, number>();
    for (const p of products) {
      const key = p.name.toLowerCase().trim();
      inFileCounts.set(key, (inFileCounts.get(key) || 0) + 1);
    }

    let existingNames = new Set<string>();
    try {
      const api = (window as any).electronAPI;
      if (api?.dbQuery && storeCode) {
        const rows =
          (await api.dbQuery(
            "SELECT LOWER(name) as name FROM product WHERE outletId = ? AND isDeleted = 0",
            [storeCode],
          )) || [];
        existingNames = new Set(
          rows
            .map((r: any) =>
              String(r.name || "")
                .toLowerCase()
                .trim(),
            )
            .filter(Boolean),
        );
      }
    } catch (e) {
      console.error("Failed to load existing product names:", e);
    }

    return products.map((p) => {
      const key = p.name.toLowerCase().trim();
      const fileDup = (inFileCounts.get(key) || 0) > 1;
      const dbDup = existingNames.has(key);
      const isDuplicate = fileDup || dbDup;
      return {
        ...p,
        isDuplicate,
        status: isDuplicate ? "duplicate" : p.status,
      };
    });
  };

  // Shared logic to process raw data rows (from CSV or Excel)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const processRawRows = (rows: any[]): ParsedProduct[] => {
    return rows.map((row, index) => {
      const rowNumber = index + 2; // +2 assuming header is row 1
      const errors: string[] = [];

      // Map columns to product properties
      const name = row.name || row.Name || row.NAME || "";
      const description =
        row.description || row.Description || row.DESCRIPTION || "";
      const category = row.category || row.Category || row.CATEGORY || "";
      const priceStr =
        row.price !== undefined
          ? String(row.price || row.Price || row.PRICE)
          : "";
      const preparationArea =
        row.preparationArea || row.preparationarea || "kitchen";
      const weightStr =
        row.weight !== undefined
          ? String(row.weight || row.Weight || row.WEIGHT)
          : "";
      const weightScale = row.weightScale || row.weightscale || "g";
      const packagingMethodStr =
        row.packagingMethod || row.packagingmethod || "box";
      const allergenListStr = row.allergenList || row.allergenlist || "";
      const isActiveStr = String(
        row.isActive || row.isactive || row.IsActive || "TRUE",
      );

      // Parse numeric values
      const priceNum = parseFloat(priceStr.replace(/[^0-9.]/g, ""));
      const weightNum = parseFloat(weightStr);

      // Parse arrays
      const packagingMethod = packagingMethodStr
        ? packagingMethodStr
            .split(/[;,]/)
            .map((p: any) => (p as string).trim())
            .filter((p: any) => p)
        : ["box"];

      const allergens =
        allergenListStr &&
        allergenListStr.toLowerCase() !== "none" &&
        allergenListStr.trim() !== ""
          ? allergenListStr
              .split(/[;,]/)
              .map((a: any) => (a as string).trim())
              .filter((a: any) => a)
          : [];

      // Parse boolean
      const isActive = ["true", "yes", "1", "active"].includes(
        isActiveStr.toLowerCase().trim(),
      );

      // Validation
      if (!name.trim()) {
        errors.push(`Row ${rowNumber}: Product name is required`);
      }

      if (!priceStr.trim()) {
        errors.push(`Row ${rowNumber}: Price is required`);
      } else if (isNaN(priceNum) || priceNum <= 0) {
        errors.push(
          `Row ${rowNumber}: Price must be a valid positive number (got: "${priceStr}")`,
        );
      }

      if (!category.trim()) {
        errors.push(`Row ${rowNumber}: Category is required`);
      }

      // Weight validation
      if (weightStr && (isNaN(weightNum) || weightNum <= 0)) {
        errors.push(
          `Row ${rowNumber}: Weight must be a valid positive number when provided (got: "${weightStr}")`,
        );
      }

      return {
        row: rowNumber,
        name: name.trim(),
        description: description.trim(),
        category: category.trim(),
        price: isNaN(priceNum) ? 0 : priceNum,
        preparationArea: preparationArea.trim() || "kitchen",
        weight: isNaN(weightNum) ? 0 : weightNum,
        weightScale: weightScale.trim() || "g",
        packagingMethod,
        priceTierId: [],
        allergenList: allergens,
        logoUrl: "",
        logoHash: "",
        isActive,
        isValid: errors.length === 0,
        errors,
        isDuplicate: false,
      };
    });
  };

  // Fixed CSV parsing function
  const parseCSVFile = async (file: File): Promise<ParsedProduct[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        // @ts-ignore
        transformHeader: (header: any) => header.trim(),
        // @ts-ignore
        transform: (value: any) => value.trim(),
        complete: (results: any) => {
          console.log("Parsed Results:", results);

          try {
            const parsedProducts = processRawRows(results.data);

            // Detect duplicates and resolve
            const productsWithDuplicates = detectDuplicates(parsedProducts);
            console.log("Final parsed products:", productsWithDuplicates);
            resolve(productsWithDuplicates);
          } catch (error) {
            console.error("Error processing parsed data:", error);
            reject(new Error("Failed to process CSV data: " + error));
          }
        },
        error: (error: any) => {
          console.error("CSV parsing error:", error);
          reject(new Error("Failed to parse CSV file: " + error));
        },
      });
    });
  };

  // Excel parsing function
  const parseExcelFile = async (file: File): Promise<ParsedProduct[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet);

          console.log("Parsed Excel Results:", jsonData);

          const parsedProducts = processRawRows(jsonData);

          // Detect duplicates and resolve
          const productsWithDuplicates = detectDuplicates(parsedProducts);
          console.log("Final parsed products:", productsWithDuplicates);
          resolve(productsWithDuplicates);
        } catch (error) {
          console.error("Error processing Excel data:", error);
          reject(new Error("Failed to process Excel data: " + error));
        }
      };
      reader.onerror = (error) => {
        console.error("Excel reading error:", error);
        reject(new Error("Failed to read Excel file"));
      };
      reader.readAsArrayBuffer(file);
    });
  };
  // Upload products to backend
  const uploadProducts = async (
    products: ParsedProduct[],
  ): Promise<BulkUploadResult> => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Filter valid products that are not duplicates (unless duplicates have been handled)
      const validProducts = products.filter((p) => p.isValid && !p.isDuplicate);
      const errorProducts = products.filter((p) => !p.isValid);
      const duplicateProducts = products.filter(
        (p) => p.isDuplicate && !duplicatesHandled,
      );

      console.log("Uploading valid products:", validProducts.length);
      console.log("Error products:", errorProducts.length);
      console.log("Duplicate products:", duplicateProducts.length);

      if (validProducts.length === 0) {
        throw new Error("No valid products to upload");
      }

      const productsToUpload = validProducts.map((product) => ({
        isActive: product.isActive ? 1 : 0,
        name: product.name,
        description: product.description,
        category: product.category.toLowerCase().replace(/\s+/g, "-"),
        price: product.price,
        preparationArea: product.preparationArea,
        weight: product.weight,
        weightScale: product.weightScale,
        packagingMethod: product.packagingMethod,
        priceTierId: [],
        allergenList: product.allergenList,
        logoUrl: "",
        logoHash: "",
        leadTime: 15,
      }));

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await (window as any).electronAPI.bulkCreateProducts({
        outletId: storeCode || "",
        data: productsToUpload,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Process the response to categorize results
      const successfulProducts: ParsedProduct[] = [];
      const finalErrorProducts = [...errorProducts];
      const finalDuplicateProducts = duplicatesHandled ? [] : duplicateProducts;

      if (response && response.status) {
        // If bulk upload succeeded, mark all valid products as successful
        validProducts.forEach((product) => {
          successfulProducts.push({ ...product, status: "success" });
        });
      } else {
        // If there were issues, try to parse the error response
        console.error("Bulk upload failed:", response);

        // Move valid products to error category if upload failed
        validProducts.forEach((product) => {
          finalErrorProducts.push({
            ...product,
            status: "error",
            errors: [
              ...product.errors,
              "Upload failed: " + (response?.status || "Unknown error"),
            ],
          });
        });
      }

      const result: BulkUploadResult = {
        success: successfulProducts.length,
        duplicates: finalDuplicateProducts.length,
        errors: finalErrorProducts.length,
        total: products.length,
        successfulProducts,
        duplicateProducts: finalDuplicateProducts,
        errorProducts: finalErrorProducts,
      };

      setUploadResult(result);
      setIsUploading(false);

      return result;
    } catch (error) {
      console.error("Bulk upload failed:", error);
      setIsUploading(false);
      setUploadProgress(0);
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error.data as { message?: string })?.message ||
            "An unexpected error occurred."
          : "An unexpected error occurred.";
      showToast("error", "Upload failed", errorMessage);

      // Mark all products as errors
      const allErrorProducts = products.map((product) => ({
        ...product,
        status: "error" as const,
        errors: [...product.errors, "Upload failed: " + error],
      }));

      const errorResult: BulkUploadResult = {
        success: 0,
        duplicates: 0,
        errors: products.length,
        total: products.length,
        successfulProducts: [],
        duplicateProducts: [],
        errorProducts: allErrorProducts,
      };

      setUploadResult(errorResult);
      throw error;
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setCurrentStep(3);

      try {
        console.log("Starting file upload and parsing...", file.name);
        let products: ParsedProduct[] = [];

        // Check file extension
        const fileName = file.name.toLowerCase();
        if (fileName.endsWith(".csv")) {
          // Parse the CSV file
          products = await parseCSVFile(file);
        } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
          // Parse the Excel file
          products = await parseExcelFile(file);
        } else {
          throw new Error(
            "Unsupported file format. Please upload a CSV or Excel file.",
          );
        }

        const withDupes = await detectDuplicates(products);
        setParsedProducts(withDupes);

        console.log("File parsed successfully, products:", products.length);

        // Reset duplicates handled state
        setDuplicatesHandled(false);
      } catch (error) {
        console.error("File parsing failed:", error);
        alert("File parsing failed: " + error);
        handleReupload();
      }
    }
  };

  const handleStartUpload = async () => {
    if (parsedProducts.length === 0) return;

    // Block upload if there are duplicate names
    const duplicateCount = parsedProducts.filter((p) => p.isDuplicate).length;
    if (duplicateCount > 0) {
      showToast(
        "error",
        "Duplicate products detected",
        "Some product names already exist. Please rename or remove duplicates before uploading.",
      );
      return;
    }

    try {
      console.log("Starting upload process...");
      await uploadProducts(parsedProducts);

      console.log("Upload completed successfully");

      // Call success callback if provided
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error.data as { message?: string })?.message ||
            "An unexpected error occurred."
          : "An unexpected error occurred.";
      showToast("error", "Upload failed", errorMessage);
      console.error("Upload failed:", error);
    }
  };

 const handleMergeDuplicates = async () => {
   const hasDuplicates = parsedProducts.some((p) => p.isDuplicate);
   if (!hasDuplicates) return;

   setParsedProducts((prev) =>
     prev.map((product) =>
       product.isDuplicate ? { ...product, isDuplicate: false } : product,
     ),
   );
   setDuplicatesHandled(true);
 };

 const handleSkipDuplicates = () => {
   const hasDuplicates = parsedProducts.some((p) => p.isDuplicate);
   if (!hasDuplicates) return;

   setParsedProducts((prev) => prev.filter((product) => !product.isDuplicate));
   setDuplicatesHandled(true);
 };

  const handleReupload = () => {
    setUploadedFile(null);
    setParsedProducts([]);
    setUploadResult(null);
    setUploadProgress(0);
    setIsUploading(false);
    setActiveTab("all");
    setDuplicatesHandled(false);
    setCurrentStep(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Reset state when the modal closes so it opens fresh next time
  useEffect(() => {
    if (!isOpen) {
      handleReupload();
    }
  }, [isOpen]);

  const getFilteredData = (): ParsedProduct[] => {
    // If we have upload results, filter based on those
    if (uploadResult) {
      switch (activeTab) {
        case "ok":
          return uploadResult.successfulProducts || [];
        case "error":
          return uploadResult.errorProducts || [];
        case "duplicate":
          return uploadResult.duplicateProducts || [];
        default:
          return [
            ...(uploadResult.successfulProducts || []),
            ...(uploadResult.duplicateProducts || []),
            ...(uploadResult.errorProducts || []),
          ];
      }
    }

    // Otherwise, filter parsed products
    switch (activeTab) {
      case "ok":
        return parsedProducts.filter((p) => p.isValid && !p.isDuplicate);
      case "error":
        return parsedProducts.filter((p) => !p.isValid);
      case "duplicate":
        return parsedProducts.filter((p) => p.isDuplicate);
      default:
        return parsedProducts;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (fileInputRef.current) {
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInputRef.current.files = dt.files;

        // Trigger the upload handler
        const event = {
          target: { files: dt.files },
        } as React.ChangeEvent<HTMLInputElement>;
        await handleFileUpload(event);
      }
    }
  };

  const getStatusBadge = (product: ParsedProduct) => {
    if (!product.isValid || product.status === "error") {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
          Error
        </span>
      );
    }
    if (product.isDuplicate || product.status === "duplicate") {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
          Duplicate
        </span>
      );
    }
    if (product.status === "success") {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
          Success
        </span>
      );
    }
    return (
      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
        Ready
      </span>
    );
  };

  const downloadTemplate = () => {
    const data = [
      {
        name: "Chocolate Muffin",
        description: "Sweet delicious muffin",
        category: "cake",
        price: 2.5,
        preparationArea: "kitchen",
        weight: 150,
        weightScale: "g",
        packagingMethod: "box",
        allergenList: "Milk,Gluten",
        isActive: "TRUE",
      },
      {
        name: "Coffee Latte",
        description: "Hot coffee with steamed milk",
        category: "beverage",
        price: 3.2,
        preparationArea: "bar",
        weight: 330,
        weightScale: "g",
        packagingMethod: "cup",
        allergenList: "Milk",
        isActive: "TRUE",
      },
      {
        name: "Green Salad",
        description: "Fresh mixed vegetables",
        category: "salad",
        price: 4.5,
        preparationArea: "kitchen",
        weight: 200,
        weightScale: "g",
        packagingMethod: "container",
        allergenList: "",
        isActive: "FALSE",
      },
    ];

    const headers = [
      "name",
      "description",
      "category",
      "price",
      "preparationArea",
      "weight",
      "weightScale",
      "packagingMethod",
      "allergenList",
      "isActive",
    ];

    const ws = XLSX.utils.json_to_sheet(data, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, "product_upload_template.xlsx");
  };

  const handleRowClick = (item: ParsedProduct, index: number) => {
    console.log("Clicked row:", item, "at index:", index);
  };

  // Count duplicates and other stats
  const duplicateCount = parsedProducts.filter((p) => p.isDuplicate).length;
  const validCount = parsedProducts.filter(
    (p) => p.isValid && !p.isDuplicate,
  ).length;
  const errorCount = parsedProducts.filter((p) => !p.isValid).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <>
          <div className="h-2 bg-green-500 rounded-t-lg "></div>
          <div className="p-4"></div>
        </>
        {/* Header */}
        <div className="text-white p-4 pt-0 rounded-t-lg flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-black">
              Bulk Upload Data
            </h2>
            <p className="text-green-600">Upload your data through CSV file.</p>
          </div>
          <button
            onClick={() => {
              if (onClose) onClose();
            }}
            className="text-black hover:bg-gray-100 rounded-full p-1"
            title="Close"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Steps Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
            {/* Step 1 */}
            <div className="flex items-start mb-6">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center mr-4">
                <CheckCircle size={16} />
              </div>
              <div className="flex-grow">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-green-500 font-medium text-sm">Step 1</p>
                    <h3 className="font-semibold text-lg">
                      Download our Product List Template
                    </h3>
                    <p className="text-gray-600 text-sm">
                      The template contains headers for each field required for
                      bulk upload
                    </p>
                  </div>
                  <button
                    onClick={downloadTemplate}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
                  >
                    <Download size={16} />
                    Download Excel Template
                  </button>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start mb-6">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center mr-4">
                <CheckCircle size={16} />
              </div>
              <div className="flex-grow">
                <p className="text-green-500 font-medium text-sm">Step 2</p>
                <h3 className="font-semibold text-lg mb-2">
                  Prepare your Product data
                </h3>
                <p className="text-gray-600 text-sm">
                  Fill in the product upload template with details for each
                  product item. Use commas (,) to separate multiple allergens.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start mb-0">
              <div
                className={`flex-shrink-0 w-8 h-8 ${
                  currentStep >= 3 ? "bg-green-500" : "bg-gray-300"
                } text-white rounded-full flex items-center justify-center mr-4`}
              >
                <CheckCircle size={16} />
              </div>
              <div className="flex-grow">
                <p className="text-green-500 font-medium text-sm">Step 3</p>
                <h3 className="font-semibold text-lg mb-4">
                  Upload the completed template file
                </h3>

                {!uploadedFile && !isUploading && (
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors cursor-pointer"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="flex justify-center items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <FileText className="text-green-500" size={24} />
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Upload className="text-green-500" size={24} />
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="text-green-500" size={24} />
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Upload size={20} />
                      <span className="font-medium">
                        Drag or Click to upload a file
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm">
                      CSV and Excel files are supported
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv, .xlsx, .xls"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                )}

                {/* Upload Progress */}
                {isUploading && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="text-green-500" size={20} />
                        <span className="font-medium">
                          {uploadedFile?.name || "Product_list.csv"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{uploadProgress}%</span>
                        <button
                          onClick={handleReupload}
                          className="text-red-500 hover:bg-red-50 px-2 py-1 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-gray-600 text-sm mt-1">
                      Uploading data from file
                    </p>
                  </div>
                )}

                {/* Uploaded File */}
                {uploadedFile && !isUploading && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="text-green-500" size={20} />
                        <span className="font-medium">{uploadedFile.name}</span>
                        <span className="text-green-600 text-sm">
                          {uploadResult
                            ? "Upload Complete"
                            : "File Parsed Successfully"}
                        </span>
                      </div>
                      <button
                        onClick={handleReupload}
                        className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 flex items-center gap-1"
                      >
                        <RefreshCw size={14} />
                        Reupload
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Parsed Data Review or Upload Results */}
          {(parsedProducts.length > 0 || uploadResult) && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">
                  {uploadResult ? "Upload Results" : "Review Parsed Data"}
                </h3>
                {parsedProducts.length > 0 && !uploadResult && (
                  <button
                    onClick={handleStartUpload}
                    disabled={isUploading || validCount === 0}
                    className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        Upload {validCount} Valid Products
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Status Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <CheckCircle className="text-green-500" size={20} />
                    <span className="text-2xl font-bold">
                      {uploadResult ? uploadResult.success : validCount}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {uploadResult
                      ? "Successfully uploaded"
                      : "Valid products ready"}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <AlertCircle className="text-yellow-500" size={20} />
                    <span className="text-2xl font-bold">
                      {uploadResult ? uploadResult.duplicates : duplicateCount}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {uploadResult
                      ? "Duplicate entries"
                      : "Duplicate entries found"}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <AlertCircle className="text-red-500" size={20} />
                    <span className="text-2xl font-bold">
                      {uploadResult ? uploadResult.errors : errorCount}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {uploadResult ? "Errors found" : "Products with errors"}
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b mb-4">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-4 py-2 border-b-2 font-medium ${
                    activeTab === "all"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-gray-800"
                  }`}
                >
                  All (
                  {uploadResult ? uploadResult.total : parsedProducts.length})
                </button>
                <button
                  onClick={() => setActiveTab("ok")}
                  className={`px-4 py-2 border-b-2 font-medium ${
                    activeTab === "ok"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-gray-800"
                  }`}
                >
                  {uploadResult ? "Success" : "Valid"} (
                  {uploadResult ? uploadResult.success : validCount})
                </button>
                <button
                  onClick={() => setActiveTab("duplicate")}
                  className={`px-4 py-2 border-b-2 font-medium ${
                    activeTab === "duplicate"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Duplicate (
                  {uploadResult ? uploadResult.duplicates : duplicateCount})
                </button>
                <button
                  onClick={() => setActiveTab("error")}
                  className={`px-4 py-2 border-b-2 font-medium ${
                    activeTab === "error"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Error ({uploadResult ? uploadResult.errors : errorCount})
                </button>
              </div>

              {/* Data Table using standard Table component */}
              <div className="rounded-md border mb-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Allergens</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Errors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredData().map((item, index) => (
                      <TableRow
                        key={index}
                        onClick={() => handleRowClick(item, index)}
                        className="cursor-pointer hover:bg-gray-50"
                      >
                        <TableCell className="text-sm">{item.row}</TableCell>
                        <TableCell>
                          <span
                            className={`font-medium text-sm ${
                              !item.isValid || item.isDuplicate
                                ? "text-red-600"
                                : ""
                            }`}
                          >
                            {item.name}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-sm ${
                              !item.isValid || item.isDuplicate
                                ? "text-red-600"
                                : ""
                            }`}
                          >
                            {item.description}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-sm ${
                              !item.isValid || item.isDuplicate
                                ? "text-red-600"
                                : ""
                            }`}
                          >
                            {getCurrencySymbolByCountry(
                              outlet?.country as string,
                            )}{" "}
                            {Number(item.price).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-sm ${
                              !item.isValid || item.isDuplicate
                                ? "text-red-600"
                                : ""
                            }`}
                          >
                            {item.category}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-sm ${
                              !item.isValid || item.isDuplicate
                                ? "text-red-600"
                                : ""
                            }`}
                          >
                            {item.weight > 0
                              ? `${item.weight} ${item.weightScale}`
                              : "N/A"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-sm ${
                              item.isActive ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {item.isActive ? "Yes" : "No"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {item.allergenList &&
                            item.allergenList.length > 0 ? (
                              item.allergenList.map((allergen, i) => (
                                <span
                                  key={i}
                                  className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                                >
                                  {allergen}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-gray-500">
                                None
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(item)}</TableCell>
                        <TableCell>
                          <div className="text-red-500 text-xs">
                            {item.errors && item.errors.length > 0
                              ? item.errors.join(", ")
                              : ""}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Action Buttons for Duplicates - Show before upload */}
              {parsedProducts.length > 0 &&
                duplicateCount > 0 &&
                !duplicatesHandled &&
                !uploadResult && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="text-yellow-600" size={20} />
                      <h4 className="font-medium text-yellow-800">
                        {duplicateCount} duplicate product
                        {duplicateCount > 1 ? "s" : ""} found
                      </h4>
                    </div>
                    <p className="text-yellow-700 text-sm mb-4">
                      Please choose how to handle the duplicate entries before
                      proceeding with the upload.
                    </p>
                    <div className="flex gap-3">
                      {/* <button
                        onClick={handleMergeDuplicates}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 font-medium"
                      >
                        Merge Duplicate Entries
                      </button> */}
                      <button
                        onClick={handleSkipDuplicates}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 font-medium"
                      >
                        Skip Duplicates
                      </button>
                    </div>
                  </div>
                )}

              {/* Success message after handling duplicates */}
              {duplicatesHandled && !uploadResult && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-700 font-medium">
                    Duplicates handled! You can now proceed with the upload.
                  </p>
                </div>
              )}

              {/* Final success message after upload */}
              {uploadResult && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 font-medium">
                    Upload process completed! {uploadResult.success} product
                    {uploadResult.success !== 1 ? "s" : ""} uploaded
                    successfully.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkUploadData;
