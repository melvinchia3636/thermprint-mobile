import { GRAY_LEVELS } from "./protocol";
import { uint8ArrayToBase64 } from "./base64";

export type DitherMethod = "floyd-steinberg" | "atkinson" | "bayer" | "none";

const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

const THERMAL_PREVIEW_LUT = new Uint8Array(256);
const stepInLut = Math.floor(256 / GRAY_LEVELS);
const thermalGamma = 1.6;
for (let i = 0; i < 256; i++) {
  let levelIdx = Math.floor(i / stepInLut);
  if (levelIdx < 0) levelIdx = 0;
  else if (levelIdx >= GRAY_LEVELS) levelIdx = GRAY_LEVELS - 1;
  const nibble = GRAY_LEVELS - 1 - levelIdx;
  const linearGray = 255 - Math.floor((nibble * 255) / (GRAY_LEVELS - 1));
  THERMAL_PREVIEW_LUT[i] = Math.floor(
    255 * Math.pow(linearGray / 255.0, thermalGamma),
  );
}

export function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

export function grayPixelsToBmpBase64(
  pixels: Uint8Array | Int32Array | number[],
  width: number,
  height: number,
): string {
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;
  const buffer = new Uint8Array(fileSize);

  buffer[0] = 0x42;
  buffer[1] = 0x4d;
  buffer[2] = fileSize & 0xff;
  buffer[3] = (fileSize >> 8) & 0xff;
  buffer[4] = (fileSize >> 16) & 0xff;
  buffer[5] = (fileSize >> 24) & 0xff;
  buffer[10] = 54;

  buffer[14] = 40;
  buffer[18] = width & 0xff;
  buffer[19] = (width >> 8) & 0xff;
  buffer[20] = (width >> 16) & 0xff;
  buffer[21] = (width >> 24) & 0xff;
  buffer[22] = height & 0xff;
  buffer[23] = (height >> 8) & 0xff;
  buffer[24] = (height >> 16) & 0xff;
  buffer[25] = (height >> 24) & 0xff;
  buffer[26] = 1;
  buffer[28] = 24;
  buffer[34] = pixelArraySize & 0xff;
  buffer[35] = (pixelArraySize >> 8) & 0xff;
  buffer[36] = (pixelArraySize >> 16) & 0xff;
  buffer[37] = (pixelArraySize >> 24) & 0xff;

  const padding = rowSize - width * 3;
  let outIdx = 54;

  for (let y = height - 1; y >= 0; y--) {
    const rowStart = y * width;
    for (let x = 0; x < width; x++) {
      const val = THERMAL_PREVIEW_LUT[pixels[rowStart + x]];
      buffer[outIdx++] = val;
      buffer[outIdx++] = val;
      buffer[outIdx++] = val;
    }
    for (let p = 0; p < padding; p++) {
      buffer[outIdx++] = 0;
    }
  }

  return `data:image/bmp;base64,${uint8ArrayToBase64(buffer)}`;
}

