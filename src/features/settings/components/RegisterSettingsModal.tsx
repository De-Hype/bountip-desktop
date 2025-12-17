// /* eslint-disable @typescript-eslint/no-unused-vars */
// "use client";
// import React, { useState, useEffect } from "react";
// import { Check, Loader2, Trash2 } from "lucide-react";
// 
// import { Modal } from "../ui/Modal";
// // import { Input } from "../ui/Input";
// import SettingFiles from "@/assets/icons/settings";

// interface RegisterSettingsModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSuccess: (heading: string, description: string) => void;
//   onError: (heading: string, description: string) => void;
// }

// interface Register {
//   id: string;
//   registerId: string;
//   name: string;
//   location: string;
// }

// export const RegisterSettingsModal: React.FC<RegisterSettingsModalProps> = ({
//   isOpen,
//   onClose,
//   onSuccess,
//   onError,
// }) => {
//   const [registers, setRegisters] = useState<Register[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [editingRegisters, setEditingRegisters] = useState<Record<string, boolean>>({});

//   // Load registers from API (placeholder)
//   useEffect(() => {
//     if (isOpen) {
//       loadRegisters();
//     }
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [isOpen]);

//   const loadRegisters = async () => {
//     setLoading(true);
//     try {
//       // TODO: Replace with actual API call
//       // const response = await fetch('/api/registers');
//       // const data = await response.json();
//       // setRegisters(data);
      
//       // Mock data for now
//       const mockRegisters: Register[] = [];
//       setRegisters(mockRegisters);
//     } catch (error) {
//       onError("Loading Failed", "Unable to load registers");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleAddRegister = () => {
//     const newRegister: Register = {
//       id: `temp-${Date.now()}`,
//       registerId: "33432",
//       name: "",
//       location: "",
//     };
//     setRegisters([...registers, newRegister]);
//     setEditingRegisters({ ...editingRegisters, [newRegister.id]: true });
//   };

//   const handleUpdateRegister = (id: string, field: keyof Register, value: string) => {
//     setRegisters(
//       registers.map((reg) =>
//         reg.id === id ? { ...reg, [field]: value } : reg
//       )
//     );
//   };

//   const handleSaveRegister = async (id: string) => {
//     const register = registers.find((r) => r.id === id);
//     if (!register) return;

//     if (!register.name.trim() || !register.location.trim()) {
//       onError("Validation Error", "Please fill in all required fields");
//       return;
//     }

//     setLoading(true);
//     try {
//       // TODO: Replace with actual API call
//       // if (id.startsWith('temp-')) {
//       //   await fetch('/api/registers', {
//       //     method: 'POST',
//       //     body: JSON.stringify(register)
//       //   });
//       // } else {
//       //   await fetch(`/api/registers/${id}`, {
//       //     method: 'PUT',
//       //     body: JSON.stringify(register)
//       //   });
//       // }
      
//       const updatedRegisters = { ...editingRegisters };
//       delete updatedRegisters[id];
//       setEditingRegisters(updatedRegisters);
      
//       onSuccess("Register Saved", "Register has been saved successfully");
//     } catch (error) {
//       onError("Save Failed", "Unable to save register");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleRemoveRegister = async (id: string) => {
//     setLoading(true);
//     try {
//       // TODO: Replace with actual API call
//       // await fetch(`/api/registers/${id}`, {
//       //   method: 'DELETE'
//       // });
      
//       setRegisters(registers.filter((reg) => reg.id !== id));
//       onSuccess("Register Removed", "Register has been removed successfully");
//     } catch (error) {
//       onError("Remove Failed", "Unable to remove register");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const EmptyState = () => (
//     <div className="flex flex-col items-center justify-center py-12">
//       <div className="w-full max-w-md mx-auto mb-8">
//         <Image
//           src="/images/no-register.svg"
//           alt="No registers"
//           width={400}
//           height={300}
//           className="w-full h-auto"
//         />
//       </div>
      
//       <h3 className="text-xl font-semibold text-gray-900 mb-2">
//         No Register Created
//       </h3>
      
//       <p className="text-gray-500 text-center mb-6 max-w-md">
//         You have not created a register at the moment click on the button below to create a register
//       </p>
      
//       <button
//         onClick={handleAddRegister}
//         disabled={loading}
//         className="w-full max-w-md py-3 px-6 bg-[#15BA5C] hover:bg-[#13A652] text-white font-medium rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
//       >
//         Create a Register
//       </button>
//     </div>
//   );

//   const RegisterList = () => (
//     <div className="space-y-4">
//       {/* Header Row */}
//       <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700 pb-2">
//         <div className="col-span-3">Register ID</div>
//         <div className="col-span-3">Name</div>
//         <div className="col-span-3">Location</div>
//         <div className="col-span-3">Actions</div>
//       </div>

//       {/* Register Rows */}
//       {registers.map((register) => (
//         <div key={register.id} className="grid grid-cols-12 gap-4 items-center">
//           {/* Register ID */}
//           <div className="col-span-3">
//             <input
//               type="text"
//               value={register.registerId}
//               disabled
//               className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
//             />
//           </div>

//           {/* Name */}
//           <div className="col-span-3">
//             <input
//               type="text"
//               value={register.name}
//               onChange={(e) =>
//                 handleUpdateRegister(register.id, "name", e.target.value)
//               }
//               placeholder="New Name"
//               className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BA5C] transition-colors"
//             />
//           </div>

//           {/* Location */}
//           <div className="col-span-3">
//             <input
//               type="text"
//               value={register.location}
//               onChange={(e) =>
//                 handleUpdateRegister(register.id, "location", e.target.value)
//               }
//               placeholder="New Location"
//               className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BA5C] transition-colors"
//             />
//           </div>

//           {/* Actions */}
//           <div className="col-span-3 flex gap-2">
//             <button
//               onClick={() => handleSaveRegister(register.id)}
//               disabled={loading}
//               className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#15BA5C] hover:bg-[#13A652] text-white font-medium rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
//             >
//               <Check className="w-4 h-4" />
//               Save
//             </button>
            
//             <button
//               onClick={() => handleRemoveRegister(register.id)}
//               disabled={loading}
//               className="px-4 py-2.5 border border-red-500 text-red-500 hover:bg-red-50 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
//             >
//               <Trash2 className="w-4 h-4" />
//               Remove
//             </button>
//           </div>
//         </div>
//       ))}

//       {/* Add Register Button */}
//       <button
//         onClick={handleAddRegister}
//         disabled={loading}
//         className="w-fit px-6 py-3 bg-[#15BA5C] hover:bg-[#13A652] text-white font-medium rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
//       >
//         Add Register
//       </button>
//     </div>
//   );

//   return (
//     <Modal
//       size="lg"
//       subtitle="add the registers available in your business"
//       image={SettingFiles.BusinessIcon}
//       isOpen={isOpen}
//       onClose={onClose}
//       title="Register"
//     >
//       {loading && registers.length === 0 ? (
//         <div className="flex items-center justify-center py-12">
//           <Loader2 className="w-8 h-8 animate-spin text-[#15BA5C]" />
//           <span className="ml-3 text-gray-600">Loading registers...</span>
//         </div>
//       ) : registers.length === 0 ? (
//         <EmptyState />
//       ) : (
//         <RegisterList />
//       )}
//     </Modal>
//   );
// };