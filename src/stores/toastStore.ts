import { create } from "zustand";

type ToastType = "success" | "error" | "warning";

interface ToastState {
  isOpen: boolean;
  type: ToastType;
  heading: string;
  description: string;
  duration: number;
  id: number;
  showToast: (
    type: ToastType,
    heading: string,
    description: string,
    duration?: number,
  ) => void;
  onClose: () => void;
}

const useToastStore = create<ToastState>((set) => ({
  isOpen: false,
  type: "success",
  heading: "",
  description: "",
  duration: 5000,
  id: 0,
  showToast: (type, heading, description, duration = 5000) =>
    set((state) => ({
      isOpen: true,
      type,
      heading,
      description,
      duration,
      id: state.id + 1,
    })),
  onClose: () =>
    set({
      isOpen: false,
      heading: "",
      description: "",
    }),
}));

export default useToastStore;
