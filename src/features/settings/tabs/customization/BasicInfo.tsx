import { Copy, Globe, Info, Mail, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { useState } from "react";
import AssetsFiles from "@/assets";

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

const BasicInfo = () => {
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [whatsappActivated, setWhatsappActivated] = useState(false);
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="text-[24px] font-bold text-[#000000]">Basic Setup</h2>
        <p className="mt-1 text-sm text-[#737373]">
          Activate the channels you want to receive online orders from
        </p>
      </div>

      <div className="space-y-4">
        {!whatsappActivated ? (
          <>
            {channels.map((channel) => {
              const Icon = channel.icon;

              return (
                <div
                  key={channel.id}
                  className="flex items-center justify-between rounded-[12px] border border-[#E5E7EB] bg-white px-5 py-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#15BA5C] text-[#15BA5C]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium text-[#111827]">
                      {channel.label}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={
                      channel.id === "whatsapp"
                        ? () => setShowWhatsappModal(true)
                        : undefined
                    }
                    className="flex w-[260px] cursor-pointer items-center justify-center rounded-full bg-[#15BA5C] py-2 text-sm font-medium text-white"
                  >
                    {channel.actionLabel}
                  </button>
                </div>
              );
            })}
          </>
        ) : (
          <>
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
                    placeholder="Enter your business whatsapp no"
                    className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2.5 text-sm outline-none placeholder-[#A6A6A6]"
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

                <button
                  type="button"
                  className="mt-2 w-full cursor-pointer rounded-[12px] bg-[#15BA5C] py-3 text-sm font-medium text-white transition-colors hover:bg-[#13A652]"
                >
                  Activate WhatsApp Store Front
                </button>
              </div>
            </div>

            <div className="rounded-[12px] border border-[#E5E7EB] bg-white px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#15BA5C] text-[#15BA5C]">
                  <Mail className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-[#111827]">
                  Email
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-[10px] bg-[#F9FAFB] px-3 py-2.5 text-sm text-[#111827]">
                <span className="truncate pr-3">dexstore283@gmail.com</span>
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[#6B7280] hover:bg-gray-100 hover:text-[#111827] cursor-pointer"
                  aria-label="Copy email"
                  title="Copy email"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>

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
                <span className="truncate pr-3">
                  https://bountip.restaurant/your-storefront
                </span>
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[#6B7280] hover:bg-gray-100 hover:text-[#111827] cursor-pointer"
                  aria-label="Copy storefront link"
                  title="Copy storefront link"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <button
        type="button"
        className={`mt-4 w-full rounded-[12px] py-3 text-center text-sm font-medium transition-colors ${
          whatsappActivated
            ? "cursor-pointer bg-[#15BA5C] text-white hover:bg-[#13A652]"
            : "cursor-not-allowed bg-[#E5E7EB] text-[#9CA3AF]"
        }`}
      >
        Save and Continue
      </button>

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