export function drawAnnotatedPreviewBmp(
  ditheredPixels: Uint8Array | Int32Array | number[],
  width: number,
  height: number,
  cols: number,
  rows: number,
): string {
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;
  const buffer = new Uint8Array(fileSize);

  buffer[0] = 0x42;
  buffer[1] = 0x4d;
  buffer[2] = fileSize & 0xff;
  buffer[3] = (fileSize >> 8) & 0xff;
  buffer[4] = (fileSize >> 16) & 0xff;
  buffer[5] = (fileSize >> 24) & 0xff;
  buffer[10] = 54;

  buffer[14] = 40;
  buffer[18] = width & 0xff;
  buffer[19] = (width >> 8) & 0xff;
  buffer[20] = (width >> 16) & 0xff;
  buffer[21] = (width >> 24) & 0xff;
  buffer[22] = height & 0xff;
  buffer[23] = (height >> 8) & 0xff;
  buffer[24] = (height >> 16) & 0xff;
  buffer[25] = (height >> 24) & 0xff;
  buffer[26] = 1;
  buffer[28] = 24;
  buffer[34] = pixelArraySize & 0xff;
  buffer[35] = (pixelArraySize >> 8) & 0xff;
  buffer[36] = (pixelArraySize >> 16) & 0xff;
  buffer[37] = (pixelArraySize >> 24) & 0xff;

  const cellW = Math.floor(width / cols);
  const cellH = Math.floor(height / rows);
  const padding = rowSize - width * 3;
  let outIdx = 54;

  for (let y = height - 1; y >= 0; y--) {
    const isHorizLine = rows > 1 && y % cellH === 0 && y > 0 && y < height;
    const rowStart = y * width;

    for (let x = 0; x < width; x++) {
      const isVertLine = cols > 1 && x % cellW === 0 && x > 0 && x < width;

      if (
        (isVertLine && Math.floor(y / 6) % 2 === 0) ||
        (isHorizLine && Math.floor(x / 6) % 2 === 0)
      ) {
        buffer[outIdx++] = 68;
        buffer[outIdx++] = 68;
        buffer[outIdx++] = 239;
      } else {
        const val = THERMAL_PREVIEW_LUT[ditheredPixels[rowStart + x]];
        buffer[outIdx++] = val;
        buffer[outIdx++] = val;
        buffer[outIdx++] = val;
      }
    }
    for (let p = 0; p < padding; p++) {
      buffer[outIdx++] = 0;
    }
  }

  return `data:image/bmp;base64,${uint8ArrayToBase64(buffer)}`;
}

export function ditherFloydSteinberg(
  grayPixels: Uint8Array | number[],
  width: number,
  height: number
): Uint8Array {
  const buf = new Float32Array(grayPixels);
  const stepIn = 256 / GRAY_LEVELS; // 16
  const stepOut = 255 / (GRAY_LEVELS - 1); // 17

  for (let y = 0; y < height; y++) {
    const isEven = y % 2 === 0;
    const hasBelow = y < height - 1;

    if (isEven) {
      // Left-to-right
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const oldVal = buf[idx];

        let levelIdx = Math.floor(oldVal / stepIn);
        if (levelIdx < 0) levelIdx = 0;
        else if (levelIdx >= GRAY_LEVELS) levelIdx = GRAY_LEVELS - 1;

        const newVal = levelIdx * stepOut;
        buf[idx] = newVal;
        const error = oldVal - newVal;

        if (x + 1 < width) buf[idx + 1] += (error * 7) / 16;
        if (hasBelow) {
          if (x > 0) buf[(y + 1) * width + (x - 1)] += (error * 3) / 16;
          buf[(y + 1) * width + x] += (error * 5) / 16;
          if (x + 1 < width) buf[(y + 1) * width + (x + 1)] += error / 16;
        }
      }
    } else {
      // Right-to-left (serpentine to eliminate directional pixel shifting)
      for (let x = width - 1; x >= 0; x--) {
        const idx = y * width + x;
        const oldVal = buf[idx];

        let levelIdx = Math.floor(oldVal / stepIn);
        if (levelIdx < 0) levelIdx = 0;
        else if (levelIdx >= GRAY_LEVELS) levelIdx = GRAY_LEVELS - 1;

        const newVal = levelIdx * stepOut;
        buf[idx] = newVal;
        const error = oldVal - newVal;

        if (x - 1 >= 0) buf[idx - 1] += (error * 7) / 16;
        if (hasBelow) {
          if (x + 1 < width) buf[(y + 1) * width + (x + 1)] += (error * 3) / 16;
          buf[(y + 1) * width + x] += (error * 5) / 16;
          if (x - 1 >= 0) buf[(y + 1) * width + (x - 1)] += error / 16;
        }
      }
    }
  }

  const result = new Uint8Array(width * height);
  for (let i = 0; i < buf.length; i++) {
    result[i] = Math.max(0, Math.min(255, Math.round(buf[i])));
  }
  return result;
}

