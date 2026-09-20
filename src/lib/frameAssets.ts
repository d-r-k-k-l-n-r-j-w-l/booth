import blushStrip from "../assets/frame/blush_doodle_strip.png";
import blushPostcard from "../assets/frame/blush_poodle_postcard.png";
import filmStrip from "../assets/frame/film_strip.png";
import filmPostcard from "../assets/frame/film_postcard.png";
import kawaiiStrip from "../assets/frame/kawaii_strip.png";
import kawaiiPostcard from "../assets/frame/kawaii_postcard.png";
import vintageStrip from "../assets/frame/vintage_strip.png";
import vintagePostcard from "../assets/frame/vintage_postcard.png";
import y2kStrip from "../assets/frame/y2k_strip.png";
import y2kPostcard from "../assets/frame/y2k_postcard.png";
import stampStrip from "../assets/frame/stamp_strip.png";
import stampPostcard from "../assets/frame/stamp_postcard.png";
import type { FrameId, LayoutId } from "../types";

type AssetFrameId = Exclude<FrameId, "none">;
export const frameOptions: { id: FrameId; label: string; preview?: string }[] = [
  { id: "none", label: "None" },
  { id: "blush-doodle", label: "Blush Doodle", preview: blushStrip },
  { id: "kawaii", label: "Kawaii", preview: kawaiiStrip },
  { id: "film", label: "Film", preview: filmStrip },
  { id: "vintage", label: "Vintage", preview: vintageStrip },
  { id: "y2k", label: "Y2K", preview: y2kStrip },
  { id: "stamp", label: "Stamp", preview: stampStrip },
];
const assets: Record<AssetFrameId, { strip: string; postcard: string }> = {
  "blush-doodle": { strip: blushStrip, postcard: blushPostcard },
  kawaii: { strip: kawaiiStrip, postcard: kawaiiPostcard },
  film: { strip: filmStrip, postcard: filmPostcard },
  vintage: { strip: vintageStrip, postcard: vintagePostcard },
  y2k: { strip: y2kStrip, postcard: y2kPostcard },
  stamp: { strip: stampStrip, postcard: stampPostcard },
};
export const frameAssetFor = (frame: FrameId, layout: LayoutId) => frame === "none" ? undefined : assets[frame]?.[layout === "strip-3" || layout === "strip-4" ? "strip" : "postcard"];