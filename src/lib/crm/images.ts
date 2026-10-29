import living from "@/assets/prop-living-1.jpg";
import house from "@/assets/prop-house-1.jpg";
import kitchen from "@/assets/prop-kitchen-1.jpg";
import penthouse from "@/assets/prop-penthouse-1.jpg";
import bedroom from "@/assets/prop-bedroom-1.jpg";
import building from "@/assets/prop-building-1.jpg";
import studio from "@/assets/prop-studio-1.jpg";
import bath from "@/assets/prop-bath-1.jpg";

export const ASSETS: Record<string, string> = {
  "asset:living": living,
  "asset:house": house,
  "asset:kitchen": kitchen,
  "asset:penthouse": penthouse,
  "asset:bedroom": bedroom,
  "asset:building": building,
  "asset:studio": studio,
  "asset:bath": bath,
};

export const SAMPLE_PHOTO_KEYS = Object.keys(ASSETS);

export const PHOTO_BUCKET = "property-photos";
export const STORAGE_PREFIX = "storage:";

/** Resolved URLs for "storage:<path>" photos (signed URLs or local previews). */
const resolved = new Map<string, string>();
export function registerPhotoUrl(key: string, url: string) {
  resolved.set(key, url);
}

export function storagePaths(photos: string[]) {
  return photos
    .filter((s) => s.startsWith(STORAGE_PREFIX))
    .map((s) => s.slice(STORAGE_PREFIX.length));
}

export function img(src: string | undefined) {
  if (!src) return living;
  return ASSETS[src] ?? resolved.get(src) ?? (src.startsWith(STORAGE_PREFIX) ? living : src);
}
