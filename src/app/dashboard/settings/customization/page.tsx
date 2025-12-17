"use client";

export default function CustomizationPage() {
  return <div>Customization Settings</div>;
}

// // /* eslint-disable @typescript-eslint/no-unused-vars */
// // "use client";
// // import React, { useEffect, useState } from "react";
// // import { useAppSelector } from "@/hooks/redux-hooks";
// // import { BankAccount, BusinessOperation, Product } from "./components/types";

// // import BasicSetupSection from "./components/basic-setup-section";
// // import CustomizationSection from "./components/customization-section";
// // import EmptyState from "./components/empty";
// // import ProductForm from "./components/product-form";
// // import BusinessOperationsSection from "./components/business-operation-section";
// // import ProductsSection from "./components/product-section";
// // import Sidebar from "./components/sidebar";
// // import { useLazyGetStoreDetailsQuery } from "@/redux/store/store-setting";

// // export default function CustomizationPage() {
// //   const outlet = useAppSelector((state) => state.business.outlet);
// //   const [getStoreDetails, { data: storeData, isLoading: isStoreLoading }] =
// //     useLazyGetStoreDetailsQuery();

// //   const [currentStep, setCurrentStep] = useState(1);
// //   const [activeSection, setActiveSection] = useState("basic-setup");

// //   // State management
// //   const [logo, setLogo] = useState<string | null>(null);
// //   const [coverImage, setCoverImage] = useState<string | null>(null);
// //   const [selectedColor, setSelectedColor] = useState("#15BA5C");
// //   const [customColor, setCustomColor] = useState("");
// //   const [businessOperation, setBusinessOperation] = useState<BusinessOperation>(
// //     {
// //       delivery: true,
// //       pickup: false,
// //     }
// //   );
// //   // const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([
// //   //   { id: "Uk", bank: "", accountNumber: "", accountName: "" },
// //   // ]);
// //   const [products, setProducts] = useState<Product[]>([]);
// //   const [showProductForm, setShowProductForm] = useState(false);
// //   const [editingProduct, setEditingProduct] = useState<Product | null>(null);
// //   useEffect(() => {
// //     if (outlet?.id) {
// //       getStoreDetails(outlet.id);
// //     }
// //   }, [outlet?.id, getStoreDetails]);

// //   // Handler functions (moved from the original component)
// //   // const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
// //   //   const file = e.target.files?.[0];
// //   //   if (file) {
// //   //     const reader = new FileReader();
// //   //     reader.onloadend = () => {
// //   //       setLogo(reader.result as string);
// //   //     };
// //   //     reader.readAsDataURL(file);
// //   //   }
// //   // };

// //   // const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
// //   //   const file = e.target.files?.[0];
// //   //   if (file) {
// //   //     const reader = new FileReader();
// //   //     reader.onloadend = () => {
// //   //       setCoverImage(reader.result as string);
// //   //     };
// //   //     reader.readAsDataURL(file);
// //   //   }
// //   // };

// //   const handleLogoUpload = (logoUrl: string) => {
// //     setLogo(logoUrl);
// //   };

// //   const handleCoverImageUpload = (coverUrl: string) => {
// //     setCoverImage(coverUrl);
// //   };

// //   const handleDeleteLogo = () => setLogo(null);
// //   const handleDeleteCoverImage = () => setCoverImage(null);

// //   const handleColorSelect = (color: string) => {
// //     setSelectedColor(color);
// //     setCustomColor("");
// //   };

// //   const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
// //     const color = e.target.value;
// //     setCustomColor(color);
// //     setSelectedColor(color);
// //   };

// //   const handleSectionClick = (sectionId: string, step: number) => {
// //     setActiveSection(sectionId);
// //     setCurrentStep(step);
// //   };

// //   const handleSaveAndContinue = () => {
// //     console.log("Saving customization settings...", {
// //       logo,
// //       coverImage,
// //       brandColor: selectedColor,
// //       businessOperation,
// //       // bankAccounts,
// //       products,
// //     });
// //   };

// //   // Product management functions
// //   const handleAddProduct = () => {
// //     setEditingProduct(null);
// //     setShowProductForm(true);
// //   };

// //   const handleEditProduct = (product: Product) => {
// //     setEditingProduct(product);
// //     setShowProductForm(true);
// //   };

// //   const handleDeleteProduct = (productId: string) => {
// //     setProducts(products.filter((product) => product.id !== productId));
// //   };

