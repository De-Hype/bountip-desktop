import { useState } from "react";

type AddModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (value: string) => void;
  title?: string;
  placeholder?: string;
  buttonText?: string;
  inputLabel?: string;
  validation?: (value: string) => string | null;
};

const AddModal = ({
  isOpen,
  onClose,
  onAdd,
  title = "Add item",
  placeholder = "Enter name",
  buttonText = "Add",
  inputLabel = "Name",
  validation,
}: AddModalProps) => {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;

    if (validation) {
      const message = validation(trimmed);
      if (message) {
        setError(message);
        return;
      }
    }

    onAdd(trimmed);
    setValue("");
    setError(null);
  };

  return (
    <div className="relative w-full max-w-md rounded-[24px] bg-white shadow-2xl">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F4F6] text-[#111827]"
        aria-label="Close add item modal"
        title="Close"
      >
        <span className="text-lg leading-none">×</span>
      </button>

      <div className="px-8 pt-8 pb-6">
        <h2 className="text-lg font-semibold text-[#1C1B20]">{title}</h2>

        <div className="mt-6 space-y-2">
          {inputLabel && (
            <p className="text-sm font-medium text-[#111827]">{inputLabel}</p>
          )}
          <input
            type="text"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              if (error) {
                setError(null);
              }
            }}
            placeholder={placeholder}
            className="w-full rounded-[12px] border border-[#E5E7EB] bg-[#FAFAFC] px-4 py-3 text-sm text-[#111827] placeholder-[#A6A6A6] outline-none focus:border-[#15BA5C] focus:ring-1 focus:ring-[#15BA5C]"
          />
          {error && (
            <p className="text-xs text-[#EF4444]">
              {error}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-[12px] bg-[#15BA5C] px-4 text-sm font-medium text-white hover:bg-[#13A652]"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default AddModal;

