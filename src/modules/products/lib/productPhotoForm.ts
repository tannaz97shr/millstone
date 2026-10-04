import "server-only";
import { z } from "zod";
import { ApiError } from "@/shared/lib/api/apiError";
import { PHOTO_MAX_BYTES } from "./photoRules";

// The multipart body of POST /api/admin/products/{id}/photo: one file and
// the product version the form read. The file's name and MIME type are
// ignored: processPhoto decides the type from the bytes.

const versionField = z.coerce.number().int().nonnegative();

export async function readPhotoForm(form: FormData): Promise<{ bytes: Uint8Array; expectedVersion: number }> {
  const file = form.get("file");
  const version = versionField.safeParse(form.get("expectedVersion"));
  const fields = [...(file instanceof Blob ? [] : ["file"]), ...(version.success ? [] : ["expectedVersion"])];
  if (!(file instanceof Blob) || !version.success) {
    throw new ApiError(400, "invalid_body", `Invalid ${fields.join(", ")}`, { fields });
  }
  if (file.size > PHOTO_MAX_BYTES) {
    throw new ApiError(413, "file_too_large", `File of ${file.size} bytes is over ${PHOTO_MAX_BYTES}`);
  }
  return { bytes: new Uint8Array(await file.arrayBuffer()), expectedVersion: version.data };
}
