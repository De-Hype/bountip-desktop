import { create } from "zustand";

type ActionMenuState = {
  openUserId: number | null;
  openMenu: (id: number) => void;
  closeMenu: () => void;
  toggleMenu: (id: number) => void;
  isCreateRoleOpen: boolean;
  openCreateRole: () => void;
  closeCreateRole: () => void;
  isCreateUserOpen: boolean;
  openCreateUser: () => void;
  closeCreateUser: () => void;
  isAssignPinOpen: boolean;
  openAssignPin: () => void;
  closeAssignPin: () => void;
};

const useActionMenuStore = create<ActionMenuState>((set) => ({
  openUserId: null,
  isCreateRoleOpen: false,
  isCreateUserOpen: false,
  isAssignPinOpen: false,
  openMenu: (id) => set({ openUserId: id }),
  closeMenu: () => set({ openUserId: null }),
  toggleMenu: (id) =>
    set((state) => ({
      openUserId: state.openUserId === id ? null : id,
    })),
  openCreateRole: () =>
    set({
      isCreateRoleOpen: true,
      openUserId: null,
    }),
  closeCreateRole: () =>
    set({
      isCreateRoleOpen: false,
      openUserId: null,
    }),
  openCreateUser: () =>
    set({
      isCreateUserOpen: true,
      openUserId: null,
    }),
  closeCreateUser: () =>
    set({
      isCreateUserOpen: false,
      openUserId: null,
    }),
  openAssignPin: () =>
    set({
      isAssignPinOpen: true,
      openUserId: null,
    }),
  closeAssignPin: () =>
    set({
      isAssignPinOpen: false,
      openUserId: null,
    }),
}));

export default useActionMenuStore;
