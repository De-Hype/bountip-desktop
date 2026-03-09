import EmptyStateAssests from "@/assets/images/empty-state";
import { Plus } from "lucide-react";

interface NotFoundProps {
  onAction: () => void;
}

const NotFound = ({ onAction }: NotFoundProps) => {
  return (
    <div className="w-full flex items-center justify-center">
      <div className="flex flex-col justify-center items-center max-w-sm place-self-center">
        <img
          src={EmptyStateAssests.CustomerManagementEmptyState}
          alt="Empty customer icon"
          className="size-[250px] object-contain"
        />
        <div className="space-y-2">
          <p className="text-gray-900 text-3xl font-bold">
            No Customer Created
          </p>
          <p className="text-base text-[#737373]">
            Click on the "Add a New Customer" button to create your first
            customer{" "}
          </p>
        </div>
        <button
          onClick={onAction}
          className={`flex justify-center items-center gap-2.5 w-full py-3 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer
          bg-[#15BA5C] text-white hover:bg-[#15BA5C] active:scale-95 mt-6
        `}
        >
          <Plus className="size-4" />
          <span>Create New customer</span>
        </button>
      </div>
    </div>
  );
};

export default NotFound;
