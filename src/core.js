/**
 * Base36 codec core.
 *
 * Why BigInt: We need to convert arbitrary-length byte arrays to a Base36
 * string via big-integer arithmetic. The standard library's BigInt gives us
 * exact, unbounded integer math without any third-party dependency.
 *
 * We define our own alphabet ("012...Z") rather than using a library so the
 * encode/decode pair is fully self-contained and the alphabet is identical
 * at both ends.
 */

export const BASE36_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Encodes a byte array into a Base36 string.
 *
 * We treat the bytes as an unsigned big-endian integer, divide repeatedly by
 * 36, and collect remainders. We reverse at the end for little-endian digit
 * generation. An empty input produces "0" so encode(decode(x)) round-trips for
 * the canonical representation of zero. A single zero byte also yields "0".
 *
 * @param {Uint8Array} bytes - bytes to encode
 * @returns {string} Base36 representation
 */
export function encodeBase36(bytes) {
  if (!(bytes instanceof Uint8Array)) {
    throw new TypeError("encodeBase36 expects a Uint8Array");
  }
  if (bytes.length === 0) {
    return "0";
  }

  // Strip leading zero bytes; they do not change the numeric value and
  // would otherwise make the output longer than necessary.
  let start = 0;
  while (start < bytes.length && bytes[start] === 0) {
    start++;
  }
  if (start === bytes.length) {
    // all zeros
    return "0";
  }

  let value = 0n;
  for (let i = start; i < bytes.length; i++) {
    value = (value << 8n) | BigInt(bytes[i]);
  }

  let out = "";
  const THIRTY_SIX = 36n;
  while (value > 0n) {
    const rem = value % THIRTY_SIX;
    out += BASE36_ALPHABET[Number(rem)];
    value /= THIRTY_SIX;
  }

  return out.split("").reverse().join("");
}

/**
 * Decodes a Base36 string back into a byte array.
 *
 * We accept uppercase and lowercase, mapping each character to its value. The
 * decoded integer is then packed back into the minimal big-endian byte array.
 * An input of "0" yields a one-byte array [0x00] so that the zero case has a
 * stable, non-empty representation.
 *
 * @param {string} str - Base36 string
 * @returns {Uint8Array} decoded bytes
 */
export function decodeBase36(str) {
  if (typeof str !== "string") {
    throw new TypeError("decodeBase36 expects a string");
  }
  if (str.length === 0) {
    throw new Error("decodeBase36: empty string is not a valid Base36 input");
  }

  let value = 0n;
  const THIRTY_SIX = 36n;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    const up = ch.toUpperCase();
    const idx = BASE36_ALPHABET.indexOf(up);
    if (idx === -1) {
      throw new Error(`decodeBase36: invalid character '${ch}' at position ${i}`);
    }
    value = value * THIRTY_SIX + BigInt(idx);
  }

  if (value === 0n) {
    return new Uint8Array([0x00]);
  }

  // Pack the BigInt into big-endian bytes.
  const hex = value.toString(16);
  const padded = hex.length % 2 === 0 ? hex : "0" + hex;
  const byteCount = padded.length / 2;
  const out = new Uint8Array(byteCount);
  for (let i = 0; i < byteCount; i++) {
    out[i] = parseInt(padded.substring(i * 2, i * 2 + 2), 16);
  }
  return out;
}