// //   const handleSaveProduct = (productData: Omit<Product, "id">) => {
// //     if (editingProduct) {
// //       setProducts(
// //         products.map((product) =>
// //           product.id === editingProduct.id
// //             ? { ...productData, id: editingProduct.id }
// //             : product
// //         )
// //       );
// //     } else {
// //       const newProduct: Product = {
// //         ...productData,
// //         id: Date.now().toString(),
// //       };
// //       setProducts([...products, newProduct]);
// //     }
// //     setShowProductForm(false);
// //     setEditingProduct(null);
// //   };

// //   const toggleProductAvailability = (productId: string) => {
// //     setProducts(
// //       products.map((product) =>
// //         product.id === productId
// //           ? { ...product, isAvailable: !product.isAvailable }
// //           : product
// //       )
// //     );
// //   };

// //   const renderActiveSection = () => {
// //     if (isStoreLoading) {
// //       return (
// //         <div className="flex items-center justify-center min-h-[300px]">
// //           <div className="flex items-center gap-3">
// //             <svg
// //               className="w-6 h-6 animate-spin text-green-600"
// //               xmlns="http://www.w3.org/2000/svg"
// //               fill="none"
// //               viewBox="0 0 24 24"
// //             >
// //               <circle
// //                 className="opacity-25"
// //                 cx="12"
// //                 cy="12"
// //                 r="10"
// //                 stroke="currentColor"
// //                 strokeWidth="4"
// //               />
// //               <path
// //                 className="opacity-75"
// //                 fill="currentColor"
// //                 d="M4 12a8 8 0 018-8v8H4z"
// //               />
// //             </svg>
// //             <span className="text-gray-700 font-medium">
// //               Loading store data...
// //             </span>
// //           </div>
// //         </div>
// //       );
// //     }
// //     if (!outlet?.storeCode) {
// //       console.log("This ran");
// //       return (
// //         <EmptyState
// //           onActivate={() => {
// //             /* handle activation */
// //           }}
// //         />
// //       );
// //     }

// //     switch (activeSection) {
// //       case "basic-setup":
// //         return (
// //           <BasicSetupSection
// //             storeData={storeData}
// //             onContinue={() => handleSectionClick("customization", 2)}
// //           />
// //         );

// //       case "customization":
// //         return (
// //           <CustomizationSection
// //             logo={logo}
// //             coverImage={coverImage}
// //             selectedColor={selectedColor}
// //             customColor={customColor}
// //             onLogoUpload={handleLogoUpload}
// //             onLogoDelete={handleDeleteLogo}
// //             onCoverImageUpload={handleCoverImageUpload}
// //             onCoverImageDelete={handleDeleteCoverImage}
// //             onColorSelect={handleColorSelect}
// //             onCustomColorChange={handleCustomColorChange}
// //             onContinue={() => handleSectionClick("business-operations", 3)}
// //           />
// //         );

// //       case "business-operations":
// //         return (
// //           <BusinessOperationsSection
// //             businessOperation={businessOperation}
// //             bankAccount={null}
// //             onBusinessOperationChange={setBusinessOperation}
// //             onBankAccountChange={() => {}}
// //             onBack={() => handleSectionClick("customization", 2)}
// //             onContinue={() => handleSectionClick("products", 4)}
// //           />
// //         );

// //       case "products":
// //         return (
// //           <ProductsSection
// //             products={products}
// //             onAddProduct={handleAddProduct}
// //             onEditProduct={handleEditProduct}
// //             onDeleteProduct={handleDeleteProduct}
// //             onToggleAvailability={toggleProductAvailability}
// //             onBack={() => handleSectionClick("business-operations", 3)}
// //             onComplete={handleSaveAndContinue}
// //           />
// //         );

// //       default:
// //         return null;
// //     }
// //   };

// //   return (
// //     <div className="min-h-screen bg-gray-50">
// //       <div className="px-5 py-6">
// //         {/* Header */}
// //         {/* <div className="mb-8">
// //           <h1 className="text-2xl font-bold text-gray-900 mb-2">
// //             General Settings
// //           </h1>
// //           <p className="text-[#737373]">
// //             Manage your business and personal preferences here
// //           </p>
// //         </div> */}

// //         <hr className="border border-[#E7E7E7] mb-8" />

// //         {/* <div className="flex gap-8">
// //           <Sidebar
// //             activeSection={activeSection}
// //             onSectionClick={handleSectionClick}
// //           />

