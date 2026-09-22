import { persist } from "zustand/middleware";
import { create, mmkvJSONStateStorage } from "./stateStorage";

type State = {
  selectedTeamId: string | null;
};

type Actions = {
  setSelectedTeamId: (id: string) => void;
  clearSelectedTeamId: () => void;
};

const initialState: State = {
  selectedTeamId: null,
};

export const useTeamStore = create<State & Actions>()(
  persist(
    (set) => ({
      ...initialState,
      setSelectedTeamId: (id) => set({ selectedTeamId: id }),
      clearSelectedTeamId: () => set({ selectedTeamId: null }),
    }),
    {
      name: "team-store",
      storage: mmkvJSONStateStorage,
      partialize: (state) => ({ selectedTeamId: state.selectedTeamId }),
    },
  ),
);
