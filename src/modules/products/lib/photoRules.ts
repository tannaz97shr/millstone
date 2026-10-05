// Pure rules for product photos (A5). The bytes decide the type (sharp's
// metadata on the server), never the file name or the browser's MIME type.

/**
 * The largest upload accepted. Vercel refuses request bodies over 4.5 MB, so
 * A5 shrinks a phone photo (usually 3–12 MB) in the browser first
 * (resizePhoto.ts); the result is typically under 1.5 MB.
 */
export const PHOTO_MAX_BYTES = 4 * 1024 * 1024;

/** Room for the multipart boundaries and the other field around the file. Stays under Vercel's 4.5 MB. */
export const PHOTO_BODY_MAX_BYTES = PHOTO_MAX_BYTES + 64 * 1024;

/** The largest file the browser will try to shrink. Bigger is refused before it's decoded. */
export const PHOTO_SOURCE_MAX_BYTES = 25 * 1024 * 1024;

/** The browser shrinks photos to this on the long edge, unless the 4:3 crop needs more (see browserResizeSize). */
export const PHOTO_RESIZE_MAX_EDGE = 2048;

/** JPEG quality of the browser's shrunk copy. The server re-encodes it to WebP anyway. */
export const PHOTO_RESIZE_QUALITY = 0.9;

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

/**
 * The size the browser shrinks an upright photo to before upload: at most
 * 2048 on the long edge, but never so small that the server's 4:3 crop
 * (photoTargetSize) comes out smaller than it would from the original. So a
 * wide panorama keeps enough height for its 1200 × 900 crop. Never upscales.
 */
export function browserResizeSize(width: number, height: number): { width: number; height: number } {
  const { width: aw, height: ah } = PHOTO_ASPECT;
  const cropWidth = Math.min(width, (height * aw) / ah);
  const scale = Math.min(1, Math.max(PHOTO_RESIZE_MAX_EDGE / Math.max(width, height), PHOTO_MAX_WIDTH / cropWidth));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}
