import { create } from "zustand";
import type { BoothState, Sticker } from "./types";

type Store = BoothState & {
  history: Omit<BoothState, "stage">[];
  setStage: (stage: BoothState["stage"]) => void;
  patch: (next: Partial<BoothState>) => void;
  setPhotos: (photos: string[]) => void;
  addSticker: (sticker: Sticker) => void;
  removeSticker: (id: string) => void;
  undo: () => void;
};

const initial: BoothState = {
  stage: "home", layout: "strip-4", photoCount: 4, countdown: 3, filter: "original",
  frame: "classic", frameColor: "#f19aaa", borderWidth: 2, photos: [], stickers: [],
};

const snap = (state: BoothState): Omit<BoothState, "stage"> => ({
  layout: state.layout, photoCount: state.photoCount, countdown: state.countdown,
  filter: state.filter, frame: state.frame, frameColor: state.frameColor,
  borderWidth: state.borderWidth, photos: state.photos, stickers: state.stickers,
});

export const useBooth = create<Store>((set) => ({
  ...initial,
  history: [],
  setStage: (stage) => set({ stage }),
  patch: (next) => set((state) => ({ ...next, history: [...state.history, snap(state)].slice(-20) })),
  setPhotos: (photos) => set({ photos }),
  addSticker: (sticker) => set((state) => ({ stickers: [...state.stickers, sticker], history: [...state.history, snap(state)].slice(-20) })),
  removeSticker: (id) => set((state) => ({ stickers: state.stickers.filter((item) => item.id !== id), history: [...state.history, snap(state)].slice(-20) })),
  undo: () => set((state) => {
    const previous = state.history.at(-1);
    return previous ? { ...previous, history: state.history.slice(0, -1) } : state;
  }),
}));