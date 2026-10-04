// Pure rules for product photos (A5). The bytes decide the type (sharp's
// metadata on the server), never the file name or the browser's MIME type.

/** The largest upload accepted. A phone photo is usually 2–6 MB. */
export const PHOTO_MAX_BYTES = 10 * 1024 * 1024;

/** Room for the multipart boundaries and the other field around the file. */
export const PHOTO_BODY_MAX_BYTES = PHOTO_MAX_BYTES + 64 * 1024;

/** Decoders accepted, as sharp names them. */
export const PHOTO_FORMATS = ["jpeg", "png", "webp"] as const;
export type PhotoFormat = (typeof PHOTO_FORMATS)[number];

/** For the file picker only (a hint to the browser); the server checks the bytes. */
export const PHOTO_ACCEPT = "image/jpeg,image/png,image/webp";

/**
 * The saved photo is 4:3 (design system: "natural light, 4:3") and at most
 * 1200 × 900: the widest it's shown is C3's 448px sheet, so 2× is 896px.
 * Next's image optimiser makes the smaller sizes from it.
 */
export const PHOTO_MAX_WIDTH = 1200;
export const PHOTO_ASPECT = { width: 4, height: 3 } as const;

/** Smaller than this would look blurred even on a menu card. */
export const PHOTO_MIN_WIDTH = 400;
export const PHOTO_MIN_HEIGHT = 300;

/** Refuses decompression bombs: about 40 megapixels (a 7000 × 5700 image). */
export const PHOTO_MAX_INPUT_PIXELS = 40_000_000;

export const PHOTO_WEBP_QUALITY = 80;

export function isPhotoFormat(format: string | undefined): format is PhotoFormat {
  return (PHOTO_FORMATS as readonly string[]).includes(format ?? "");
}

/** Big enough after it's turned upright (EXIF orientation applied)? */
export function isLargeEnough(width: number, height: number): boolean {
  return width >= PHOTO_MIN_WIDTH && height >= PHOTO_MIN_HEIGHT;
}

/**
 * The output size for an upright image: the largest 4:3 box that fits inside
 * it, capped at 1200 × 900. Never larger than the source (no upscaling).
 */
export function photoTargetSize(width: number, height: number): { width: number; height: number } {
  const { width: aw, height: ah } = PHOTO_ASPECT;
  const fitWidth = Math.min(width, Math.floor((height * aw) / ah), PHOTO_MAX_WIDTH);
  const units = Math.floor(fitWidth / aw);
  return { width: units * aw, height: units * ah };
}
