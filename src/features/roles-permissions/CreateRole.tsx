import RolePagesPermissions from "./RolePagesPermissions";

const CreateRole = () => {
  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-base font-medium text-[#1C1B20] mb-2">
            Role Name
          </label>
          <input
            type="text"
            placeholder="Enter role name"
            className="w-full rounded-[10px] bg-[#FAFAFC] border border-[#D1D1D1] px-4.5 py-2.5 text-sm text-[#111827] placeholder-[#A6A6A6] outline-none focus:border-[#15BA5C] focus:ring-1 focus:ring-[#15BA5C]"
          />
        </div>
        <div>
          <label className="block text-base font-medium text-[#1C1B20] mb-2">
            Description
          </label>
          <input
            type="text"
            placeholder="Describe the role"
            className="w-full rounded-[10px] bg-[#FAFAFC] border border-[#D1D1D1] px-4.5 py-2.5 text-sm text-[#111827] placeholder-[#A6A6A6] outline-none focus:border-[#15BA5C] focus:ring-1 focus:ring-[#15BA5C]"
          />
        </div>
      </div>

      <RolePagesPermissions />
    </section>
  );
};

export default CreateRole;
