import NotFoundAssests from "@/assets/images/not-found";
import { useState } from "react";

const NotFound = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const handleActivate = async () => {
    try {
      setIsLoading(true);
    } catch (error) {
      console.log(error);
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
        disabled={isLoading}
        className=" cursor-pointer w-[447px] py-3 px-6 bg-[#15BA5C] hover:bg-[#13A652] text-white font-medium rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? "Activating..." : "Activate Storefront"}
      </button>
    </div>
  );
};

export default NotFound;
