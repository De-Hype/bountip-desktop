type DeleteConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productName: string;
};

const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  productName,
}: DeleteConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-[24px] bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#FEE2E2]">
            <div className="flex flex-col items-center">
              <span className="text-[24px] font-bold text-[#EF4444]">↑</span>
              <span className="mt-[-8px] text-[24px] font-bold text-[#EF4444]">
                .
              </span>
            </div>
          </div>

          <h2 className="text-[22px] font-bold text-[#1C1B20]">
            Delete Product
          </h2>

          <p className="mt-4 text-[16px] text-[#6B7280] leading-relaxed">
            Are you sure you want to delete "{productName}"? This action cannot
            be undone.
          </p>

          <div className="mt-10 flex w-full gap-4">
            <button
              type="button"
              onClick={onClose}
              className="h-14 flex-1  cursor-pointer rounded-full border border-[#D1D5DB] text-[16px] font-bold text-[#4B5563] hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="h-14 flex-1 cursor-pointer rounded-full bg-[#E33629] text-[16px] font-bold text-white hover:bg-[#C52B1F] transition-colors"
            >
              Delete Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;