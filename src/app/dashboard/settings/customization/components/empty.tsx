// import React, { useState } from "react";
// import { useActivateStorefrontMutation } from "@/redux/business";
// import { useAppSelector } from "@/hooks/redux-hooks";
// import { useBusiness } from "@/hooks/use-business";
// import Image from "next/image";
// import SuccessToast from "@/components/Modals/Success/SuccessModal";
// import ErrorToast from "@/components/Modals/Errors/ErrorModal";
// import {
//   useGetStoreDetailsQuery,
//   useLazyGetStoreDetailsQuery,
// } from "@/redux/store/store-setting";

// interface EmptyStateProps {
//   onActivate: () => void;
// }

// export default function EmptyState({ onActivate }: EmptyStateProps) {
//   const { refetchAll } = useBusiness();
//   const [successToast, setSuccessToast] = useState({
//     isOpen: false,
//     heading: "",
//     description: "",
//   });
//   const [errorToast, setErrorToast] = useState({
//     isOpen: false,
//     heading: "",
//     description: "",
//   });
//   const outlet = useAppSelector((state) => state.business.outlet);
//   const [activateStoreFront, { isLoading }] = useActivateStorefrontMutation();
//   const [getStoreDetails] = useLazyGetStoreDetailsQuery();

//   const handleActivate = async () => {
//     if (!outlet?.id) return;
//     try {
//       await activateStoreFront({ outletId: outlet.id }).unwrap();
//       onActivate();
//       setSuccessToast({
//         isOpen: true,
//         heading: "Activation Successful",
//         description: "Your Storefront has been activated successfully",
//       });
//       refetchAll();
//       getStoreDetails(outlet.id);
//     } catch (error) {
//       setErrorToast({
//         isOpen: true,
//         heading: "Activation Failed",
//         description: "Your Storefront failed, Please retry",
//       });
//       console.error("Failed to activate storefront:", error);
//     }
//   };

//   return (
//     <div className="flex flex-col items-center justify-center py-12">
//       <div className="relative h-[358px] w-[447px]  bg-red-">
//         <Image
//           src="/empty-storefront.svg"
//           alt="Empty Store front"
//           fill
//           className="object-contain"
//         />
//       </div>
//       <div className="flex flex-col w-[447px] gap-4 mt-[30px]">
//         <h3 className="text-[2rem] text-center font-semibold text-[#1C1B20] mb-2">
//           Activate the Storefront
//         </h3>

//         <p className="text-[#737373] text-center mb-6 ">
//           Click on the “Activate Storefront” to activate your online channels to
//           receive orders
//         </p>
//       </div>

//       <button
//         onClick={handleActivate}
//         disabled={isLoading}
//         className=" cursor-pointer w-[447px] py-3 px-6 bg-[#15BA5C] hover:bg-[#13A652] text-white font-medium rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
//       >
//         {isLoading ? "Activating..." : "Activate Storefront"}
//       </button>

//       <SuccessToast
//         isOpen={successToast.isOpen}
//         heading={successToast.heading}
//         description={successToast.description}
//         onClose={() => setSuccessToast((prev) => ({ ...prev, isOpen: false }))}
//         duration={5000}
//       />
//       <ErrorToast
//         isOpen={errorToast.isOpen}
//         heading={errorToast.heading}
//         description={errorToast.description}
//         onClose={() => setErrorToast((prev) => ({ ...prev, isOpen: false }))}
//         duration={5000}
//       />
//     </div>
//   );
// }
