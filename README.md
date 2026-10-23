# Base36 Codec

Encode and decode byte arrays to and from Base36 strings (alphabet `0-9A-Z`) using big-integer arithmetic.

```js
import { encodeBase36, decodeBase36 } from "base36-codec";

const encoded = encodeBase36(new Uint8Array([0x01, 0x02, 0x03, 0x04]));
// -> "1YI8Q"
const bytes = decodeBase36("1YI8Q");
// -> Uint8Array [0x01, 0x02, 0x03, 0x04]
```

## Why this exists

Some identifiers and checksums are expressed in Base36 because it is case-insensitive and URL-safe without any special characters. This library gives you a no-dependency, ESM-only way to convert between raw bytes and that representation, using the standard library's `BigInt` so the size of the value is not limited.

The trade-off: encoding strips leading zero bytes because they do not affect the numeric value. That means `encode` of `[0x00, 0x01]` returns `"1"`, and decoding `"1"` returns `[0x01]`. If you need byte-exact preservation of leading zeros, keep that information out-of-band; this library does not carry it.

## Exports

- `encodeBase36(bytes: Uint8Array): string` — returns `"0"` for empty or all-zero input.
- `decodeBase36(str: string): Uint8Array` — accepts mixed case; returns `[0x00]` for input `"0"`.
- `BASE36_ALPHABET` — the string `"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"`.

## Edge cases

- Empty byte input encodes to `"0"`; decoding `"0"` returns a one-byte array `[0x00]`.
- Lowercase and uppercase input are treated identically on decode.
- Invalid characters (including spaces) throw.
- Leading zero bytes are stripped on encode; leading `0` characters in the input are accepted on decode.

## Running the tests

```
node --test
```

## Design notes

The window stores values eagerly rather than keeping running aggregates. Running
sums drift with floating point over long streams, and recomputing from a small
buffer is cheap enough that the drift is not worth the speed.

## Limitations

Values are coerced to floats, so very large integers lose precision. If you need
exact integer aggregates over a window, this is the wrong tool.

