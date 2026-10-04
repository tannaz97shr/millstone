import "server-only";
import sharp, { type Metadata } from "sharp";
import { ApiError } from "@/shared/lib/api/apiError";
import { logError } from "@/shared/utils/logError";
import {
  isLargeEnough,
  isPhotoFormat,
  PHOTO_MAX_INPUT_PIXELS,
  PHOTO_WEBP_QUALITY,
  photoTargetSize,
} from "./photoRules";

export const PHOTO_CONTENT_TYPE = "image/webp";

const unsupported = (why: string) => new ApiError(415, "unsupported_image", why);

/**
 * Turns an upload into the stored photo:
 * - the type comes from the bytes (sharp's decoder): JPEG, PNG or WebP only
 * - turned upright by its EXIF orientation
 * - cropped to 4:3 around the most interesting part, at most 1200 × 900
 * - saved as WebP with every bit of metadata dropped (EXIF, GPS, camera,
 *   XMP and the colour profile; colours are converted to sRGB first)
 */
export async function processPhoto(input: Uint8Array): Promise<Buffer> {
  let metadata: Metadata;
  try {
    metadata = await sharp(input, { limitInputPixels: PHOTO_MAX_INPUT_PIXELS }).metadata();
  } catch (error) {
    logError(error, "processPhoto metadata", { level: "warn" });
    throw unsupported("Not an image sharp can read");
  }
  if (!isPhotoFormat(metadata.format)) throw unsupported(`Decoded as "${metadata.format}"`);

  const { width, height } = metadata.autoOrient;
  if (width * height > PHOTO_MAX_INPUT_PIXELS) {
    throw new ApiError(413, "file_too_large", `${width} × ${height} is over ${PHOTO_MAX_INPUT_PIXELS} pixels`);
  }
  if (!isLargeEnough(width, height)) {
    throw new ApiError(422, "image_too_small", `${width} × ${height} is under the minimum`);
  }

  const target = photoTargetSize(width, height);
  try {
    // No keepMetadata()/withMetadata(): sharp writes none of the input's metadata.
    return await sharp(input, { limitInputPixels: PHOTO_MAX_INPUT_PIXELS })
      .autoOrient()
      .resize(target.width, target.height, { fit: "cover", position: sharp.strategy.attention })
      .webp({ quality: PHOTO_WEBP_QUALITY })
      .toBuffer();
  } catch (error) {
    logError(error, "processPhoto convert", { level: "warn" });
    throw unsupported("The image couldn't be decoded");
  }
}