export function ditherAtkinson(
  grayPixels: Uint8Array | number[],
  width: number,
  height: number
): Uint8Array {
  const buf = new Float32Array(grayPixels);
  const stepIn = 256 / GRAY_LEVELS; // 16
  const stepOut = 255 / (GRAY_LEVELS - 1); // 17

  for (let y = 0; y < height; y++) {
    const isEven = y % 2 === 0;
    if (isEven) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const oldVal = buf[idx];

        let levelIdx = Math.floor(oldVal / stepIn);
        if (levelIdx < 0) levelIdx = 0;
        else if (levelIdx >= GRAY_LEVELS) levelIdx = GRAY_LEVELS - 1;

        const newVal = levelIdx * stepOut;
        buf[idx] = newVal;
        const error = oldVal - newVal;
        const e8 = error / 8;

        if (x + 1 < width) buf[idx + 1] += e8;
        if (x + 2 < width) buf[idx + 2] += e8;
        if (y + 1 < height) {
          if (x > 0) buf[(y + 1) * width + (x - 1)] += e8;
          buf[(y + 1) * width + x] += e8;
          if (x + 1 < width) buf[(y + 1) * width + (x + 1)] += e8;
        }
        if (y + 2 < height) {
          buf[(y + 2) * width + x] += e8;
        }
      }
    } else {
      for (let x = width - 1; x >= 0; x--) {
        const idx = y * width + x;
        const oldVal = buf[idx];

        let levelIdx = Math.floor(oldVal / stepIn);
        if (levelIdx < 0) levelIdx = 0;
        else if (levelIdx >= GRAY_LEVELS) levelIdx = GRAY_LEVELS - 1;

        const newVal = levelIdx * stepOut;
        buf[idx] = newVal;
        const error = oldVal - newVal;
        const e8 = error / 8;

        if (x - 1 >= 0) buf[idx - 1] += e8;
        if (x - 2 >= 0) buf[idx - 2] += e8;
        if (y + 1 < height) {
          if (x + 1 < width) buf[(y + 1) * width + (x + 1)] += e8;
          buf[(y + 1) * width + x] += e8;
          if (x - 1 >= 0) buf[(y + 1) * width + (x - 1)] += e8;
        }
        if (y + 2 < height) {
          buf[(y + 2) * width + x] += e8;
        }
      }
    }
  }

  const result = new Uint8Array(width * height);
  for (let i = 0; i < buf.length; i++) {
    result[i] = Math.max(0, Math.min(255, Math.round(buf[i])));
  }
  return result;
}

export function ditherBayer(
  grayPixels: Uint8Array | number[],
  width: number,
  height: number
): Uint8Array {
  const result = new Uint8Array(width * height);
  const stepIn = 256 / GRAY_LEVELS; // 16
  const stepOut = 255 / (GRAY_LEVELS - 1); // 17

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      const idx = rowOffset + x;
      const p = grayPixels[idx];
      const threshold = BAYER_4X4[y % 4][x % 4] - 7.5;
      const val = p + threshold;
      let level = Math.round(val / stepIn);
      if (level < 0) level = 0;
      else if (level >= GRAY_LEVELS) level = GRAY_LEVELS - 1;
      result[idx] = level * stepOut;
    }
  }
  return result;
}

export function ditherGrayPixels(
  grayPixels: Uint8Array | number[],
  width: number,
  height: number,
  method: DitherMethod = "floyd-steinberg"
): Uint8Array {
  if (method === "none") {
    const res = new Uint8Array(grayPixels.length);
    const stepIn = Math.floor(256 / GRAY_LEVELS);
    const stepOut = Math.floor(255 / (GRAY_LEVELS - 1));
    for (let i = 0; i < grayPixels.length; i++) {
      const level = Math.max(0, Math.min(GRAY_LEVELS - 1, Math.floor(grayPixels[i] / stepIn)));
      res[i] = level * stepOut;
    }
    return res;
  }
  if (method === "atkinson") {
    return ditherAtkinson(grayPixels, width, height);
  }
  if (method === "bayer") {
    return ditherBayer(grayPixels, width, height);
  }
  return ditherFloydSteinberg(grayPixels, width, height);
}

