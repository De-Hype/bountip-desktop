import NotFoundAssests from "@/assets/images/not-found";
import { useState } from "react";
import storeFrontService from "@/services/storefrontService";
import useToastStore from "@/stores/toastStore";
import { useNetworkStore } from "@/stores/useNetworkStore";

type NotFoundProps = {
  outletId?: string | null;
  onActivated?: () => void | Promise<void>;
};

const NotFound = ({ outletId, onActivated }: NotFoundProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { showToast } = useToastStore();
  const {isOnline}=useNetworkStore()
  const handleActivate = async () => {
    if(!isOnline) return showToast("error", "You're offline", "You need to have internet connection before you can activate storefront")
    if (!outletId) return;
    try {
      setIsLoading(true);
      await storeFrontService.activateStoreFront(outletId);
      if (onActivated) await onActivated();
      showToast("success", "Success", "Storefront activated");
    } catch (error) {
      console.log(error);
      showToast("error", "Error", "Failed to activate storefront");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative h-[358px] w-[447px]  bg-red-">
        <img
          src={NotFoundAssests.StorefrontNotFound}
          alt="Empty Store front"
          className="object-contain"
        />
      </div>
      <div className="flex flex-col w-[447px] gap-4 mt-[30px]">
        <h3 className="text-[2rem] text-center font-semibold text-[#1C1B20] mb-2">
          Activate the Storefront
        </h3>

        <p className="text-[#737373] text-center mb-6 ">
          Click on the “Activate Storefront” to activate your online channels to
          receive orders
        </p>
      </div>

      <button
        onClick={handleActivate}
        disabled={isLoading || !outletId}
        className=" cursor-pointer w-[447px] py-3 px-6 bg-[#15BA5C] hover:bg-[#13A652] text-white font-medium rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? "Activating..." : "Activate Storefront"}
      </button>
    </div>
  );
};

export default NotFound;
