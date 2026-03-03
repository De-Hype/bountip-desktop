import { create } from "zustand";

export type BusinessLocation = {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
  isDefault: boolean;
};

export const generateNewLocationId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

type LocationStoreState = {
  locations: BusinessLocation[];
  addLocation: (
    location: Omit<BusinessLocation, "id"> & {
      id?: BusinessLocation["id"];
    },
  ) => void;
  updateLocation: (
    id: BusinessLocation["id"],
    updated: Partial<Omit<BusinessLocation, "id">>,
  ) => void;
  deleteLocation: (id: BusinessLocation["id"]) => void;
  setLocations: (locations: BusinessLocation[]) => void;
};

export const useLocationStore = create<LocationStoreState>((set) => ({
  locations: [],
  addLocation: (location) =>
    set((state: LocationStoreState) => {
      const id = location.id ?? generateNewLocationId();
      const next: BusinessLocation = {
        id,
        name: location.name,
        address: location.address,
        phoneNumber: location.phoneNumber,
        isDefault: location.isDefault ?? false,
      };
      return { locations: [...state.locations, next] };
    }),
  updateLocation: (id, updated) =>
    set((state: LocationStoreState) => ({
      locations: state.locations.map((location) =>
        location.id === id ? { ...location, ...updated } : location,
      ),
    })),
  deleteLocation: (id) =>
    set((state: LocationStoreState) => ({
      locations: state.locations.filter((location) => location.id !== id),
    })),
  setLocations: (locations) => set({ locations }),
}));
