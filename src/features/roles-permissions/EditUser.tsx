import { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { useBusinessStore } from "@/stores/useBusinessStore";
import { Dropdown, type DropdownOption } from "@/features/settings/ui/Dropdown";
import { z } from "zod";
import useToastStore from "@/stores/toastStore";

interface EditUserProps {
  user: {
    id: string;
    name: string;
    email?: string;
    role: string;
    status: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

const EditUser = ({ user, onClose, onSuccess }: EditUserProps) => {
  const { showToast } = useToastStore();
  const { selectedOutletId } = useBusinessStore();
  const [dbRoles, setDbRoles] = useState<any[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const nameParts = user.name.split(" ");
  const [firstName, setFirstName] = useState(nameParts[0] || "");
  const [lastName, setLastName] = useState(nameParts.slice(1).join(" ") || "");
  const [email, setEmail] = useState(user.email || "");
  const [selectedRole, setSelectedRole] = useState(user.role);

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
    const empty = {
      firstName: "",
      lastName: "",
      email: "",
      roleName: "",
    };
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

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingRoles(true);
      try {
        const rolesData = await (window as any).electronAPI.getBusinessRoles(
          selectedOutletId,
        );
        setDbRoles(rolesData || []);

        const userData = await (window as any).electronAPI.getUserById(user.id);
        if (userData) {
          const resolvedEmail =
            userData.email ||
            userData.emailAddress ||
            userData.userEmail ||
            userData.username ||
            userData.user?.email ||
            userData.user?.emailAddress ||
            userData.user?.userEmail ||
            userData.data?.email ||
            userData.data?.emailAddress ||
            userData.data?.userEmail ||
            user.email ||
            "";

          setEmail(resolvedEmail);
          const parts = (userData.fullName || "").split(" ");
          setFirstName(parts[0] || "");
          setLastName(parts.slice(1).join(" ") || "");
          setSelectedRole(userData.roleName || user.role);
        } else {
          setEmail(user.email || "");
          setSelectedRole(user.role);
        }
      } catch (err) {
        console.error("Failed to load edit user data:", err);
      } finally {
        setIsLoadingRoles(false);
      }
    };

    fetchData();
  }, [user.id, selectedOutletId, user.email, user.role]);

  const handleSave = async () => {
    setSubmitAttempted(true);
    if (!validation.success) return;
    if (!selectedOutletId) return;
    try {
      setIsSaving(true);
      await (window as any).electronAPI.upsertBusinessUser({
        userId: user.id,
        outletId: selectedOutletId,
        firstName: validation.data.firstName,
        lastName: validation.data.lastName,
        email: validation.data.email,
        roleName: validation.data.roleName,
      });
      onSuccess();
      showToast("success", "Success", "User updated successfully");
      onClose();
    } catch (err) {
      console.error("Failed to update user:", err);
      showToast("error", "Error", "Failed to update user");
    } finally {
      setIsSaving(false);
    }
  };

  const roleOptions: DropdownOption[] = useMemo(() => {
    const options: DropdownOption[] = dbRoles
      .map((role) => ({
        value: role.name,
        label: role.name,
        id: role.id,
      }))
      .filter((opt) => Boolean(opt.value));

    if (
      selectedRole &&
      !options.some((opt) => opt.value === selectedRole) &&
      selectedRole !== "Unassigned"
    ) {
      options.unshift({ value: selectedRole, label: selectedRole });
    }

    if (!options.some((opt) => opt.value === "Unassigned")) {
      options.push({ value: "Unassigned", label: "Unassigned" });
    }

    return options;
  }, [dbRoles, selectedRole]);

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl bg-white rounded-[20px] shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-6 pb-4">
          <h2 className="text-[20px] font-bold text-[#111827]">Edit User</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-6">
          {/* First Name + Last Name */}
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#111827]">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={`w-full rounded-[10px] border bg-[#F9FAFB] px-4 py-3 text-sm text-[#374151] outline-none focus:ring-1 transition ${
                  submitAttempted && errors.firstName
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-[#E5E7EB] focus:border-[#15BA5C] focus:ring-[#15BA5C]"
                }`}
              />
              {submitAttempted && errors.firstName && (
                <span className="text-xs text-red-500">{errors.firstName}</span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#111827]">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={`w-full rounded-[10px] border bg-[#F9FAFB] px-4 py-3 text-sm text-[#374151] outline-none focus:ring-1 transition ${
                  submitAttempted && errors.lastName
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-[#E5E7EB] focus:border-[#15BA5C] focus:ring-[#15BA5C]"
                }`}
              />
              {submitAttempted && errors.lastName && (
                <span className="text-xs text-red-500">{errors.lastName}</span>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#111827]">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full rounded-[10px] border bg-[#F9FAFB] px-4 py-3 text-sm text-[#374151] outline-none focus:ring-1 transition ${
                submitAttempted && errors.email
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-[#E5E7EB] focus:border-[#15BA5C] focus:ring-[#15BA5C]"
              }`}
            />
            {submitAttempted && errors.email && (
              <span className="text-xs text-red-500">{errors.email}</span>
            )}
          </div>

          {/* Role Assignment */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#111827]">
              Role Assignment
            </label>
            <Dropdown
              options={roleOptions}
              selectedValue={selectedRole}
              onChange={(value) => setSelectedRole(value)}
              placeholder="Select role"
              searchPlaceholder="Search roles..."
              loading={isLoadingRoles}
              className="w-full"
            />
            {submitAttempted && errors.roleName && (
              <span className="text-xs text-red-500">{errors.roleName}</span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="grid grid-cols-2 gap-4 px-8 py-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-[12px] bg-[#F3F4F6] px-6 py-3 text-sm font-medium text-[#374151] hover:bg-[#E5E7EB] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !validation.success}
            className="w-full cursor-pointer rounded-[12px] bg-[#15BA5C] px-6 py-3 text-sm font-medium text-white hover:bg-green-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditUser;
