export type AppStage = "home" | "permission" | "setup" | "capturing" | "session-preview" | "editing";
export type LayoutId = "strip-4" | "strip-3" | "grid-4" | "grid-6" | "collage" | "wide" | "polaroid";
export type FilterId = "original" | "bw" | "soft-bw" | "warm" | "film" | "dreamy" | "cool" | "vintage";
export type FrameId = "none" | "classic" | "film" | "polaroid" | "doodle" | "kawaii" | "minimal" | "vintage";
export type Sticker = { id: string; asset: string; x: number; y: number; size: number; rotation: number };
export type BoothState = {
  stage: AppStage;
  layout: LayoutId;
  photoCount: 1 | 2 | 3 | 4 | 6;
  countdown: 3 | 5;
  filter: FilterId;
  frame: FrameId;
  frameColor: string;
  borderWidth: number;
  photos: string[];
  stickers: Sticker[];
};