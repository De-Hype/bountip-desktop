import NotFoundAssests from "@/assets/images/not-found";
import { Plus } from "lucide-react";

const NotFound = () => {
  return (
    <section className="w-full flex items-center justify-center">
      <div className="flex flex-col items-center justify-center">
        <div className="w-[200px] h-[200px]">
          <img src={NotFoundAssests.RoleNotFound} alt="Not Found" />
        </div>
        <div className="w-full text-center flex flex-col gap-[5px]">
          <h3 className="text-[#1C1B20] font-bold text-[1.25rem]">No roles Added</h3>
          <p className="text-[#737373] text-[1rem]">
            Click on the “Add a New Role” button to create your first Role{" "}
          </p>
          <button
            type="button"
            className="w-[595px] bg-[#15BA5C] font-bold mt-[26px] text-white flex w-full items-center justify-center py-[10px] cursor-pointer rounded-[8px]"
          >
            <Plus className="w-[20px] h-[20px] mr-[8px]" />
            <span className="">Add a new Role</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default NotFound;
