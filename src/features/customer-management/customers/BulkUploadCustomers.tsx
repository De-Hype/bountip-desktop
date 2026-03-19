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
import useBusinessStore from "@/stores/useBusinessStore";
import useToastStore from "@/stores/toastStore";

interface ParsedCustomer {
  row: number;
  name: string;
  email: string;
  phoneNumber: string;
  customerType: string;
  status: string;
  organizationName: string;
  paymentTermId: string;
  isValid: boolean;
  errors: string[];
  status_upload?: "success" | "duplicate" | "error";
  isDuplicate?: boolean;
}

interface BulkUploadResult {
  success: number;
  duplicates: number;
  errors: number;
  total: number;
  successfulCustomers: ParsedCustomer[];
  duplicateCustomers: ParsedCustomer[];
  errorCustomers: ParsedCustomer[];
}

interface BulkUploadCustomersProps {
  isOpen?: boolean;
  onClose?: () => void;
  onUploadSuccess?: () => void;
}

const BulkUploadCustomers: React.FC<BulkUploadCustomersProps> = ({
  isOpen = true,
  onClose,
  onUploadSuccess,
}) => {
  const selectedOutlet = useBusinessStore((state) => state.selectedOutlet);
  const { showToast } = useToastStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedCustomers, setParsedCustomers] = useState<ParsedCustomer[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState("all");
  const [duplicatesHandled, setDuplicatesHandled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to detect duplicates by email or phone
  const detectDuplicates = async (
    customers: ParsedCustomer[],
  ): Promise<ParsedCustomer[]> => {
    const emails = new Set<string>();
    const phones = new Set<string>();
    const duplicateRows = new Set<number>();
    const existingDuplicates = new Set<number>();

    // 1. Detect duplicates within the uploaded file
    customers.forEach((customer) => {
      const email = customer.email.toLowerCase().trim();
      const phone = customer.phoneNumber.trim();

      if (email && emails.has(email)) {
        duplicateRows.add(customer.row);
      } else if (email) {
        emails.add(email);
      }

      if (phone && phones.has(phone)) {
        duplicateRows.add(customer.row);
      } else if (phone) {
        phones.add(phone);
      }
    });

    // 2. Detect duplicates against the system database
    const api = (window as any).electronAPI;
    if (api && api.dbQuery && selectedOutlet?.id) {
      try {
        const emailList = Array.from(emails).filter(Boolean);
        const phoneList = Array.from(phones).filter(Boolean);

        if (emailList.length > 0 || phoneList.length > 0) {
          const emailPlaceholders = emailList.map(() => "?").join(",");
          const phonePlaceholders = phoneList.map(() => "?").join(",");

          let query = `SELECT email, phoneNumber FROM customers WHERE outletId = ? AND (`;
          const queryParts = [];
          const params = [selectedOutlet.id];

          if (emailList.length > 0) {
            queryParts.push(`email IN (${emailPlaceholders})`);
            params.push(...emailList);
          }

          if (phoneList.length > 0) {
            queryParts.push(`phoneNumber IN (${phonePlaceholders})`);
            params.push(...phoneList);
          }

          query += queryParts.join(" OR ") + ")";

          const existingRecords = await api.dbQuery(query, params);

          if (existingRecords && existingRecords.length > 0) {
            const existingEmails = new Set(
              existingRecords
                .map((r: any) => r.email?.toLowerCase().trim())
                .filter(Boolean),
            );
            const existingPhones = new Set(
              existingRecords
                .map((r: any) => r.phoneNumber?.trim())
                .filter(Boolean),
            );

            customers.forEach((customer) => {
              const email = customer.email.toLowerCase().trim();
              const phone = customer.phoneNumber.trim();

              if (
                (email && existingEmails.has(email)) ||
                (phone && existingPhones.has(phone))
              ) {
                existingDuplicates.add(customer.row);
              }
            });
          }
        }
      } catch (error) {
        console.error("Failed to check for existing customers:", error);
      }
    }

    return customers.map((customer) => {
      const isFileDuplicate = duplicateRows.has(customer.row);
      const isSystemDuplicate = existingDuplicates.has(customer.row);
      const isDuplicate = isFileDuplicate || isSystemDuplicate;

      const newErrors = [...customer.errors];
      if (isSystemDuplicate) {
        newErrors.push(
          "Customer with this email or phone number already exists in the system",
        );
      } else if (isFileDuplicate) {
        newErrors.push("Duplicate entry found within the file");
      }

      return {
        ...customer,
        isDuplicate,
        isValid: customer.isValid && !isSystemDuplicate, // System duplicates are strictly invalid
        errors: newErrors,
        status_upload: isDuplicate ? "duplicate" : undefined,
      };
    });
  };

  const processRawRows = (rows: any[]): ParsedCustomer[] => {
    return rows.map((row, index) => {
      const rowNumber = index + 2;
      const errors: string[] = [];

      const name = row.name || row.Name || "";
      const email = row.email || row.Email || "";
      const phoneNumber = row.phoneNumber || row.PhoneNumber || row.Phone || "";
      const customerType = (
        row.customerType ||
        row.Type ||
        "individual"
      ).toLowerCase();
      const status = (row.status || row.Status || "active").toLowerCase();
      const organizationName = row.organizationName || row.Organization || "";
      const paymentTermId = row.paymentTermId || row.PaymentTerm || "";

      if (!name.trim()) {
        errors.push(`Row \${rowNumber}: Name is required`);
      }
      if (!email.trim() && !phoneNumber.trim()) {
        errors.push(
          `Row \${rowNumber}: Either Email or Phone Number is required`,
        );
      }
      if (!["individual", "organization"].includes(customerType)) {
        errors.push(
          `Row \${rowNumber}: Type must be 'individual' or 'organization'`,
        );
      }

      return {
        row: rowNumber,
        name: name.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        customerType,
        status,
        organizationName: organizationName.trim(),
        paymentTermId: paymentTermId.trim(),
        isValid: errors.length === 0,
        errors,
      };
    });
  };

  const parseCSVFile = async (file: File): Promise<ParsedCustomer[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results: any) => {
          try {
            const parsed = processRawRows(results.data);
            resolve(await detectDuplicates(parsed));
          } catch (error) {
            reject(error);
          }
        },
        error: reject,
      });
    });
  };

  const parseExcelFile = async (file: File): Promise<ParsedCustomer[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          const parsed = processRawRows(jsonData);
          resolve(await detectDuplicates(parsed));
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsUploading(true);
    setUploadProgress(20);

    try {
      let parsed: ParsedCustomer[] = [];
      if (file.name.endsWith(".csv")) {
        parsed = await parseCSVFile(file);
      } else {
        parsed = await parseExcelFile(file);
      }

      setParsedCustomers(parsed);
      setUploadProgress(100);
      setCurrentStep(3);
    } catch (error) {
      showToast("error", "Parsing failed", "Could not read the file.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleStartUpload = async () => {
    if (!selectedOutlet) return;

    setIsUploading(true);
    setUploadProgress(0);

    const validCustomers = parsedCustomers.filter(
      (c) => c.isValid && (!c.isDuplicate || duplicatesHandled),
    );

    if (validCustomers.length === 0) {
      showToast(
        "error",
        "No valid customers",
        "Please fix errors before uploading.",
      );
      setIsUploading(false);
      return;
    }

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await (window as any).electronAPI.bulkCreateCustomers({
        outletId: selectedOutlet.id,
        data: validCustomers.map((c) => ({
          name: c.name,
          email: c.email,
          phoneNumber: c.phoneNumber,
          customerType: c.customerType,
          status: c.status,
          organizationName: c.organizationName,
          paymentTermId: c.paymentTermId,
        })),
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const successfulCustomers: ParsedCustomer[] = [];
      validCustomers.forEach((c) =>
        successfulCustomers.push({ ...c, status_upload: "success" }),
      );

      const result: BulkUploadResult = {
        success: successfulCustomers.length,
        duplicates: parsedCustomers.filter(
          (c) => c.isDuplicate && !duplicatesHandled,
        ).length,
        errors: parsedCustomers.filter((c) => !c.isValid).length,
        total: parsedCustomers.length,
        successfulCustomers,
        duplicateCustomers: parsedCustomers.filter(
          (c) => c.isDuplicate && !duplicatesHandled,
        ),
        errorCustomers: parsedCustomers.filter((c) => !c.isValid),
      };

      setUploadResult(result);
      if (onUploadSuccess) onUploadSuccess();
      showToast(
        "success",
        "Bulk Upload Complete",
        `Successfully uploaded ${validCustomers.length} customers.`,
      );
    } catch (error) {
      showToast(
        "error",
        "Upload Failed",
        "Something went wrong during bulk upload.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const data = [
      {
        name: "John Doe",
        email: "john@example.com",
        phoneNumber: "+2348012345678",
        customerType: "individual",
        status: "active",
        organizationName: "",
        paymentTermId: "Default Term",
      },
      {
        name: "Acme Corp",
        email: "billing@acme.com",
        phoneNumber: "+2348098765432",
        customerType: "organization",
        status: "active",
        organizationName: "Acme Corporation",
        paymentTermId: "Net 30",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    XLSX.writeFile(wb, "customer_upload_template.xlsx");
  };

  const handleReupload = () => {
    setUploadedFile(null);
    setParsedCustomers([]);
    setUploadResult(null);
    setUploadProgress(0);
    setIsUploading(false);
    setActiveTab("all");
    setDuplicatesHandled(false);
    setCurrentStep(1);
  };

  // Reset state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      handleReupload();
    }
  }, [isOpen]);

  const getFilteredData = () => {
    if (uploadResult) {
      if (activeTab === "ok") return uploadResult.successfulCustomers;
      if (activeTab === "duplicate") return uploadResult.duplicateCustomers;
      if (activeTab === "error") return uploadResult.errorCustomers;
      return [
        ...uploadResult.successfulCustomers,
        ...uploadResult.duplicateCustomers,
        ...uploadResult.errorCustomers,
      ].sort((a, b) => a.row - b.row);
    }

    if (activeTab === "ok")
      return parsedCustomers.filter((c) => c.isValid && !c.isDuplicate);
    if (activeTab === "duplicate")
      return parsedCustomers.filter((c) => c.isDuplicate);
    if (activeTab === "error") return parsedCustomers.filter((c) => !c.isValid);
    return parsedCustomers;
  };

  const getStatusBadge = (customer: ParsedCustomer) => {
    if (customer.status_upload === "success") {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
          Success
        </span>
      );
    }
    if (customer.isDuplicate && !duplicatesHandled) {
      return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
          Duplicate
        </span>
      );
    }
    if (!customer.isValid) {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
          Error
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
        Ready
      </span>
    );
  };

  const handleMergeDuplicates = () => setDuplicatesHandled(true);
  const handleSkipDuplicates = () => setDuplicatesHandled(true);

  if (!isOpen) return null;

  const validCount = parsedCustomers.filter(
    (c) => c.isValid && !c.isDuplicate,
  ).length;
  const duplicateCount = parsedCustomers.filter((c) => c.isDuplicate).length;
  const errorCount = parsedCustomers.filter((c) => !c.isValid).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="h-2 bg-green-500 rounded-t-lg"></div>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-black">
                Bulk Upload Customers
              </h2>
              <p className="text-green-600 text-sm">
                Upload your customer list through CSV or Excel file.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-black hover:bg-gray-100 rounded-full p-1"
            >
              <X size={24} />
            </button>
          </div>

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
                    <h3 className="font-semibold text-lg text-black">
                      Download our Customer List Template
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
                    <Download size={16} /> Download Template
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
                <h3 className="font-semibold text-lg mb-2 text-black">
                  Prepare your Customer data
                </h3>
                <p className="text-gray-600 text-sm">
                  Fill in the template with details for each customer. Ensure
                  email or phone number is unique.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start mb-0">
              <div
                className={`flex-shrink-0 w-8 h-8 \${currentStep >= 3 ? "bg-green-500" : "bg-gray-300"} text-white rounded-full flex items-center justify-center mr-4`}
              >
                <CheckCircle size={16} />
              </div>
              <div className="flex-grow">
                <p className="text-green-500 font-medium text-sm">Step 3</p>
                <h3 className="font-semibold text-lg mb-4 text-black">
                  Upload the completed template file
                </h3>

                {!uploadedFile && !isUploading && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-green-200 rounded-xl p-10 flex flex-col items-center justify-center bg-green-50/30 hover:bg-green-50 transition-colors cursor-pointer"
                  >
                    <Upload className="h-10 w-10 text-green-500 mb-4" />
                    <p className="text-green-700 font-medium">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      CSV, XLSX or XLS (max. 10MB)
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

                {isUploading && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="text-green-500" size={20} />
                        <span className="font-medium text-black">
                          {uploadedFile?.name || "Customer_list.csv"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-black">
                          {uploadProgress}%
                        </span>
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
                        style={{ width: `\${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {uploadedFile && !isUploading && !uploadResult && (
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <FileText className="text-green-600" />
                      <div>
                        <p className="text-green-900 font-medium">
                          {uploadedFile.name}
                        </p>
                        <p className="text-green-600 text-xs">
                          {(uploadedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleReupload}
                      className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 flex items-center gap-1"
                    >
                      <RefreshCw size={14} /> Reupload
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {(parsedCustomers.length > 0 || uploadResult) && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-black">
                  {uploadResult ? "Upload Results" : "Review Parsed Data"}
                </h3>
                {parsedCustomers.length > 0 && !uploadResult && (
                  <button
                    onClick={handleStartUpload}
                    disabled={isUploading || validCount === 0}
                    className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 font-medium disabled:opacity-50 flex items-center gap-2"
                  >
                    {isUploading ? (
                      <RefreshCw className="animate-spin" size={16} />
                    ) : (
                      <Upload size={16} />
                    )}
                    Upload {validCount} Valid Customers
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <CheckCircle className="text-green-500" size={20} />
                    <span className="text-2xl font-bold text-black">
                      {uploadResult ? uploadResult.success : validCount}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {uploadResult
                      ? "Successfully uploaded"
                      : "Valid customers ready"}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <AlertCircle className="text-yellow-500" size={20} />
                    <span className="text-2xl font-bold text-black">
                      {uploadResult ? uploadResult.duplicates : duplicateCount}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {uploadResult ? "Duplicate entries" : "Duplicates found"}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <AlertCircle className="text-red-500" size={20} />
                    <span className="text-2xl font-bold text-black">
                      {uploadResult ? uploadResult.errors : errorCount}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {uploadResult ? "Errors found" : "Errors in data"}
                  </p>
                </div>
              </div>

              <div className="flex border-b mb-4">
                {["all", "ok", "duplicate", "error"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 border-b-2 font-medium capitalize \${activeTab === tab ? "border-green-500 text-green-600" : "border-transparent text-gray-600 hover:text-gray-800"}`}
                  >
                    {tab} (
                    {tab === "all"
                      ? uploadResult
                        ? uploadResult.total
                        : parsedCustomers.length
                      : tab === "ok"
                        ? uploadResult
                          ? uploadResult.success
                          : validCount
                        : tab === "duplicate"
                          ? uploadResult
                            ? uploadResult.duplicates
                            : duplicateCount
                          : uploadResult
                            ? uploadResult.errors
                            : errorCount}
                    )
                  </button>
                ))}
              </div>

              <div className="rounded-md border mb-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Upload Status</TableHead>
                      <TableHead>Errors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredData().map((item, index) => (
                      <TableRow key={index} className="hover:bg-gray-50">
                        <TableCell className="text-sm text-black">
                          {item.row}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-black">
                          {item.name}
                        </TableCell>
                        <TableCell className="text-sm text-black">
                          {item.email}
                        </TableCell>
                        <TableCell className="text-sm text-black">
                          {item.phoneNumber}
                        </TableCell>
                        <TableCell className="text-sm capitalize text-black">
                          {item.customerType}
                        </TableCell>
                        <TableCell className="text-sm capitalize text-black">
                          {item.status}
                        </TableCell>
                        <TableCell>{getStatusBadge(item)}</TableCell>
                        <TableCell className="text-red-500 text-xs">
                          {item.errors?.join(", ")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {parsedCustomers.length > 0 &&
                duplicateCount > 0 &&
                !duplicatesHandled &&
                !uploadResult && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="text-yellow-600" size={20} />
                      <h4 className="font-medium text-yellow-800">
                        {duplicateCount} duplicate customer
                        {duplicateCount > 1 ? "s" : ""} found
                      </h4>
                    </div>
                    <p className="text-yellow-700 text-sm mb-4">
                      How would you like to handle these duplicates?
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleMergeDuplicates}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 font-medium"
                      >
                        Merge/Update Existing
                      </button>
                      <button
                        onClick={handleSkipDuplicates}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 font-medium"
                      >
                        Skip Duplicates
                      </button>
                    </div>
                  </div>
                )}

              {uploadResult && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 font-medium">
                    Upload completed! {uploadResult.success} customers imported
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

export default BulkUploadCustomers;
