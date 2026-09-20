import { frameAssetFor } from "./frameAssets";
import type { BoothState, FilterId, LayoutId } from "../types";

const filterMap: Record<FilterId, string> = {
  original: "none", bw: "grayscale(1) contrast(1.6) brightness(.9)",
  "soft-bw": "grayscale(1) contrast(.72) brightness(1.25)", warm: "sepia(.48) saturate(1.25) contrast(1.12)",
  film: "sepia(.5) saturate(.65) contrast(1.25) brightness(.9)", dreamy: "brightness(1.25) contrast(.62) saturate(1.25)",
  cool: "saturate(1.35) hue-rotate(18deg) contrast(1.12)", vintage: "sepia(.65) saturate(.65) contrast(1.25) brightness(.9)",
};
type Cell = [number, number, number, number];
const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = src; });
const crop = (ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, w: number, h: number) => {
  const sourceRatio = image.width / image.height;
  const targetRatio = w / h;
  let sx = 0, sy = 0, sw = image.width, sh = image.height;
  if (sourceRatio > targetRatio) { sw = image.height * targetRatio; sx = (image.width - sw) / 2; }
  else { sh = image.width / targetRatio; sy = (image.height - sh) / 2; }
  ctx.drawImage(image, sx, sy, sw, sh, x, y, w, h);
};
const isStrip = (layout: LayoutId) => layout === "strip-4" || layout === "strip-3";

// Coordinates use a 400px-wide working canvas. At download scale they become the supplied 120px safe margin and photo sizes.
const cellsFor = (layout: LayoutId): Cell[] => {
  if (layout === "strip-4") return Array.from({ length: 4 }, (_, index) => [40, 40 + index * 260, 320, 240]);
  if (layout === "strip-3") return Array.from({ length: 3 }, (_, index) => [40, 40 + index * 320, 320, 300]);
  if (layout === "grid-4") return [[40, 40, 150, 650 / 3], [210, 40, 150, 650 / 3], [40, 830 / 3, 150, 650 / 3], [210, 830 / 3, 150, 650 / 3]];
  if (layout === "grid-6") return Array.from({ length: 6 }, (_, index) => [40 + (index % 2) * 170, 40 + Math.floor(index / 2) * (410 / 3 + 20), 150, 410 / 3]);
  if (layout === "collage") return [[40, 40, 928 / 5, 500], [1248 / 5, 40, 672 / 5, 460 / 3], [1248 / 5, 640 / 3, 672 / 5, 460 / 3], [1248 / 5, 1180 / 3, 672 / 5, 460 / 3]];
  if (layout === "wide") return [[40, 40, 320, 620 / 3], [40, 800 / 3, 320, 620 / 3]];
  return [[40, 40, 320, 350]];
};

export async function renderBooth(state: BoothState, scale = 1) {
  const strip = isStrip(state.layout);
  // 2×6 strips export at 1200×3600; 4×6 postcards export at 1200×1800.
  const width = 400;
  const height = strip ? 1200 : 600;
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);
  const [images, stickerImages] = await Promise.all([
    Promise.all(state.photos.map(loadImage)),
    Promise.all(state.stickers.map((item) => loadImage(item.asset).catch(() => null))),
  ]);
  const frameAsset = frameAssetFor(state.frame, state.layout);
  const frameImage = frameAsset ? await loadImage(frameAsset) : null;
  const cells = cellsFor(state.layout);
  ctx.fillStyle = "#fff9ee";
  ctx.fillRect(0, 0, width, height);
  if (frameImage) ctx.drawImage(frameImage, 0, 0, width, height);
  ctx.filter = filterMap[state.filter];
  cells.forEach((cell, index) => { const image = images[index]; const position = state.photoPositions[index] ?? { x: 50, y: 50 }; if (image) crop(ctx, image, cell[0] + (position.x - 50) * width / 100, cell[1] + (position.y - 50) * height / 100, cell[2], cell[3]); });
  ctx.filter = "none";
  state.stickers.forEach((item, index) => {
    const image = stickerImages[index];
    if (!image) return;
    const stickerWidth = width * item.size / 100;
    const stickerHeight = stickerWidth * image.height / image.width;
    ctx.save();
    ctx.translate((item.x / 100) * width, (item.y / 100) * height);
    ctx.rotate((item.rotation * Math.PI) / 180);
    ctx.drawImage(image, -stickerWidth / 2, -stickerHeight / 2, stickerWidth, stickerHeight);
    ctx.restore();
  });
  return canvas.toDataURL("image/png");
}