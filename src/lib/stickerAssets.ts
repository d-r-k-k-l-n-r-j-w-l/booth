const assets = import.meta.glob("../assets/sticker/*.png", { eager: true, query: "?url", import: "default" });

export const stickerOptions = Object.entries(assets)
  .sort(([left], [right]) => left.localeCompare(right, undefined, { numeric: true }))
  .map(([, source]) => source as string);