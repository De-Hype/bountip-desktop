import EmptyStateAssests from "@/assets/images/empty-state";

const DebtorsNotFound = () => {
  return (
    <div className="w-full flex items-center justify-center">
      <div className="flex flex-col justify-center items-center max-w-sm place-self-center">
        <img
          src={EmptyStateAssests.CustomerManagementEmptyState}
          alt="Empty customer icon"
          className="size-[250px] object-contain"
        />
        <div className="space-y-2">
          <p className="text-gray-900 text-[25px] font-bold">
            No Outstanding Debtors
          </p>
          <p className="text-[15px] text-[#737373]">
            You have no outstanding / pending payment by a customer
          </p>
        </div>
      </div>
    </div>
  );
};

export default DebtorsNotFound;
