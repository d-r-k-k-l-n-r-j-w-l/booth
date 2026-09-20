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
const cellsFor = (layout: LayoutId, width: number, height: number, padding: number, footer: number): Cell[] => {
  const innerWidth = width - padding * 2;
  const innerHeight = height - footer - padding * 2;
  if (isStrip(layout)) {
    const count = layout === "strip-3" ? 3 : 4;
    return Array.from({ length: count }, (_, index) => [padding, padding + index * (innerHeight / count), innerWidth, innerHeight / count] as Cell);
  }
  if (layout === "grid-4" || layout === "grid-6") {
    const rows = layout === "grid-6" ? 3 : 2;
    const cellWidth = (width - padding * 3) / 2;
    const cellHeight = (height - padding * (rows + 1)) / rows;
    return Array.from({ length: rows * 2 }, (_, index) => [padding + (index % 2) * (cellWidth + padding), padding + Math.floor(index / 2) * (cellHeight + padding), cellWidth, cellHeight] as Cell);
  }
  if (layout === "collage") {
    const largeWidth = innerWidth * .58;
    const smallWidth = innerWidth - largeWidth - padding;
    const smallHeight = (innerHeight - padding * 2) / 3;
    return [[padding, padding, largeWidth, innerHeight], ...Array.from({ length: 3 }, (_, index) => [padding + largeWidth + padding, padding + index * (smallHeight + padding), smallWidth, smallHeight] as Cell)];
  }
  if (layout === "wide") return [[padding, padding, innerWidth, (innerHeight - padding) / 2], [padding, padding + (innerHeight + padding) / 2, innerWidth, (innerHeight - padding) / 2]];
  return [[padding, padding, innerWidth, innerHeight]];
};

export async function renderBooth(state: BoothState, scale = 1) {
  const strip = isStrip(state.layout);
  // 400×1200 × 3 = 1200×3600 (2×6 in at 600 DPI); 400×600 × 3 = 1200×1800 (4×6 in at 300 DPI).
  const width = 400;
  const height = strip ? 1200 : 600;
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);
  const images = await Promise.all(state.photos.map(loadImage));
  const frame = state.frame ?? "classic";
  const frameColor = state.frameColor || "#f19aaa";
  const borderWidth = Number.isFinite(state.borderWidth) ? state.borderWidth : 2;
  const padding = frame === "film" ? 32 : 20;
  const footer = frame === "polaroid" || state.layout === "polaroid" ? 170 : strip ? 94 : 44;
  const cells = cellsFor(state.layout, width, height, padding, footer);
  const paper = frame === "film" ? "#292724" : frame === "vintage" ? "#d4c4a8" : "#fff9ee";
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, width, height);
  ctx.filter = filterMap[state.filter];
  cells.forEach((cell, index) => { const image = images[index]; if (image) crop(ctx, image, ...cell); });
  ctx.filter = "none";
  if (frame !== "none") {
    ctx.strokeStyle = frameColor;
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(borderWidth / 2, borderWidth / 2, width - borderWidth, height - borderWidth);
  }
  if (frame === "film") {
    ctx.fillStyle = "#fff9ee";
    for (let y = 10; y < height; y += 28) { ctx.fillRect(8, y, 12, 15); ctx.fillRect(width - 20, y, 12, 15); }
  }
  if (frame === "doodle" || frame === "kawaii") {
    ctx.fillStyle = "#f19aaa";
    ctx.font = "32px Drawably Pen, cursive";
    [[18, 40], [width - 42, 40], [18, height - 24], [width - 42, height - 24]].forEach(([x, y]) => ctx.fillText(frame === "doodle" ? "✧" : "♡", x, y));
  }
  ctx.fillStyle = frame === "film" ? "#fff9ee" : "#292724";
  ctx.font = "14px Drawably Pen, cursive";
  ctx.textAlign = "center";
  ctx.fillText("little booth ♡", width / 2, height - footer / 2);
  state.stickers.forEach((item) => {
    ctx.save();
    ctx.translate((item.x / 100) * width, (item.y / 100) * height);
    ctx.rotate((item.rotation * Math.PI) / 180);
    ctx.font = `${item.size * 3}px Drawably Pen, cursive`;
    ctx.fillText(item.asset, 0, 0);
    ctx.restore();
  });
  return canvas.toDataURL("image/png");
}