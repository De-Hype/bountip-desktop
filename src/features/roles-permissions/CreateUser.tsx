import { useEffect, useMemo, useState } from "react";
import useActionMenuStore from "@/stores/rolesAndPermissionStore";
import { useBusinessStore } from "@/stores/useBusinessStore";
import { Dropdown, type DropdownOption } from "@/features/settings/ui/Dropdown";
import { PhoneInput } from "@/features/settings/ui/PhoneInput";
import {
  getPhoneCountries,
  type PhoneCountry,
} from "@/utils/getPhoneCountries";
import { z } from "zod";
import useToastStore from "@/stores/toastStore";

interface CreateUserProps {
  onSuccess?: () => void | Promise<void>;
}

const CreateUser = ({ onSuccess }: CreateUserProps) => {
  const [activeTab, setActiveTab] = useState<"profile" | "permissions">(
    "profile",
  );
  const { closeCreateUser } = useActionMenuStore();
  const { selectedOutletId } = useBusinessStore();
  const { showToast } = useToastStore();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const phoneCountries = useMemo(() => getPhoneCountries(), []);
  const [selectedCountry, setSelectedCountry] = useState<
    PhoneCountry | undefined
  >(() => phoneCountries.find((c) => c.isoCode === "NG") || phoneCountries[0]);

  const [dbRoles, setDbRoles] = useState<any[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  useEffect(() => {
    const fetchRoles = async () => {
      setIsLoadingRoles(true);
      try {
        const rolesData = await (window as any).electronAPI.getBusinessRoles(
          selectedOutletId,
        );
        setDbRoles(rolesData || []);
      } catch {
        setDbRoles([]);
      } finally {
        setIsLoadingRoles(false);
      }
    };

    fetchRoles();
  }, [selectedOutletId]);

  const roleOptions: DropdownOption[] = useMemo(() => {
    const options: DropdownOption[] = dbRoles
      .map((role) => ({
        value: role.name,
        label: role.name,
        id: role.id,
      }))
      .filter((opt) => Boolean(opt.value));

    if (!options.some((opt) => opt.value === "Unassigned")) {
      options.push({ value: "Unassigned", label: "Unassigned" });
    }

    return options;
  }, [dbRoles]);

  const schema = useMemo(
    () =>
      z.object({
        firstName: z.string().trim().min(1, "First name is required"),
        lastName: z.string().trim().min(1, "Last name is required"),
        email: z
          .string()
          .trim()
          .min(1, "Email address is required")
          .refine(
            (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            "Enter a valid email address",
          ),
        roleName: z.string().trim().min(1, "Role is required"),
      }),
    [],
  );

  const validation = useMemo(
    () =>
      schema.safeParse({
        firstName,
        lastName,
        email,
        roleName: selectedRole,
      }),
    [email, firstName, lastName, schema, selectedRole],
  );

  const errors = useMemo(() => {
    const empty = { firstName: "", lastName: "", email: "", roleName: "" };
    if (validation.success) return empty;

    const next = { ...empty };
    for (const issue of validation.error.issues) {
      const key = issue.path[0];
      if (
        typeof key === "string" &&
        key in next &&
        !next[key as keyof typeof next]
      ) {
        next[key as keyof typeof next] = issue.message;
      }
    }
    return next;
  }, [validation]);

  const handleCreate = async () => {
    setSubmitAttempted(true);
    if (!validation.success) return;
    if (!selectedOutletId) {
      showToast("error", "Error", "Select an outlet to continue");
      return;
    }

    try {
      setIsCreating(true);
      await (window as any).electronAPI.upsertBusinessUser({
        outletId: selectedOutletId,
        firstName: validation.data.firstName,
        lastName: validation.data.lastName,
        email: validation.data.email,
        roleName: validation.data.roleName,
      });
      await onSuccess?.();
      showToast("success", "Success", "User created successfully");
      closeCreateUser();
    } catch {
      showToast("error", "Error", "Failed to create user");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <section className="space-y-8">
      <div className="flex justify-center">
        <div className="inline-flex w-full  rounded-[8px] border border-[#E5E7EB] bg-[#7878801F] text-sm font-medium text-[#4B5563] overflow-hidden">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`flex-1 px-6 py-3 ${
              activeTab === "profile"
                ? "bg-white text-[#000000]"
                : "bg-transparent text-[#898989]"
            }`}
          >
            Profile information
          </button>
        </div>
      </div>

      {activeTab === "profile" && (
        <>
          {/* <div className="flex flex-col items-center gap-3">
            <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-[#F3F4F6] border-4 border-[#15BA5C33]">
              <div className="w-20 h-20 rounded-full bg-[#E5E7EB] flex items-center justify-center text-[32px] text-[#9CA3AF]">
                <span>👤</span>
              </div>
              <button
                type="button"
                className="absolute bottom-2 -right-2 w-7 h-7 rounded-full bg-[#15BA5C] flex items-center justify-center"
                aria-label="Upload photo"
              >
                <Camera className="w-3.5 h-3.5 rounded-sm text-white" />
              </button>
            </div>
            <button
              type="button"
              className="text-sm font-medium text-[#1C1B20]"
            >
              Upload photo
            </button>
          </div> */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">
                First Name
              </label>
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-[10px] bg-[#FAFAFC] border border-[#D1D1D1] px-4.5 py-2.5 text-sm text-[#111827] placeholder-[#A6A6A6] outline-none focus:border-[#15BA5C] focus:ring-1 focus:ring-[#15BA5C]"
              />
              {submitAttempted && errors.firstName && (
                <span className="mt-1 block text-xs text-red-500">
                  {errors.firstName}
                </span>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">
                Last Name
              </label>
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-[10px] bg-[#FAFAFC] border border-[#D1D1D1] px-4.5 py-2.5 text-sm text-[#111827] placeholder-[#A6A6A6] outline-none focus:border-[#15BA5C] focus:ring-1 focus:ring-[#15BA5C]"
              />
              {submitAttempted && errors.lastName && (
                <span className="mt-1 block text-xs text-red-500">
                  {errors.lastName}
                </span>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full rounded-[10px] bg-[#FAFAFC] border px-4.5 py-2.5 text-sm text-[#111827] placeholder-[#A6A6A6] outline-none focus:ring-1 ${
                  submitAttempted && errors.email
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-[#D1D1D1] focus:border-[#15BA5C] focus:ring-[#15BA5C]"
                }`}
              />
              {submitAttempted && errors.email && (
                <span className="mt-1 block text-xs text-red-500">
                  {errors.email}
                </span>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">
                Phone Number
              </label>
              <PhoneInput
                value={phoneNumber}
                onChange={setPhoneNumber}
                selectedCountry={selectedCountry}
                onCountryChange={setSelectedCountry}
                placeholder="Enter phone number"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">
                Set User Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Enter a password"
                  className="w-full rounded-[10px] bg-[#FAFAFC] border border-[#D1D1D1] px-4.5 py-2.5 text-sm text-[#111827] placeholder-[#A6A6A6] outline-none focus:border-[#15BA5C] focus:ring-1 focus:ring-[#15BA5C]"
                />
                {/* <span className="absolute inset-y-0 right-3 flex items-center text-[#9CA3AF] text-xs">
                  👁
                </span> */}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">
                Confirm User Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Enter a password"
                  className="w-full rounded-[10px] bg-[#FAFAFC] border border-[#D1D1D1] px-4.5 py-2.5 text-sm text-[#111827] placeholder-[#A6A6A6] outline-none focus:border-[#15BA5C] focus:ring-1 focus:ring-[#15BA5C]"
                />
                {/* <span className="absolute inset-y-0 right-3 flex items-center text-[#9CA3AF] text-xs">
                  👁
                </span> */}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">
                Role Assignment
              </label>
              <Dropdown
                options={roleOptions}
                selectedValue={selectedRole}
                onChange={(value) => setSelectedRole(value)}
                placeholder="Select Role"
                searchPlaceholder="Search roles..."
                loading={isLoadingRoles}
                className="w-full"
              />
              {submitAttempted && errors.roleName && (
                <span className="mt-1 block text-xs text-red-500">
                  {errors.roleName}
                </span>
              )}
            </div>
          </div>

          <div className="w-full flex items-center justify-between gap-4  py-4  ">
            <button
              type="button"
              onClick={closeCreateUser}
              className="w-full cursor-pointer items-center justify-center rounded-[10px] px-6 py-2.5 text-sm font-medium text-[#111827] bg-[#E5E7EB] hover:bg-[#D1D5DB]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={isCreating || !validation.success}
              className="w-full items-center justify-center rounded-[10px] px-8 py-2.5 text-sm font-medium text-white bg-[#15BA5C] hover:bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isCreating ? "Creating..." : "Create"}
            </button>
          </div>
        </>
      )}

      {/* {activeTab === "permissions" && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h3 className="text-base font-semibold text-[#1C1B20]">Roles</h3>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-stretch rounded-[10px] border border-[#15BA5C] overflow-hidden">
                <button
                  type="button"
                  className="px-4 py-2 text-sm text-[#898989] bg-white"
                >
                  select role
                </button>
                <button
                  type="button"
                  className="px-3 py-2 bg-[#15BA5C] flex items-center justify-center"
                  aria-label="Open roles dropdown"
                >
                  <span className="text-white text-xs">▼</span>
                </button>
              </div>
              <button
                type="button"
                className="inline-flex items-center cursor-pointer gap-2 border border-[#15BA5C] px-4 py-2 rounded-[10px] text-sm font-medium text-[#15BA5C] bg-white hover:bg-green-50"
              >
                <span>＋</span>
                <span>Add New Role</span>
              </button>
              <button
                type="button"
                className="inline-flex items-center cursor-pointer justify-center bg-[#15BA5C] px-6 py-2 text-sm font-medium text-white rounded-[10px] hover:bg-green-600"
              >
                Save
              </button>
            </div>
          </div>

          <RolePagesPermissions />
        </div>
      )} */}
    </section>
  );
};

export default CreateUser;
