import { Copy, Globe, Info, Mail, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { useState } from "react";
import AssetsFiles from "@/assets";
import useToastStore from "@/stores/toastStore";
import storeFrontService from "@/services/storefrontService";

const channels = [
  {
    id: "whatsapp",
    icon: FaWhatsapp,
    label: "WhatsApp Channel",
    actionLabel: "Activate WhatsApp Store Front",
  },
  {
    id: "email",
    icon: Mail,
    label: "Email",
    actionLabel: "Activate Email Store Front",
  },
  {
    id: "storefront",
    icon: Globe,
    label: "Online Storefront",
    actionLabel: "Activate Web Store Front",
  },
];

type BasicInfoProps = {
  customSubDomain?: string | null;
  emailAlias?: string | null;
  outletId?: string | null;
  whatsappChannel?: boolean;
  whatsappNumber?: string | null;
  webChannel?: boolean;
  onChannelsUpdated?: () => void | Promise<void>;
};

const BasicInfo = ({
  customSubDomain,
  emailAlias,
  outletId,
  whatsappChannel = false,
  whatsappNumber = null,
  webChannel = false,
  onChannelsUpdated,
}: BasicInfoProps) => {
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [whatsappActivated, setWhatsappActivated] = useState(false);
  const { showToast } = useToastStore();
  const rawSubDomain = String(customSubDomain || "").trim();
  const storefrontUrl = rawSubDomain
    ? rawSubDomain.startsWith("http")
      ? rawSubDomain
      : `${rawSubDomain}`
    : "";
  const storefrontActivated = storefrontUrl.length > 0;
  const emailValue = String(emailAlias || "").trim();
  const emailActivated = emailValue.length > 0;
  const whatsappActivatedValue = whatsappActivated || Boolean(whatsappChannel);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [isUpdatingChannels, setIsUpdatingChannels] = useState(false);
  const [showWhatsappInput, setShowWhatsappInput] = useState(false);
  const [whatsappDraft, setWhatsappDraft] = useState("");
  const [isUpdatingWhatsapp, setIsUpdatingWhatsapp] = useState(false);

  const handleCopy = async (value: string, successMessage: string) => {
    if (!value) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const el = document.createElement("textarea");
        el.value = value;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      showToast("success", "Copied", successMessage);
    } catch {
      showToast("error", "Error", "Failed to copy");
    }
  };

  const handleActivateEmail = async () => {
    if (!outletId) return;
    setIsUpdatingChannels(true);
    try {
      await storeFrontService.updateStoreChannels(outletId, {
        whatsappChannel,
        whatsappNumber,
        emailChannel: true,
        webChannel,
      });
      if (onChannelsUpdated) await onChannelsUpdated();
      setShowEmailInput(false);
      showToast("success", "Success", "Email storefront activated");
    } catch {
      showToast("error", "Error", "Failed to activate email storefront");
    } finally {
      setIsUpdatingChannels(false);
    }
  };

  const handleActivateWhatsapp = async () => {
    if (!outletId) return;
    const nextNumber = whatsappDraft.trim();
    if (!nextNumber) return;

    setIsUpdatingWhatsapp(true);
    try {
      await storeFrontService.updateStoreChannels(outletId, {
        whatsappChannel: true,
        whatsappNumber: nextNumber,
        emailChannel: emailActivated,
        webChannel,
      });
      if (onChannelsUpdated) await onChannelsUpdated();
      setShowWhatsappInput(false);
      showToast("success", "Success", "WhatsApp storefront activated");
    } catch {
      showToast("error", "Error", "Failed to activate WhatsApp storefront");
    } finally {
      setIsUpdatingWhatsapp(false);
    }
  };
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="text-[24px] font-bold text-[#000000]">Basic Setup</h2>
        <p className="mt-1 text-sm text-[#737373]">
          Activate the channels you want to receive online orders from
        </p>
      </div>

      <div className="space-y-4">
        {!whatsappActivatedValue && (
          <div className="flex items-center justify-between rounded-[12px] border border-[#E5E7EB] bg-white px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#15BA5C] text-[#15BA5C]">
                <FaWhatsapp className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-[#111827]">
                WhatsApp Channel
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowWhatsappModal(true)}
              className="flex w-[260px] cursor-pointer items-center justify-center rounded-full bg-[#15BA5C] py-2 text-sm font-medium text-white"
            >
              Activate WhatsApp Store Front
            </button>
          </div>
        )}

        {showWhatsappInput && (
          <div className="rounded-[12px] border border-[#E5E7EB] bg-white px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#15BA5C] text-[#15BA5C]">
                <FaWhatsapp className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-[#111827]">
                WhatsApp Storefront
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-medium text-[#111827]">
                  WhatsApp Number
                </p>
                <input
                  type="text"
                  value={whatsappDraft}
                  onChange={(e) => setWhatsappDraft(e.target.value)}
                  placeholder="Enter your business whatsapp no"
                  className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2.5 text-sm outline-none placeholder-[#A6A6A6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowWhatsappInput(false)}
                  className="w-full cursor-pointer rounded-[12px] bg-[#F3F4F6] py-3 text-sm font-medium text-[#4B5563] transition-colors hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleActivateWhatsapp}
                  disabled={
                    !outletId || isUpdatingWhatsapp || !whatsappDraft.trim()
                  }
                  className="w-full cursor-pointer rounded-[12px] bg-[#15BA5C] py-3 text-sm font-medium text-white transition-colors hover:bg-[#13A652] disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isUpdatingWhatsapp ? "Activating..." : "Activate"}
                </button>
              </div>
            </div>
          </div>
        )}

        {!emailActivated && (
          <div className="flex items-center justify-between rounded-[12px] border border-[#E5E7EB] bg-white px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#15BA5C] text-[#15BA5C]">
                <Mail className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-[#111827]">Email</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowEmailInput(true);
              }}
              className="flex w-[260px] cursor-pointer items-center justify-center rounded-full bg-[#15BA5C] py-2 text-sm font-medium text-white"
            >
              Activate Email Store Front
            </button>
          </div>
        )}

        {showEmailInput && (
          <div className="rounded-[12px] border border-[#E5E7EB] bg-white px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#15BA5C] text-[#15BA5C]">
                <Mail className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-[#111827]">
                Activate Email Storefront
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowEmailInput(false)}
                  className="w-full cursor-pointer rounded-[12px] bg-[#F3F4F6] py-3 text-sm font-medium text-[#4B5563] transition-colors hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleActivateEmail}
                  disabled={!outletId || isUpdatingChannels}
                  className="w-full cursor-pointer rounded-[12px] bg-[#15BA5C] py-3 text-sm font-medium text-white transition-colors hover:bg-[#13A652] disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isUpdatingChannels ? "Activating..." : "Activate"}
                </button>
              </div>
            </div>
          </div>
        )}

        {whatsappActivatedValue && (
          <div className="rounded-[12px] border border-[#E5E7EB] bg-white px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#15BA5C] text-[#15BA5C]">
                <FaWhatsapp className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-[#111827]">
                WhatsApp Channel
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-medium text-[#111827]">
                  Whatsapp Number
                </p>
                <input
                  type="text"
                  value={whatsappNumber || ""}
                  readOnly
                  placeholder="—"
                  className="w-full rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2.5 text-sm outline-none placeholder-[#A6A6A6]"
                />
              </div>

              <div className="flex items-center gap-2 rounded-[10px] bg-[#E6F9EE] px-3 py-2.5 text-sm text-[#166534]">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#BBF7D0]">
                  <Info className="h-3 w-3" />
                </span>
                <span>
                  Customers can place orders directly through this WhatsApp
                  number
                </span>
              </div>
            </div>
          </div>
        )}

        {emailActivated && (
          <div className="rounded-[12px] border border-[#E5E7EB] bg-white px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#15BA5C] text-[#15BA5C]">
                <Mail className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-[#111827]">Email</span>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-[10px] bg-[#F9FAFB] px-3 py-2.5 text-sm text-[#111827]">
              <span className="truncate pr-3">{emailValue}</span>
              <button
                type="button"
                onClick={() => handleCopy(emailValue, "Email copied")}
                className="flex h-7 w-7 items-center justify-center rounded-full text-[#6B7280] hover:bg-gray-100 hover:text-[#111827] cursor-pointer"
                aria-label="Copy email"
                title="Copy email"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {storefrontActivated && (
          <div className="rounded-[12px] border border-[#E5E7EB] bg-white px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#15BA5C] text-[#15BA5C]">
                <Globe className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-[#111827]">
                Online Storefront
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-[10px] bg-[#F9FAFB] px-3 py-2.5 text-sm text-[#111827]">
              <span className="truncate pr-3">{storefrontUrl}</span>
              <button
                type="button"
                onClick={() =>
                  handleCopy(storefrontUrl, "Storefront link copied")
                }
                className="flex h-7 w-7 items-center justify-center rounded-full text-[#6B7280] hover:bg-gray-100 hover:text-[#111827] cursor-pointer"
                aria-label="Copy storefront link"
                title="Copy storefront link"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* <button
        type="button"
        className={`mt-4 w-full rounded-[12px] py-3 text-center text-sm font-medium transition-colors ${
          storefrontActivated
            ? "cursor-pointer bg-[#15BA5C] text-white hover:bg-[#13A652]"
            : "cursor-not-allowed bg-[#E5E7EB] text-[#9CA3AF]"
        }`}
      >
        Save and Continue
      </button> */}

      {showWhatsappModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="relative w-full max-w-[720px] rounded-[24px] bg-white shadow-2xl">
            <div className="relative bg-[#E5F9EE] px-6 pt-8 pb-10 rounded-t-[24px]">
              <div className="absolute -top-9 -left-9 flex h-16 w-16 items-center justify-center rounded-full bg-[#15BA5C] shadow-lg">
                <FaWhatsapp className="h-7 w-7 text-white" />
              </div>

              <button
                type="button"
                onClick={() => setShowWhatsappModal(false)}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-[#111827] cursor-pointer"
                aria-label="Close"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mt-6 flex flex-col gap-6">
                <div className="self-end rounded-l-full rounded-br-full bg-[#15BA5C] px-8 py-2 text-sm font-medium text-white">
                  Hello Good Morning!
                </div>

                <div className="relative max-w-[520px] rounded-[24px] bg-white px-6 py-4 text-sm text-[#111827] shadow-sm">
                  <p>
                    Hello! Welcome to Dex Bakery, what would you like to Order
                  </p>
                  <div className="mt-2 flex items-center justify-end gap-1 text-[11px]">
                    <span className="text-[#15BA5C]">11:48PM</span>
                    <span className="text-[#BCA8F1]">✓✓</span>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="flex h-9 w-16 items-center justify-center rounded-full bg-[#15BA5C]">
                    <div className="flex w-9 items-center justify-between">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 py-8">
              <h3 className="text-center text-2xl font-semibold text-[#1C1B20]">
                WhatsApp StoreFront
              </h3>
              <div className="mt-4 space-y-4 text-center text-sm text-[#4B5563]">
                <p>
                  The WhatsApp Storefront allows your customers to place orders
                  directly through your business WhatsApp number.
                </p>
                <p>
                  Once activated, your menu and product list are automatically
                  linked to WhatsApp, so customers can browse items, send
                  inquiries, and place orders seamlessly through chat.
                </p>
                <p>
                  This helps you manage orders faster, reduce missed messages,
                  and provide a more personal customer experience.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setWhatsappActivated(true);
                  setShowWhatsappModal(false);
                  setWhatsappDraft(whatsappNumber || "");
                  setShowWhatsappInput(true);
                }}
                className="mt-8 w-full cursor-pointer rounded-[12px] bg-[#15BA5C] py-3 text-sm font-medium text-white transition-colors hover:bg-[#13A652]"
              >
                Activate WhatsApp Storefront
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default BasicInfo;
