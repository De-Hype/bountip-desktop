import React, { useEffect, useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import SettingFiles from "@/assets/icons/settings";
import { Switch } from "../ui/Switch";
import { Dropdown } from "../ui/Dropdown";
import { Loader2 } from "lucide-react";
import useToastStore from "@/stores/toastStore";
import { useBusinessStore } from "@/stores/useBusinessStore";
import InvoiceBrandingPreview from "../Previews/InvoiceBrandingPreview";

const fontOptions = [
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Arial", label: "Arial" },
  { value: "Helvetica", label: "Helvetica" },
  { value: "Courier New", label: "Courier New" },
];

const paperSizeOptions = [
  { value: "A4", label: "A4" },
  { value: "80mm", label: "80mm" },
];

const columnOptions = [
  { value: "orderName", label: "Order Name" },
  { value: "sku", label: "SKU" },
  { value: "qty", label: "Quantity" },
  { value: "subTotal", label: "Subtotal" },
  { value: "total", label: "Total" },
];

interface InvoiceSettings {
  showBakeryName: boolean;
  fontSize: string;
  paperSize: string;
  showPaymentSuccess: boolean;
  showBusinessLine: boolean;
  customBusinessText: string;
  showInvoiceNumber: boolean;
  showInvoiceIssueDate: boolean;
  showInvoiceDueDate: boolean;
  showClientName: boolean;
  showClientAddress: boolean;
  showModifierBelowItems: boolean;
  selectedColumns: {
    orderName: boolean;
    sku: boolean;
    qty: boolean;
    subTotal: boolean;
    total: boolean;
  };
  showDiscountLine: boolean;
  showTax: boolean;
  showDeliveryFee: boolean;
  showPaymentStatus: boolean;
  showPaymentMethod: boolean;
  showRemoveTaxOnOrderReceipt: boolean;
  showRemoveTaxOnPaymentReceipt: boolean;
  showActivateAccountDetails: boolean;
  showActivateEmail: boolean;
  showActivateAddress: boolean;
  customMessage: string;
}

interface InvoiceSettingsDto {
  customizedLogoUrl: string | undefined;
  fontStyle: "Times New Roman" | "Arial" | "Helvetica" | "Courier New";
  showBakeryName: boolean;
  paperSize: "A4" | "80mm" | undefined;
  showPaymentSuccessText: boolean;
  customizedPaymentSuccessText: string | undefined;
  showTotalPaidAtTop: boolean;
  showInvoiceNumber: boolean;
  showInvoiceIssueDate: boolean;
  showInvoiceDueDate: boolean;
  showInvoiceClientName: boolean;
  showInvoiceClientAddress: boolean;
  showModifierBelowItems: boolean;
  selectedColumns: {
    orderName: boolean;
    sku: boolean;
    qty: boolean;
    subTotal: boolean;
    total: boolean;
  };
  showDiscountLine: boolean;
  showTax: boolean;
  showShippingFee: boolean;
  showPaymentStatus: boolean;
  showPaymentMethod: boolean;
  showTaxOnOrderReceipt: boolean;
  showTaxOnPaymentReceipt: boolean;
  showAccountDetails: boolean;
  showEmail: boolean;
  showAddress: boolean;
  customThankYouMessage: string | undefined;
  showLogo: boolean;
}

interface InvoiceCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const defaultFormData: InvoiceSettings = {
  showBakeryName: true,
  fontSize: "Times New Roman",
  paperSize: "A4",
  showPaymentSuccess: false,
  showBusinessLine: false,
  customBusinessText: "",
  showInvoiceNumber: true,
  showInvoiceIssueDate: true,
  showInvoiceDueDate: true,
  showClientName: true,
  showClientAddress: true,
  showModifierBelowItems: true,
  selectedColumns: {
    orderName: true,
    sku: false,
    qty: true,
    subTotal: false,
    total: true,
  },
  showDiscountLine: false,
  showTax: false,
  showDeliveryFee: false,
  showPaymentStatus: false,
  showPaymentMethod: true,
  showRemoveTaxOnOrderReceipt: false,
  showRemoveTaxOnPaymentReceipt: false,
  showActivateAccountDetails: false,
  showActivateEmail: false,
  showActivateAddress: false,
  customMessage: "Thank you for your business!",
};

export const InvoiceCustomizationModal: React.FC<
  InvoiceCustomizationModalProps
> = ({ isOpen, onClose }) => {
  const { selectedOutlet: outlet } = useBusinessStore();
  const [formData, setFormData] = useState<InvoiceSettings>(defaultFormData);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoadingState, setIsLoading] = useState<boolean>(false);
  const [isClient, setIsClient] = useState(false);
  const { showToast } = useToastStore();

  // Ensure client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize form data from outlet receiptSettings (if present)
  useEffect(() => {
    const outletWithInvoiceSettings = outlet as unknown as {
      invoiceSettings?: InvoiceSettingsDto;
    } | null;

    if (!isOpen || !outletWithInvoiceSettings?.invoiceSettings) {
      setFormData(defaultFormData);
      setImageUrl(null);
      return;
    }

    const settings = outletWithInvoiceSettings.invoiceSettings;
    setFormData({
      showBakeryName: settings.showBakeryName ?? defaultFormData.showBakeryName,
      fontSize: settings.fontStyle ?? defaultFormData.fontSize,
      paperSize: settings.paperSize ?? defaultFormData.paperSize,
      showPaymentSuccess:
        settings.showPaymentSuccessText ?? defaultFormData.showPaymentSuccess,
      showBusinessLine:
        settings.showTotalPaidAtTop ?? defaultFormData.showBusinessLine,
      customBusinessText:
        settings.customizedPaymentSuccessText ??
        defaultFormData.customBusinessText,
      showInvoiceNumber:
        settings.showInvoiceNumber ?? defaultFormData.showInvoiceNumber,
      showInvoiceIssueDate:
        settings.showInvoiceIssueDate ?? defaultFormData.showInvoiceIssueDate,
      showInvoiceDueDate:
        settings.showInvoiceDueDate ?? defaultFormData.showInvoiceDueDate,
      showClientName:
        settings.showInvoiceClientName ?? defaultFormData.showClientName,
      showClientAddress:
        settings.showInvoiceClientAddress ?? defaultFormData.showClientAddress,
      showModifierBelowItems:
        settings.showModifierBelowItems ??
        defaultFormData.showModifierBelowItems,
      selectedColumns: {
        orderName:
          settings.selectedColumns?.orderName ??
          defaultFormData.selectedColumns.orderName,
        sku:
          settings.selectedColumns?.sku ?? defaultFormData.selectedColumns.sku,
        qty:
          settings.selectedColumns?.qty ?? defaultFormData.selectedColumns.qty,
        subTotal:
          settings.selectedColumns?.subTotal ??
          defaultFormData.selectedColumns.subTotal,
        total:
          settings.selectedColumns?.total ??
          defaultFormData.selectedColumns.total,
      },
      showDiscountLine:
        settings.showDiscountLine ?? defaultFormData.showDiscountLine,
      showTax: settings.showTax ?? defaultFormData.showTax,
      showDeliveryFee:
        settings.showShippingFee ?? defaultFormData.showDeliveryFee,
      showPaymentStatus:
        settings.showPaymentStatus ?? defaultFormData.showPaymentStatus,
      showPaymentMethod:
        settings.showPaymentMethod ?? defaultFormData.showPaymentMethod,
      showRemoveTaxOnOrderReceipt:
        settings.showTaxOnOrderReceipt ??
        defaultFormData.showRemoveTaxOnOrderReceipt,
      showRemoveTaxOnPaymentReceipt:
        settings.showTaxOnPaymentReceipt ??
        defaultFormData.showRemoveTaxOnPaymentReceipt,
      showActivateAccountDetails:
        settings.showAccountDetails ??
        defaultFormData.showActivateAccountDetails,
      showActivateEmail:
        settings.showEmail ?? defaultFormData.showActivateEmail,
      showActivateAddress:
        settings.showAddress ?? defaultFormData.showActivateAddress,
      customMessage:
        settings.customThankYouMessage ?? defaultFormData.customMessage,
    });
    setImageUrl(settings.customizedLogoUrl ?? null);
  }, [isOpen, outlet]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData(defaultFormData);
      setIsLoading(false);
      setImageUrl(null);
    }
  }, [isOpen]);

  const mapFormDataToDto = (): InvoiceSettingsDto => {
    const getFontStyle = (
      fontStyle: string,
    ): "Times New Roman" | "Arial" | "Helvetica" | "Courier New" => {
      const validFonts = [
        "Times New Roman",
        "Arial",
        "Helvetica",
        "Courier New",
      ] as const;

      const matchedFont = validFonts.find((font) => font === fontStyle);
      return matchedFont ?? "Times New Roman";
    };

    const getPaperSize = (paperSize: string): "A4" | "80mm" | undefined => {
      const validSizes = ["A4", "80mm"] as const;
      const matchedSize = validSizes.find((size) => size === paperSize);
      return matchedSize ?? "A4";
    };

    return {
      customizedLogoUrl: imageUrl || undefined,
      fontStyle: getFontStyle(formData.fontSize),
      showBakeryName: formData.showBakeryName,
      paperSize: getPaperSize(formData.paperSize),
      showPaymentSuccessText: formData.showPaymentSuccess,
      customizedPaymentSuccessText: formData.customBusinessText || undefined,
      showTotalPaidAtTop: formData.showBusinessLine,
      showInvoiceNumber: formData.showInvoiceNumber,
      showInvoiceIssueDate: formData.showInvoiceIssueDate,
      showInvoiceDueDate: formData.showInvoiceDueDate,
      showInvoiceClientName: formData.showClientName,
      showInvoiceClientAddress: formData.showClientAddress,
      showModifierBelowItems: formData.showModifierBelowItems,
      selectedColumns: formData.selectedColumns,
      showDiscountLine: formData.showDiscountLine,
      showTax: formData.showTax,
      showShippingFee: formData.showDeliveryFee,
      showPaymentStatus: formData.showPaymentStatus,
      showPaymentMethod: formData.showPaymentMethod,
      showTaxOnOrderReceipt: formData.showRemoveTaxOnOrderReceipt,
      showTaxOnPaymentReceipt: formData.showRemoveTaxOnPaymentReceipt,
      showAccountDetails: formData.showActivateAccountDetails,
      showEmail: formData.showActivateEmail,
      showAddress: formData.showActivateAddress,
      customThankYouMessage: formData.customMessage || undefined,
      showLogo: imageUrl ? true : false,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outlet) {
      showToast("error", "Missing Store ID", "Store information is missing.");
      return;
    }
    setIsLoading(true);
    const invoiceSettings = mapFormDataToDto();
    console.log("Saving invoice settings:", invoiceSettings);
    showToast(
      "success",
      "Save Successful!",
      "Your Invoice settings have been saved successfully",
    );
    setIsLoading(false);
    onClose();
  };

  if (!isClient) {
    return null;
  }

  return (
    <Modal
      size="xl"
      subtitle="Customize your invoices to fit your brand identity"
      image={SettingFiles.InvoiceCustomization}
      isOpen={isOpen}
      onClose={onClose}
      title="Invoice Customization"
    >
      <section className="flex gap-5">
        <div className="space-y-6 flex-1/2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="px-3.5 py-1.5">
              <h4 className="font-medium mb-4 text-[#1C1B20]">
                Invoice Branding
              </h4>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#737373]">
                    Show Bakery name
                  </label>
                  <Switch
                    checked={formData.showBakeryName}
                    onChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        showBakeryName: checked,
                      }))
                    }
                    ////disabled={isLoadingState}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <label className="flex-1/2 block text-sm font-medium text-[#737373] whitespace-nowrap">
                    Font Style
                  </label>
                  <div className="w-full ml-4">
                    <Dropdown
                      className="bg-[#FAFAFC]"
                      label="Fonts"
                      options={fontOptions}
                      selectedValue={formData.fontSize}
                      placeholder="Select a font"
                      onChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          fontSize: value,
                        }))
                      }
                      ////disabled={isLoadingState}
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <label className="flex-1/2 block text-sm font-medium text-[#737373] whitespace-nowrap">
                    Paper Size
                  </label>
                  <div className="w-full ml-4">
                    <Dropdown
                      className="bg-[#FAFAFC]"
                      label="Paper size"
                      options={paperSizeOptions}
                      selectedValue={formData.paperSize}
                      placeholder="Select Paper size"
                      onChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          paperSize: value,
                        }))
                      }
                      //disabled={isLoadingState}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Header Section */}
            <div className="border border-dashed border-[#D1D1D1] rounded-[10px] px-3.5 py-2.5">
              <h4 className="font-medium mb-4 text-[#1C1B20]">Header</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#737373]">
                    Show payment success text
                  </label>
                  <Switch
                    checked={formData.showPaymentSuccess}
                    onChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        showPaymentSuccess: checked,
                      }))
                    }
                    //disabled={isLoadingState}
                  />
                </div>

                <div className="flex flex-col mt-1.5 gap-1.5">
                  <label className="text-[#737373] text-sm font-medium">
                    Customize success text
                  </label>
                  <input
                    type="text"
                    className="outline-none text-[12px] border-2 border-[#D1D1D1] w-full px-3.5 py-2.5 bg-[#FAFAFC] rounded-[10px]"
                    placeholder="Enter Success text, e.g Payment successful!"
                    value={formData.customBusinessText}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        customBusinessText: e.target.value,
                      }))
                    }
                    //disabled={isLoadingState}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#737373]">
                    Show total paid at top
                  </label>
                  <Switch
                    checked={formData.showBusinessLine}
                    onChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        showBusinessLine: checked,
                      }))
                    }
                    //disabled={isLoadingState}
                  />
                </div>
              </div>
            </div>

            {/* Invoice Information */}
            <div className="border border-dashed border-[#D1D1D1] rounded-[10px] px-3.5 py-2.5">
              <h4 className="font-medium mb-4 text-[#1C1B20]">
                Invoice Information
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#737373]">
                    Invoice Number
                  </label>
                  <Switch
                    checked={formData.showInvoiceNumber}
                    onChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        showInvoiceNumber: checked,
                      }))
                    }
                    //disabled={isLoadingState}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#737373]">
                    Issue Date
                  </label>
                  <Switch
                    checked={formData.showInvoiceIssueDate}
                    onChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        showInvoiceIssueDate: checked,
                      }))
                    }
                    //disabled={isLoadingState}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#737373]">
                    Due Date
                  </label>
                  <Switch
                    checked={formData.showInvoiceDueDate}
                    onChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        showInvoiceDueDate: checked,
                      }))
                    }
                    //disabled={isLoadingState}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#737373]">
                    Client Name
                  </label>
                  <Switch
                    checked={formData.showClientName}
                    onChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        showClientName: checked,
                      }))
                    }
                    //disabled={isLoadingState}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#737373]">
                    Client Address
                  </label>
                  <Switch
                    checked={formData.showClientAddress}
                    onChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        showClientAddress: checked,
                      }))
                    }
                    //disabled={isLoadingState}
                  />
                </div>
              </div>
            </div>

            {/* Itemized Details/List */}
            <div className="border border-dashed border-[#D1D1D1] rounded-[10px] px-3.5 py-2.5">
              <h4 className="font-medium mb-4 text-[#1C1B20]">
                Itemized Details/List
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#737373]">
                    Show Modifiers Below Items
                  </label>
                  <Switch
                    checked={formData.showModifierBelowItems}
                    onChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        showModifierBelowItems: checked,
                      }))
                    }
                    //disabled={isLoadingState}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex-1/2 text-sm font-medium text-[#737373]">
                    Display Columns
                  </label>
                  <div className="flex-1/2 ml-4">
                    <Dropdown
                      mode="checkbox"
                      label="Select columns to display"
                      options={columnOptions}
                      selectedValues={formData.selectedColumns}
                      onMultiChange={(values) =>
                        setFormData((prev) => ({
                          ...prev,
                          selectedColumns: {
                            orderName: values.orderName || false,
                            sku: values.sku || false,
                            qty: values.qty || false,
                            subTotal: values.subTotal || false,
                            total: values.total || false,
                          },
                        }))
                      }
                      placeholder="Select columns to display"
                      //disabled={isLoadingState}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Breakdown */}
            <div className="border border-dashed border-[#D1D1D1] rounded-[10px] px-3.5 py-2.5">
              <h4 className="font-medium mb-4 text-[#1C1B20]">
                Payment Breakdown
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#737373]">
                    Show Discount line
                  </label>
                  <Switch
                    checked={formData.showDiscountLine}
                    onChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        showDiscountLine: checked,
                      }))
                    }
                    //disabled={isLoadingState}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#737373]">
                    Show Tax/VAT
                  </label>
                  <Switch
                    checked={formData.showTax}
                    onChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        showTax: checked,
                      }))
                    }
                    //disabled={isLoadingState}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#737373]">
                    Shipping / Delivery Fee
                  </label>
                  <Switch
                    checked={formData.showDeliveryFee}
                    onChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        showDeliveryFee: checked,
                      }))
                    }
                    //disabled={isLoadingState}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#737373]">
                    Payment Status
                  </label>
                  <Switch
                    checked={formData.showPaymentStatus}
                    onChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        showPaymentStatus: checked,
                      }))
                    }
                    //disabled={isLoadingState}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#737373]">
                    Payment Method
                  </label>
                  <Switch
                    checked={formData.showPaymentMethod}
                    onChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        showPaymentMethod: checked,
                      }))
                    }
                    //disabled={isLoadingState}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#737373]">
                    Remove Tax on Order Receipt
                  </label>
                  <Switch
                    checked={formData.showRemoveTaxOnOrderReceipt}
                    onChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        showRemoveTaxOnOrderReceipt: checked,
                      }))
                    }
                    //disabled={isLoadingState}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#737373]">
                    Remove Tax on Payment receipt
                  </label>
                  <Switch
                    checked={formData.showRemoveTaxOnPaymentReceipt}
                    onChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        showRemoveTaxOnPaymentReceipt: checked,
                      }))
                    }
                    //disabled={isLoadingState}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#737373]">
                    Activate account details
                  </label>
                  <Switch
                    checked={formData.showActivateAccountDetails}
                    onChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        showActivateAccountDetails: checked,
                      }))
                    }
                    //disabled={isLoadingState}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#737373]">
                    Activate Email
                  </label>
                  <Switch
                    checked={formData.showActivateEmail}
                    onChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        showActivateEmail: checked,
                      }))
                    }
                    //disabled={isLoadingState}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#737373]">
                    Activate Address
                  </label>
                  <Switch
                    checked={formData.showActivateAddress}
                    onChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        showActivateAddress: checked,
                      }))
                    }
                    //disabled={isLoadingState}
                  />
                </div>
              </div>
            </div>

            {/* Custom Message */}
            <div className="border border-dashed border-[#D1D1D1] rounded-[10px] px-3.5 py-4">
              <label className="block text-sm font-medium text-[#1C1B20] mb-2">
                Custom &quot;Thank you&quot; Message
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none outline-none"
                rows={3}
                value={formData.customMessage}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customMessage: e.target.value,
                  }))
                }
                placeholder="Enter your custom message"
                //disabled={isLoadingState}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              //disabled={isLoadingState}
            >
              {isLoadingState ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                "Save Settings"
              )}
            </Button>
          </form>
        </div>

        {/* Preview Section */}
        <div className="flex-1/2">
          <h3 className="font-medium text-[#1C1B20] mb-4">Preview</h3>
          <InvoiceBrandingPreview
            formData={formData}
            imageUrl={imageUrl}
            store={outlet}
          />
        </div>
      </section>
    </Modal>
  );
};