// //           <div className="flex-1 bg-white rounded-lg border border-gray-200 p-8">
// //             {renderActiveSection()}
// //           </div>
// //         </div> */}
// //         <div className="flex gap-8 h-[calc(100vh-130px)]">
// //           <Sidebar
// //             activeSection={activeSection}
// //             onSectionClick={handleSectionClick}
// //           />

// //           <div className="flex-1 bg-white rounded-lg border border-gray-200 p-8 overflow-y-auto h-full">
// //             {renderActiveSection()}
// //           </div>
// //         </div>
// //       </div>

// //       {/* Product Form Modal */}
// //       {showProductForm && (
// //         <ProductForm
// //           product={editingProduct}
// //           onSave={handleSaveProduct}
// //           onCancel={() => {
// //             setShowProductForm(false);
// //             setEditingProduct(null);
// //           }}
// //         />
// //       )}
// //     </div>
// //   );
// // }

// /* eslint-disable @typescript-eslint/no-unused-vars */
// "use client";
// import React, { useEffect, useState } from "react";
// import { useAppSelector } from "@/hooks/redux-hooks";
// import { BankAccount, BusinessOperation, Product } from "./components/types";

// import BasicSetupSection from "./components/basic-setup-section";
// import CustomizationSection from "./components/customization-section";
// import EmptyState from "./components/empty";
// import ProductForm from "./components/product-form";
// import BusinessOperationsSection from "./components/business-operation-section";
// import ProductsSection from "./components/product-section";
// import Sidebar from "./components/sidebar";
// import { useLazyGetStoreDetailsQuery } from "@/redux/store/store-setting";

// export default function CustomizationPage() {
//   const outlet = useAppSelector((state) => state.business.outlet);
//   const [getStoreDetails, { data: storeData, isLoading: isStoreLoading }] =
//     useLazyGetStoreDetailsQuery();

//   const [currentStep, setCurrentStep] = useState(1);
//   const [activeSection, setActiveSection] = useState("basic-setup");

//   // State management
//   const [logo, setLogo] = useState<string | null>(null);
//   const [coverImage, setCoverImage] = useState<string | null>(null);
//   const [selectedColor, setSelectedColor] = useState("#15BA5C");
//   const [customColor, setCustomColor] = useState("");
//   const [businessOperation, setBusinessOperation] = useState<BusinessOperation>(
//     {
//       delivery: true,
//       pickup: false,
//     }
//   );
//   const [products, setProducts] = useState<Product[]>([]);
//   const [showProductForm, setShowProductForm] = useState(false);
//   const [editingProduct, setEditingProduct] = useState<Product | null>(null);

//   // Fetch store details when outlet changes
//   useEffect(() => {
//     if (outlet?.id) {
//       getStoreDetails(outlet.id);
//     }
//   }, [outlet?.id, getStoreDetails]);

//   const handleLogoUpload = (logoUrl: string) => {
//     setLogo(logoUrl);
//   };

//   const handleCoverImageUpload = (coverUrl: string) => {
//     setCoverImage(coverUrl);
//   };

//   const handleDeleteLogo = () => setLogo(null);
//   const handleDeleteCoverImage = () => setCoverImage(null);

//   const handleColorSelect = (color: string) => {
//     setSelectedColor(color);
//     setCustomColor("");
//   };

//   const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const color = e.target.value;
//     setCustomColor(color);
//     setSelectedColor(color);
//   };

//   const handleSectionClick = (sectionId: string, step: number) => {
//     setActiveSection(sectionId);
//     setCurrentStep(step);
//   };

//   const handleSaveAndContinue = () => {
//     console.log("Saving customization settings...", {
//       logo,
//       coverImage,
//       brandColor: selectedColor,
//       businessOperation,
//       products,
//     });
//   };

//   // Product management functions
//   const handleAddProduct = () => {
//     setEditingProduct(null);
//     setShowProductForm(true);
//   };

//   const handleEditProduct = (product: Product) => {
//     setEditingProduct(product);
//     setShowProductForm(true);
//   };

//   const handleDeleteProduct = (productId: string) => {
//     setProducts(products.filter((product) => product.id !== productId));
//   };

//   const handleSaveProduct = (productData: Omit<Product, "id">) => {
//     if (editingProduct) {
//       setProducts(
//         products.map((product) =>
//           product.id === editingProduct.id
//             ? { ...productData, id: editingProduct.id }
//             : product
//         )
//       );
//     } else {
//       const newProduct: Product = {
//         ...productData,
//         id: Date.now().toString(),
//       };
//       setProducts([...products, newProduct]);
//     }
//     setShowProductForm(false);
//     setEditingProduct(null);
//   };

