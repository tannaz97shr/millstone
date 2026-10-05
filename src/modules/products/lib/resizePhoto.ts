import { logError } from "@/shared/utils/logError";
import { browserResizeSize, PHOTO_RESIZE_QUALITY } from "./photoRules";

// Browser only (A5). Shrinks a chosen photo before upload so the request fits
// Vercel's 4.5 MB body limit. The server still decides the type from the
// bytes, crops, strips metadata and re-encodes (processPhoto.ts).

const OUTPUT_TYPE = "image/jpeg";
/** Transparent pixels are laid on the page's background colour, since JPEG has no transparency. */
const BACKGROUND_TOKEN = "--color-flour";

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("The canvas gave no image"))),
      OUTPUT_TYPE,
      PHOTO_RESIZE_QUALITY,
    );
  });
}

/**
 * A JPEG copy of the photo, upright (EXIF orientation applied) and at most
 * the size browserResizeSize allows, keeping the file's name. The re-encode
 * also drops EXIF. Null when this browser can't decode the file (e.g. HEIC
 * in Chrome).
 */
export async function resizePhoto(file: File): Promise<File | null> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch (error) {
    logError(error, `resizePhoto decode ${file.type || "unknown type"}`, { level: "warn" });
    return null;
  }

  try {
    const size = browserResizeSize(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No 2D canvas context");
    const background = getComputedStyle(document.documentElement).getPropertyValue(BACKGROUND_TOKEN).trim();
    if (background) {
      context.fillStyle = background;
      context.fillRect(0, 0, size.width, size.height);
    }
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, size.width, size.height);
    return new File([await toBlob(canvas)], file.name, { type: OUTPUT_TYPE, lastModified: file.lastModified });
  } finally {
    bitmap.close();
  }
}
