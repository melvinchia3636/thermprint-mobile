const BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const BASE64_LOOKUP = new Uint8Array(256);
for (let i = 0; i < BASE64_CHARS.length; i++) {
  BASE64_LOOKUP[BASE64_CHARS.charCodeAt(i)] = i;
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let result = "";
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < len ? bytes[i + 1] : 0;
    const b2 = i + 2 < len ? bytes[i + 2] : 0;

    result += BASE64_CHARS[b0 >> 2];
    result += BASE64_CHARS[((b0 & 3) << 4) | (b1 >> 4)];
    result += i + 1 < len ? BASE64_CHARS[((b1 & 15) << 2) | (b2 >> 6)] : "=";
    result += i + 2 < len ? BASE64_CHARS[b2 & 63] : "=";
  }
  return result;
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const clean = base64.replace(/^data:image\/[a-z]+;base64,/, "").trim();
  const len = clean.length;
  let padding = 0;
  if (clean.endsWith("==")) padding = 2;
  else if (clean.endsWith("=")) padding = 1;

  const byteLen = Math.floor((len * 3) / 4) - padding;
  const bytes = new Uint8Array(byteLen);

  let outIdx = 0;
  for (let i = 0; i < len; i += 4) {
    const b0 = BASE64_LOOKUP[clean.charCodeAt(i)];
    const b1 = BASE64_LOOKUP[clean.charCodeAt(i + 1)];
    const b2 = BASE64_LOOKUP[clean.charCodeAt(i + 2)];
    const b3 = BASE64_LOOKUP[clean.charCodeAt(i + 3)];

    if (outIdx < byteLen) bytes[outIdx++] = (b0 << 2) | (b1 >> 4);
    if (outIdx < byteLen) bytes[outIdx++] = ((b1 & 15) << 4) | (b2 >> 2);
    if (outIdx < byteLen) bytes[outIdx++] = ((b2 & 3) << 6) | b3;
  }

  return bytes;
}
