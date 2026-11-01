import { create } from "zustand";
import { LibraryFilters, LibrarySortBy } from "./types";

interface LibraryStoreState {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  toggleOpen: () => void;

  selectedIds: Set<string>;
  setSelectedIds: (ids: Set<string>) => void;
  toggleSelect: (id: string) => void;
  selectRange: (allIds: string[], targetId: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;

  filters: LibraryFilters;
  setFilter: <K extends keyof LibraryFilters>(
    key: K,
    val: LibraryFilters[K],
  ) => void;
  clearFilter: (key: keyof LibraryFilters) => void;
  resetFilters: () => void;

  sortBy: LibrarySortBy;
  setSortBy: (sortBy: LibrarySortBy) => void;
}

const DEFAULT_FILTERS: LibraryFilters = {
  query: "",
  type: "all",
  dateRange: "all",
  colorTolerance: 0.18,
};

export const useLibraryStore = create<LibraryStoreState>((set, get) => ({
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),

  selectedIds: new Set<string>(),
  setSelectedIds: (selectedIds) => set({ selectedIds }),
  toggleSelect: (id) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedIds: next };
    }),
  selectRange: (allIds, targetId) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      const lastSelected = Array.from(state.selectedIds).pop();
      if (!lastSelected) {
        next.add(targetId);
        return { selectedIds: next };
      }
      const idxA = allIds.indexOf(lastSelected);
      const idxB = allIds.indexOf(targetId);
      if (idxA === -1 || idxB === -1) {
        next.add(targetId);
        return { selectedIds: next };
      }
      const start = Math.min(idxA, idxB);
      const end = Math.max(idxA, idxB);
      for (let i = start; i <= end; i++) {
        next.add(allIds[i]);
      }
      return { selectedIds: next };
    }),
  selectAll: (ids) => set({ selectedIds: new Set(ids) }),
  clearSelection: () => set({ selectedIds: new Set() }),

  filters: DEFAULT_FILTERS,
  setFilter: (key, val) =>
    set((state) => ({
      filters: { ...state.filters, [key]: val },
    })),
  clearFilter: (key) =>
    set((state) => {
      const next = { ...state.filters };
      delete next[key];
      return { filters: next };
    }),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  sortBy: "newest",
  setSortBy: (sortBy) => set({ sortBy }),
}));
