import "server-only";
import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

// Password hashing with scrypt from node:crypto: built into Node and Bun, no
// native dependency. Parameters follow OWASP (N=2^17, r=8, p=1).
// Stored as "scrypt$<log2N>$<r>$<p>$<salt b64>$<hash b64>" so parameters can
// be raised later without breaking existing hashes.

const SCHEME = "scrypt";
const LOG2_N = 17;
const BLOCK_SIZE = 8;
const PARALLELISM = 1;
const SALT_BYTES = 16;
const KEY_BYTES = 64;

type ScryptParams = Required<Pick<ScryptOptions, "N" | "r" | "p">>;

function deriveKey(password: string, salt: Buffer, params: ScryptParams): Promise<Buffer> {
  // scrypt needs 128 × N × r bytes; allow double that.
  const options: ScryptOptions = { ...params, maxmem: 256 * params.N * params.r };
  return new Promise((resolve, reject) => {
    scrypt(password.normalize("NFKC"), salt, KEY_BYTES, options, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await deriveKey(password, salt, {
    N: 2 ** LOG2_N,
    r: BLOCK_SIZE,
    p: PARALLELISM,
  });
  return [SCHEME, LOG2_N, BLOCK_SIZE, PARALLELISM, salt.toString("base64"), key.toString("base64")].join("$");
}

/** False for a wrong password or a malformed hash; never throws on bad input. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, log2NText, rText, pText, saltB64, keyB64] = stored.split("$");
  const [log2N, r, p] = [log2NText, rText, pText].map(Number);
  const paramsValid =
    [log2N, r, p].every(Number.isInteger) && log2N >= 14 && log2N <= 20 && r >= 1 && r <= 16 && p >= 1 && p <= 4;
  if (scheme !== SCHEME || !paramsValid || !saltB64 || !keyB64) return false;

  const expected = Buffer.from(keyB64, "base64");
  const actual = await deriveKey(password, Buffer.from(saltB64, "base64"), {
    N: 2 ** log2N,
    r,
    p,
  });
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