export function grayToNibbles(
  grayPixels: Uint8Array | Int32Array | number[],
  width: number,
  height: number
): Uint8Array {
  const stepIn = Math.floor(256 / GRAY_LEVELS);
  const halfWidth = Math.floor(width / 2);

  const paddingRows = 16;
  let totalBytes = (height + paddingRows) * halfWidth;
  if (totalBytes % 4 !== 0) {
    totalBytes += 4 - (totalBytes % 4);
  }
  const result = new Uint8Array(totalBytes);

  let outIdx = paddingRows * halfWidth;
  let firstNibble: number | null = null;

  for (let i = 0; i < grayPixels.length; i++) {
    const val = grayPixels[i];
    let levelIdx = Math.floor(val / stepIn);
    if (levelIdx < 0) {
      levelIdx = 0;
    } else if (levelIdx >= GRAY_LEVELS) {
      levelIdx = GRAY_LEVELS - 1;
    }
    let nibble = GRAY_LEVELS - 1 - levelIdx;
    nibble = Math.max(0, Math.min(15, nibble));

    if (firstNibble === null) {
      firstNibble = nibble;
    } else {
      if (outIdx < result.length) {
        result[outIdx] = (nibble << 4) | firstNibble;
        outIdx++;
      }
      firstNibble = null;
    }
  }

  return result;
}

export function applyUnsharpMask(
  pixels: Uint8Array | number[],
  width: number,
  height: number,
  sharpness: number = 0.5,
  radius: number = 1.0,
  threshold: number = 2
): Uint8Array {
  if (sharpness <= 0 || width <= 0 || height <= 0) {
    return pixels instanceof Uint8Array ? pixels : new Uint8Array(pixels);
  }

  const sigma = radius;
  const kRadius = Math.ceil(3 * sigma);
  const kernelSize = 2 * kRadius + 1;
  const kernel = new Float32Array(kernelSize);
  let kernelSum = 0;

  for (let i = -kRadius; i <= kRadius; i++) {
    const w = Math.exp(-0.5 * (i / sigma) * (i / sigma));
    kernel[i + kRadius] = w;
    kernelSum += w;
  }
  for (let i = 0; i < kernelSize; i++) {
    kernel[i] /= kernelSum;
  }

  const total = width * height;
  const temp = new Float32Array(total);
  const blurred = new Float32Array(total);

  // Separable Gaussian Blur: Horizontal pass
  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let k = -kRadius; k <= kRadius; k++) {
        let sx = x + k;
        if (sx < 0) sx = 0;
        else if (sx >= width) sx = width - 1;
        sum += pixels[rowOffset + sx] * kernel[k + kRadius];
      }
      temp[rowOffset + x] = sum;
    }
  }

  // Separable Gaussian Blur: Vertical pass
  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let k = -kRadius; k <= kRadius; k++) {
        let sy = y + k;
        if (sy < 0) sy = 0;
        else if (sy >= height) sy = height - 1;
        sum += temp[sy * width + x] * kernel[k + kRadius];
      }
      blurred[rowOffset + x] = sum;
    }
  }

  const result = new Uint8Array(total);
  for (let i = 0; i < total; i++) {
    const orig = pixels[i];
    const diff = orig - blurred[i];
    if (Math.abs(diff) >= threshold) {
      const val = Math.round(orig + sharpness * diff);
      result[i] = Math.max(0, Math.min(255, val));
    } else {
      result[i] = orig;
    }
  }

  return result;
}

export function resizeAndGrayscale(
  rgbaData: Uint8Array,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number
): Uint8Array {
  const gray = new Uint8Array(dstW * dstH);
  const xRatio = srcW / dstW;
  const yRatio = srcH / dstH;

  for (let dy = 0; dy < dstH; dy++) {
    const sy = Math.min(srcH - 1, Math.floor(dy * yRatio));
    for (let dx = 0; dx < dstW; dx++) {
      const sx = Math.min(srcW - 1, Math.floor(dx * xRatio));
      const srcIdx = (sy * srcW + sx) * 4;
      const r = rgbaData[srcIdx];
      const g = rgbaData[srcIdx + 1];
      const b = rgbaData[srcIdx + 2];
      const gVal = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      gray[dy * dstW + dx] = gVal;
    }
  }
  return gray;
}

