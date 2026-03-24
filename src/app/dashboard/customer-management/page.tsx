"use client";

import CustomerManagementAssets from "@/assets/images/customer-management";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CustomerList from "@/features/customer-management/customers/CustomerList";
import { Plus } from "lucide-react";
import CreateCustomer from "@/features/customer-management/customers/CreateCustomer";
import { useState, useMemo, useEffect } from "react";
import useCustomerStore from "@/stores/useCustomerStore";
import PaymentTermsList, {
  PaymentTerm,
} from "@/features/customer-management/payment-tiers/PaymentTermsList";
import PaymentTermDetails from "@/features/customer-management/payment-tiers/PaymentTermDetails";
import CreatePaymentTerm from "@/features/customer-management/payment-tiers/CreatePaymentTerm";
import EditPaymentTerm from "@/features/customer-management/payment-tiers/EditPaymentTerm";
import useBusinessStore from "@/stores/useBusinessStore";

const CustomerManagement = () => {
  const [isCustomerCreationOpen, setIsCustomerCreationOpen] = useState(false);
  const [isCreateTermOpen, setIsCreateTermOpen] = useState(false);
  const [isEditTermOpen, setIsEditTermOpen] = useState(false);
  const [editTermMode, setEditTermMode] = useState<"view" | "edit">("view");
  const { allCustomers, isLoading, fetchCustomers } = useCustomerStore();
  const selectedOutlet = useBusinessStore((state) => state.selectedOutlet);

  // Re-fetch customers when selected outlet changes
  useEffect(() => {
    if (selectedOutlet?.id) {
      fetchCustomers(selectedOutlet.id);
    }
  }, [selectedOutlet?.id, fetchCustomers]);

  // Payment Terms State
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<PaymentTerm | null>(null);
  const [isTermsLoading, setIsTermsLoading] = useState(false);
  const [termsSearchQuery, setTermsSearchQuery] = useState("");

  const fetchPaymentTerms = async () => {
    if (!selectedOutlet) {
      setPaymentTerms([]);
      setSelectedTerm(null);
      return;
    }
    setIsTermsLoading(true);
    setSelectedTerm(null); // Clear selected term when outlet changes
    try {
      const api = (window as any).electronAPI;
      if (api) {
        const result = await api.getPaymentTerms(selectedOutlet.id);
        const mapped = result.map((pt: any) => ({
          ...pt,
          paymentInInstallment: pt.paymentInInstallment
            ? JSON.parse(pt.paymentInInstallment)
            : null,
        }));
        setPaymentTerms(mapped);
        if (mapped.length > 0) {
          setSelectedTerm(mapped[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch payment terms:", error);
    } finally {
      setIsTermsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentTerms();
  }, [selectedOutlet]);

  const filteredTerms = useMemo(() => {
    return paymentTerms.filter((term) =>
      term.name.toLowerCase().includes(termsSearchQuery.toLowerCase()),
    );
  }, [paymentTerms, termsSearchQuery]);

  const customerStats = useMemo(() => {
    return [
      {
        label: "Total Customers",
        value: allCustomers.length.toString(),
        bgColor: "#0485FC0D",
        iconColor: "#0485FC1A",
        image: CustomerManagementAssets.UserStar,
      },
      {
        label: "Total Active Customers",
        value: allCustomers
          .filter((c) => c.status === "Active")
          .length.toString(),
        bgColor: "#15BA5C0D",
        iconColor: "#15BA5C1A",
        image: CustomerManagementAssets.UserStatsGreen,
      },
      {
        label: "Total Inactive Customers",
        value: allCustomers
          .filter((c) => c.status === "Inactive")
          .length.toString(),
        bgColor: "#F8BD000D",
        iconColor: "#F8BD001A",
        image: CustomerManagementAssets.UserStatsYellow,
      },
      {
        label: "Total Individual Customers",
        value: allCustomers
          .filter((c) => c.type === "Individual")
          .length.toString(),
        bgColor: "#9747FF0D",
        iconColor: "#9747FF1A",
        image: CustomerManagementAssets.UserStatsPurple,
      },
      {
        label: "Total Organizations",
        value: allCustomers
          .filter((c) => c.type === "Organization")
          .length.toString(),
        bgColor: "#307B320D",
        iconColor: "#307B321A",
        image: CustomerManagementAssets.UserStatsTeal,
      },
    ];
  }, [allCustomers]);

  return (
    <section className="">
      <div className="w-full">
        <Tabs defaultValue="customers" className="w-auto">
          <div className="bg-white px-6 py-4 flex items-center justify-between">
            <TabsList className="w-fit h-14 p-1.5">
              <TabsTrigger
                className="px-6 py-2 text-base font-medium text-gray-900 cursor-pointer"
                value="customers"
              >
                Customers
              </TabsTrigger>
              <TabsTrigger
                className="px-6 py-2 text-base font-medium text-gray-900 cursor-pointer"
                value="payment-terms"
              >
                Payment Terms
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="customers"
              className=" flex items-end justify-end"
            >
              <button
                onClick={() => setIsCustomerCreationOpen(true)}
                className="flex items-center gap-2.5 px-6 py-3 rounded-xl text-base font-semibold transition-all duration-200 cursor-pointer bg-[#15BA5C] text-white hover:bg-[#119E4D] active:scale-95 shadow-sm"
              >
                <Plus className="size-5" />
                <span>Create Customer</span>
              </button>
            </TabsContent>
          </div>

          <TabsContent value="customers" className="mt-6">
            <div className="mt-4 mb-10 mx-8 space-y-4">
              <div className="bg-white p-4 grid grid-cols-5 gap-4">
                {customerStats.map((stats, index) => (
                  <div
                    key={index}
                    className="relative p-6 px-3 rounded-xl overflow-hidden"
                    style={{ backgroundColor: stats.bgColor }}
                  >
                    {/* Gradient highlight */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle_at_80%_50%, ${stats.iconColor} 0%, transparent 65%)`,
                      }}
                    />

                    {/* Grid pattern */}
                    <div
                      className="absolute inset-0 pointer-events-none opacity-40"
                      style={{
                        backgroundImage: `
            linear-gradient(to right, ${stats.iconColor} 1px, transparent 1px),
            linear-gradient(to bottom, ${stats.iconColor} 1px, transparent 1px)
          `,
                        backgroundSize: "36px 36px",
                      }}
                    />

                    {/* Content */}
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center justify-center gap-3">
                          {/* Icon container */}
                          <div
                            className="size-10 rounded-sm flex justify-center items-center p-2"
                            style={{ background: stats.iconColor }}
                          >
                            <img
                              src={stats.image}
                              className="size-9"
                              alt="Customer icon"
                            />
                          </div>

                          <span className="text-4xl sm:text-3xl font-bold text-[#1C1B20]">
                            {isLoading ? (
                              <span className="block h-8 w-12 bg-gray-200/50 animate-pulse rounded" />
                            ) : (
                              stats.value
                            )}
                          </span>
                        </div>
                      </div>

                      <p className="text-base sm:text-lg text-gray-900">
                        {stats.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <CustomerList />
            </div>
          </TabsContent>

          <TabsContent value="payment-terms" className="mt-6">
            <div className=" px-3  flex gap-[12px] overflow-hidden  h-[700px]">
              <PaymentTermsList
                terms={filteredTerms}
                selectedTermId={selectedTerm?.id || null}
                onSelect={setSelectedTerm}
                searchQuery={termsSearchQuery}
                onSearchChange={setTermsSearchQuery}
                isLoading={isTermsLoading}
              />
              <PaymentTermDetails
                term={selectedTerm}
                onAdd={() => {
                  setIsCreateTermOpen(true);
                }}
                onEdit={(term) => {
                  setSelectedTerm(term);
                  setEditTermMode("edit");
                  setIsEditTermOpen(true);
                }}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <CreateCustomer
        isOpen={isCustomerCreationOpen}
        onClose={() => setIsCustomerCreationOpen(false)}
      />

      <CreatePaymentTerm
        isOpen={isCreateTermOpen}
        onClose={() => setIsCreateTermOpen(false)}
        onSuccess={fetchPaymentTerms}
      />

      <EditPaymentTerm
        isOpen={isEditTermOpen}
        onClose={() => setIsEditTermOpen(false)}
        onSuccess={fetchPaymentTerms}
        paymentTerm={selectedTerm}
        mode={editTermMode}
      />
    </section>
  );
};

export default CustomerManagement;
