"use client";

import CustomerManagementAssets from "@/assets/images/customer-management";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CustomerList from "@/features/customer-management/customers/CustomerList";

const customerStats = [
  {
    label: "Total Customers",
    value: "0",
    bgColor: "#0485FC0D",
    iconColor: "#0485FC1A",
    image: CustomerManagementAssets.UserStar,
  },
  {
    label: "Total Active Customers",
    value: "0",
    bgColor: "#15BA5C0D",
    iconColor: "#15BA5C1A",
    image: CustomerManagementAssets.UserStatsGreen,
  },
  {
    label: "Total Inactive Customers",
    value: "0",
    bgColor: "#F8BD000D",
    iconColor: "#F8BD001A",
    image: CustomerManagementAssets.UserStatsYellow,
  },
  {
    label: "Total Individual Customers",
    value: "0",
    bgColor: "#9747FF0D",
    iconColor: "#9747FF1A",
    image: CustomerManagementAssets.UserStatsPurple,
  },
  {
    label: "Total Organizations",
    value: "0",
    bgColor: "#307B320D",
    iconColor: "#307B321A",
    image: CustomerManagementAssets.UserStatsTeal,
  },
];

const CustomerManagement = () => {
  return (
    <section className="">
      <div className="w-full">
        <Tabs defaultValue="customers" className="w-auto">
          <div className="bg-white px-6 py-4">
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
                            {stats.value}
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
            <div className="p-4 bg-white rounded-lg border border-gray-100">
              <h3 className="text-lg font-medium text-gray-900">
                Payment Terms
              </h3>
              <p className="text-gray-500 mt-2">
                Configure payment terms and conditions.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default CustomerManagement;