//   const toggleProductAvailability = (productId: string) => {
//     setProducts(
//       products.map((product) =>
//         product.id === productId
//           ? { ...product, isAvailable: !product.isAvailable }
//           : product
//       )
//     );
//   };

//   // Handler for after storefront activation
//   const handleStorefrontActivated = () => {
//     // Refetch store details to get the updated storeCode
//     if (outlet?.id) {
//       getStoreDetails(outlet.id);
//     }
//   };

//   const hasStorefrontAccess = Boolean(
//     outlet?.storeCode || storeData?.data?.customSubDomain
//   );

//   const renderActiveSection = () => {
//     // Show loading state
//     if (isStoreLoading) {
//       return (
//         <div className="flex items-center justify-center min-h-[300px]">
//           <div className="flex items-center gap-3">
//             <svg
//               className="w-6 h-6 animate-spin text-green-600"
//               xmlns="http://www.w3.org/2000/svg"
//               fill="none"
//               viewBox="0 0 24 24"
//             >
//               <circle
//                 className="opacity-25"
//                 cx="12"
//                 cy="12"
//                 r="10"
//                 stroke="currentColor"
//                 strokeWidth="4"
//               />
//               <path
//                 className="opacity-75"
//                 fill="currentColor"
//                 d="M4 12a8 8 0 018-8v8H4z"
//               />
//             </svg>
//             <span className="text-gray-700 font-medium">
//               Loading store data...
//             </span>
//           </div>
//         </div>
//       );
//     }

//     // Show EmptyState only if no outlet is selected OR outlet doesn't have storeCode
//     if (!outlet) {
//       return <EmptyState onActivate={handleStorefrontActivated} />;
//     }

//     // If outlet exists but no storeCode, show EmptyState for THIS outlet
//     if (!hasStorefrontAccess) {
//       return <EmptyState onActivate={handleStorefrontActivated} />;
//     }

//     // Outlet has storefront, show the sections
//     switch (activeSection) {
//       case "basic-setup":
//         return (
//           <BasicSetupSection
//             storeData={storeData}
//             onContinue={() => handleSectionClick("customization", 2)}
//           />
//         );

//       case "customization":
//         return (
//           <CustomizationSection
//             logo={logo}
//             coverImage={coverImage}
//             selectedColor={selectedColor}
//             customColor={customColor}
//             onLogoUpload={handleLogoUpload}
//             onLogoDelete={handleDeleteLogo}
//             onCoverImageUpload={handleCoverImageUpload}
//             onCoverImageDelete={handleDeleteCoverImage}
//             onColorSelect={handleColorSelect}
//             onCustomColorChange={handleCustomColorChange}
//             onContinue={() => handleSectionClick("business-operations", 3)}
//           />
//         );

//       case "business-operations":
//         return (
//           <BusinessOperationsSection
//             businessOperation={businessOperation}
//             bankAccount={null}
//             onBusinessOperationChange={setBusinessOperation}
//             onBankAccountChange={() => {}}
//             onBack={() => handleSectionClick("customization", 2)}
//             onContinue={() => handleSectionClick("products", 4)}
//           />
//         );

//       case "products":
//         return (
//           <ProductsSection
//             products={products}
//             onAddProduct={handleAddProduct}
//             onEditProduct={handleEditProduct}
//             onDeleteProduct={handleDeleteProduct}
//             onToggleAvailability={toggleProductAvailability}
//             onBack={() => handleSectionClick("business-operations", 3)}
//             onComplete={handleSaveAndContinue}
//           />
//         );

//       default:
//         return null;
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="px-5 py-6">
//         <hr className="border border-[#E7E7E7] mb-8" />

//         <div className="flex gap-8 h-[calc(100vh-130px)]">
//           <Sidebar
//             activeSection={activeSection}
//             onSectionClick={handleSectionClick}
//             isStorefrontActive={hasStorefrontAccess}
//           />

//           <div className="flex-1 bg-white rounded-lg border border-gray-200 p-8 overflow-y-auto h-full">
//             {renderActiveSection()}
//           </div>
//         </div>
//       </div>

//       {/* Product Form Modal */}
//       {showProductForm && (
//         <ProductForm
//           product={editingProduct}
//           onSave={handleSaveProduct}
//           onCancel={() => {
//             setShowProductForm(false);
//             setEditingProduct(null);
//           }}
//         />
//       )}
//     </div>
//   );
// }
