import { test } from "node:test";
import assert from "node:assert/strict";

import { encodeBase36, decodeBase36, BASE36_ALPHABET } from "../src/core.js";

const fromHex = (hex) => {
  const clean = hex.length % 2 === 0 ? hex : "0" + hex;
  const arr = new Uint8Array(clean.length / 2);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
  }
  return arr;
};

test("empty input encodes to the single digit 0", () => {
  assert.equal(encodeBase36(new Uint8Array(0)), "0");
});

test("a single zero byte encodes to 0", () => {
  assert.equal(encodeBase36(new Uint8Array([0x00])), "0");
});

test("leading zero bytes are stripped during encoding", () => {
  assert.equal(encodeBase36(new Uint8Array([0x00, 0x00, 0x01])), "1");
});

test("one byte round-trips through encode then decode", () => {
  const bytes = new Uint8Array([0xff]);
  const encoded = encodeBase36(bytes);
  assert.equal(encoded, "73");
  assert.deepEqual(Array.from(decodeBase36(encoded)), [0xff]);
});

test("decode of 0 yields a one-byte zero array", () => {
  assert.deepEqual(Array.from(decodeBase36("0")), [0x00]);
});

test("round-trip for a multi-byte value", () => {
  const bytes = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
  const encoded = encodeBase36(bytes);
  const decoded = decodeBase36(encoded);
  assert.deepEqual(Array.from(decoded), [0x01, 0x02, 0x03, 0x04]);
});

test("lowercase input decodes identically to uppercase", () => {
  assert.deepEqual(
    Array.from(decodeBase36("ab")),
    Array.from(decodeBase36("AB"))
  );
});

test("mixed-case input is accepted", () => {
  assert.deepEqual(
    Array.from(decodeBase36("aBcD")),
    Array.from(decodeBase36("ABCD"))
  );
});

test("a large value round-trips", () => {
  const bytes = new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]);
  const encoded = encodeBase36(bytes);
  const decoded = decodeBase36(encoded);
  assert.deepEqual(Array.from(decoded), Array.from(bytes));
});

test("invalid character throws", () => {
  assert.throws(() => decodeBase36("!"), /invalid character/);
});

test("space character throws as invalid", () => {
  assert.throws(() => decodeBase36(" "), /invalid character/);
});

test("empty string throws on decode", () => {
  assert.throws(() => decodeBase36(""), /empty string/);
});

test("non-Uint8Array input throws on encode", () => {
  assert.throws(() => encodeBase36([]), /Uint8Array/);
});

test("non-string input throws on decode", () => {
  assert.throws(() => decodeBase36(42), /string/);
});

test("BASE36_ALPHABET has 36 characters and starts 0-9", () => {
  assert.equal(BASE36_ALPHABET.length, 36);
  assert.equal(BASE36_ALPHABET.slice(0, 10), "0123456789");
  assert.equal(BASE36_ALPHABET.slice(10, 36), "ABCDEFGHIJKLMNOPQRSTUVWXYZ");
});

test("encode of 0x01 is 1", () => {
  assert.equal(encodeBase36(new Uint8Array([0x01])), "1");
});

test("decode of 1 yields a one-byte array with value 1", () => {
  assert.deepEqual(Array.from(decodeBase36("1")), [0x01]);
});

test("the full alphabet maps to bytes 0..35 in groups via known value", () => {
  // The integer 35 encodes to 'Z'; integer 36 encodes to '10'.
  assert.equal(encodeBase36(new Uint8Array([35])), "Z");
  assert.equal(encodeBase36(new Uint8Array([36])), "10");
});

test("known multi-byte value matches hand calculation", () => {
  // 0x0100 = 256 decimal; 256 in base36 is 7 * 36 + 4 => "74"
  assert.equal(encodeBase36(new Uint8Array([0x01, 0x00])), "74");
});

test("leading zeros in the Base36 string are accepted and do not change value", () => {
  assert.deepEqual(
    Array.from(decodeBase36("0001")),
    Array.from(decodeBase36("1"))
  );
});

test("round-trip preserves arbitrary bytes", () => {
  const bytes = new Uint8Array([0x00, 0x7f, 0x80, 0xff, 0x01, 0x00]);
  const encoded = encodeBase36(bytes);
  const decoded = decodeBase36(encoded);
  // Leading zeros are stripped by encode, so compare numeric value equality
  // by re-encoding the decoded result.
  assert.equal(encodeBase36(decoded), encodeBase36(bytes));
});
