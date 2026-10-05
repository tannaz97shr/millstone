import "server-only";
import { ApiError } from "./apiError";

/**
 * Reads a request body, refusing it (413 `file_too_large`) as soon as it's
 * over `maxBytes`: first from Content-Length, then while streaming, so an
 * oversized or lying upload is never held in memory in full.
 */
export async function readLimitedBody(request: Request, maxBytes: number): Promise<Uint8Array<ArrayBuffer>> {
  const declared = Number(request.headers.get("content-length") ?? "");
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new ApiError(413, "file_too_large", `Body of ${declared} bytes is over ${maxBytes}`);
  }
  if (!request.body) return new Uint8Array();

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new ApiError(413, "file_too_large", `Body is over ${maxBytes} bytes`);
    }
    chunks.push(value);
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

/** Multipart form data from bytes already read (readLimitedBody); a bad body is a 400. */
export async function parseMultipart(request: Request, body: Uint8Array<ArrayBuffer>): Promise<FormData> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("multipart/form-data")) {
    throw new ApiError(400, "invalid_body", "Expected multipart/form-data", { fields: [] });
  }
  try {
    return await new Response(body, { headers: { "content-type": contentType } }).formData();
  } catch (error) {
    throw new ApiError(400, "invalid_body", `Unreadable multipart body (${String(error)})`, { fields: [] });
  }
}
