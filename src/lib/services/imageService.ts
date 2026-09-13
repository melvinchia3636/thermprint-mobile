import type { Action } from "expo-image-manipulator";
import jpeg from "jpeg-js";
import { base64ToUint8Array, uint8ArrayToBase64 } from "../core/base64";
import {
  applyUnsharpMask,
  ditherGrayPixels,
  grayToNibbles,
  resizeAndGrayscale,
  type DitherMethod,
} from "../core/imageProcessor";
import { GRAY_LEVELS } from "../core/protocol";
import {
  sendPrintJob,
  type PrintSettingsOptions,
} from "../core/printerService";

export interface ImageOptions {
  contrast?: number; // 0.0 to 5.0 (default: 1.0)
  gamma?: number; // 0.1 to 5.0 (default: 1.0)
  rotate?: 0 | 90 | 180 | 270; // (default: 0)
  disablePreprocessing?: boolean; // (default: false)
  disableDithering?: boolean; // (default: false)
  ditherMethod?: DitherMethod; // (default: 'floyd-steinberg')
  splitCols?: number; // 1 to 10 (default: 1)
  splitRows?: number; // 1 to 10 (default: 1)
  thresholdScale?: number; // (default: 0.46)
  lowThreshold?: number; // (default: 0.2)
  highThreshold?: number; // (default: 0.2)
  lowValue?: number; // (default: 110)
  highValue?: number; // (default: 150)
  grayScale?: number; // (default: 1.0)
  sharpness?: number; // (default: 0.0)
}

export interface ProcessedImageData {
  previewUri: string;
  nibbleData: Uint8Array;
  width: number;
  height: number;
  origWidth: number;
  origHeight: number;
  totalStrips: number;
}

export const DEFAULT_IMAGE_SETTINGS: PrintSettingsOptions = {
  quality: 50,
  speed: 20,
  energy: 0,
  chunkRows: 20,
  chunkDelayMs: 200,
  feed: 100,
};

export function quantizeGrayPixels(
  grayPixels: Uint8Array | number[],
): Uint8Array {
  const stepIn = Math.floor(256 / GRAY_LEVELS);
  const stepOut = Math.floor(255 / (GRAY_LEVELS - 1));
  const res = new Uint8Array(grayPixels.length);
  for (let i = 0; i < grayPixels.length; i++) {
    const level = Math.max(
      0,
      Math.min(GRAY_LEVELS - 1, Math.floor(grayPixels[i] / stepIn)),
    );
    res[i] = level * stepOut;
  }
  return res;
}

export function applyImagePreprocessing(
  pixels: Uint8Array | number[],
  widthOrOptions?: number | ImageOptions,
  height?: number,
  options?: ImageOptions,
): Uint8Array {
  let width = 0;
  let imgHeight = 0;
  let opts: ImageOptions = {};

  if (typeof widthOrOptions === "number") {
    width = widthOrOptions;
    imgHeight = height ?? 0;
    opts = options ?? {};
  } else if (widthOrOptions && typeof widthOrOptions === "object") {
    opts = widthOrOptions;
  }

  const contrast = opts.contrast ?? 1.0;
  const gamma = opts.gamma ?? 1.0;
  const thresholdScale = opts.thresholdScale ?? 0.46;
  const lowThreshold = opts.lowThreshold ?? 0.2;
  const highThreshold = opts.highThreshold ?? 0.2;
  const lowValue = opts.lowValue ?? 110;
  const highValue = opts.highValue ?? 150;
  const grayScale = opts.grayScale ?? 1.0;
  const sharpness = opts.sharpness ?? 0.0;

  let workingPixels = pixels;
  if (sharpness > 0 && width > 0 && imgHeight > 0) {
    workingPixels = applyUnsharpMask(
      workingPixels,
      width,
      imgHeight,
      sharpness,
      1.0,
      2,
    );
  }

  const total = workingPixels.length;
  const histogram = new Int32Array(256);
  for (let i = 0; i < total; i++) {
    histogram[workingPixels[i]]++;
  }

  const lowCumulativeTarget = Math.floor(total * lowThreshold);
  const highCumulativeTarget = Math.floor(total * highThreshold);

  let cumulative = 0;
  let lowPercentile = 0;
  for (let i = 0; i < 256; i++) {
    cumulative += histogram[i];
    if (cumulative > lowCumulativeTarget) {
      lowPercentile = i;
      break;
    }
  }

  cumulative = 0;
  let highPercentile = 255;
  for (let i = 255; i >= 0; i--) {
    cumulative += histogram[i];
    if (cumulative > highCumulativeTarget) {
      highPercentile = i;
      break;
    }
  }

  lowPercentile = Math.min(lowPercentile, lowValue);
  highPercentile = Math.max(highPercentile, highValue);

  const scale = thresholdScale;
  const lowMapped = lowPercentile * scale;
  const highMapped = highPercentile + (255 - highPercentile) * (1.0 - scale);
  const midRange = highMapped - lowMapped;
  const midDenom =
    highPercentile !== lowPercentile ? highPercentile - lowPercentile : 1;

  const processed = new Uint8Array(total);
  const invGamma = gamma !== 1.0 ? 1.0 / gamma : 1.0;

  for (let i = 0; i < total; i++) {
    const p = workingPixels[i];
    let out: number;
    if (p <= lowPercentile) {
      out = p * scale;
    } else if (p >= highPercentile) {
      out = p + (255 - p) * (1.0 - scale);
    } else {
      const ratio = (p - lowPercentile) / midDenom;
      out = ratio * midRange + lowMapped;
    }
    out = Math.round(out * grayScale);
    out = Math.max(0, Math.min(255, out));

    // Contrast
    if (contrast !== 1.0) {
      out = Math.round((out - 128) * contrast + 128);
      out = Math.max(0, Math.min(255, out));
    }

    // Gamma
    if (gamma !== 1.0) {
      out = Math.min(255, Math.round(255.0 * Math.pow(out / 255.0, invGamma)));
    }

    // Edge clamping
    if (out > 250) {
      out = 255;
    } else if (out < 5) {
      out = 0;
    }

    processed[i] = out;
  }

  return processed;
}

export function buildPrintStrip(
  ditheredPixels: Int32Array | Uint8Array,
  fullWidth: number,
  fullHeight: number,
  cols: number,
  rows: number,
  printerWidth: number = 384,
): {
  stripPixels: Uint8Array;
  stripWidth: number;
  stripHeight: number;
} {
  const cellW = Math.floor(fullWidth / cols);
  const cellH = Math.floor(fullHeight / rows);
  const total = cols * rows;
  const canvasH = total * cellH;

  const canvas = new Uint8Array(printerWidth * canvasH);
  canvas.fill(255);

  const dashGap = 8;
  const dashLength = 8;

  for (let idx = 0; idx < total; idx++) {
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    const left = c * cellW;
    const top = r * cellH;
    const yOffset = idx * cellH;

    for (let dy = 0; dy < cellH; dy++) {
      const srcY = top + dy;
      if (srcY >= fullHeight) continue;
      const dstY = yOffset + dy;
      for (let dx = 0; dx < Math.min(cellW, printerWidth); dx++) {
        const srcX = left + dx;
        if (srcX >= fullWidth) continue;
        canvas[dstY * printerWidth + dx] =
          ditheredPixels[srcY * fullWidth + srcX];
      }
    }
  }

  // Draw dashed separation lines between cells
  for (let idx = 0; idx < total - 1; idx++) {
    const sepY = (idx + 1) * cellH;
    if (sepY >= canvasH) continue;
    for (let line = 0; line < 2; line++) {
      const lineY = sepY - line;
      if (lineY < 0 || lineY >= canvasH) continue;
      for (let x = 0; x < printerWidth; x++) {
        const isDashed =
          Math.floor(x / (dashGap * 2)) % 2 === 0 &&
          x % (dashGap * 2) < dashLength;
        canvas[lineY * printerWidth + x] = isDashed ? 0 : 255;
      }
    }
  }

  return {
    stripPixels: canvas,
    stripWidth: printerWidth,
    stripHeight: canvasH,
  };
}

export function drawAnnotatedPreview(
  ditheredPixels: Uint8Array | Int32Array | number[],
  width: number,
  height: number,
  cols: number,
  rows: number,
): string {
  const stepIn = Math.floor(256 / GRAY_LEVELS);
  const thermalGamma = 1.6;
  const rgba = new Uint8Array(width * height * 4);

  for (let i = 0; i < width * height; i++) {
    const rawVal = ditheredPixels[i];
    let levelIdx = Math.floor(rawVal / stepIn);
    if (levelIdx < 0) levelIdx = 0;
    else if (levelIdx >= GRAY_LEVELS) levelIdx = GRAY_LEVELS - 1;

    const nibble = GRAY_LEVELS - 1 - levelIdx;
    const linearGray = 255 - Math.floor((nibble * 255) / (GRAY_LEVELS - 1));
    const grayOut = Math.floor(
      255 * Math.pow(linearGray / 255.0, thermalGamma),
    );

    const idx = i * 4;
    rgba[idx] = grayOut;
    rgba[idx + 1] = grayOut;
    rgba[idx + 2] = grayOut;
    rgba[idx + 3] = 255;
  }

  const cellW = Math.floor(width / cols);
  const cellH = Math.floor(height / rows);

  // Vertical split lines (red dashed)
  for (let c = 1; c < cols; c++) {
    const x = c * cellW;
    for (let y = 0; y < height; y++) {
      if (Math.floor(y / 6) % 2 === 0) {
        const idx = (y * width + x) * 4;
        rgba[idx] = 239; // Red R
        rgba[idx + 1] = 68; // Red G
        rgba[idx + 2] = 68; // Red B
      }
    }
  }

  // Horizontal split lines (red dashed)
  for (let r = 1; r < rows; r++) {
    const y = r * cellH;
    for (let x = 0; x < width; x++) {
      if (Math.floor(x / 6) % 2 === 0) {
        const idx = (y * width + x) * 4;
        rgba[idx] = 239;
        rgba[idx + 1] = 68;
        rgba[idx + 2] = 68;
      }
    }
  }

  const encoded = jpeg.encode({ data: rgba, width, height }, 85);
  const base64 = uint8ArrayToBase64(encoded.data);
  return `data:image/jpeg;base64,${base64}`;
}

export function grayPixelsToJpegBase64(
  pixels: Uint8Array | Int32Array | number[],
  width: number,
  height: number,
): string {
  const stepIn = Math.floor(256 / GRAY_LEVELS);
  const thermalGamma = 1.6;
  const rgba = new Uint8Array(width * height * 4);

  for (let i = 0; i < width * height; i++) {
    const rawVal = pixels[i];
    let levelIdx = Math.floor(rawVal / stepIn);
    if (levelIdx < 0) levelIdx = 0;
    else if (levelIdx >= GRAY_LEVELS) levelIdx = GRAY_LEVELS - 1;

    const nibble = GRAY_LEVELS - 1 - levelIdx;
    const linearGray = 255 - Math.floor((nibble * 255) / (GRAY_LEVELS - 1));
    const grayOut = Math.floor(
      255 * Math.pow(linearGray / 255.0, thermalGamma),
    );

    const idx = i * 4;
    rgba[idx] = grayOut;
    rgba[idx + 1] = grayOut;
    rgba[idx + 2] = grayOut;
    rgba[idx + 3] = 255;
  }

  const encoded = jpeg.encode({ data: rgba, width, height }, 85);
  const base64 = uint8ArrayToBase64(encoded.data);
  return `data:image/jpeg;base64,${base64}`;
}

export async function processImageUri(
  uri: string,
  options: ImageOptions = {},
): Promise<ProcessedImageData> {
  const cols = Math.max(1, Math.min(10, options.splitCols || 1));
  const rows = Math.max(1, Math.min(10, options.splitRows || 1));
  const targetWidth = 384 * cols;

  const ImageManipulator = await import("expo-image-manipulator");

  const actions: Action[] = [];
  if (options.rotate) {
    actions.push({ rotate: options.rotate });
  }
  actions.push({ resize: { width: targetWidth } });

  const manip = await ImageManipulator.manipulateAsync(uri, actions, {
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });

  if (!manip.base64) {
    throw new Error("Failed to manipulate image.");
  }

  const jpegBytes = base64ToUint8Array(manip.base64);
  const decoded = jpeg.decode(jpegBytes, { useTArray: true });
  const width = decoded.width;
  const height = decoded.height;

  const rawGray = resizeAndGrayscale(
    decoded.data,
    decoded.width,
    decoded.height,
    width,
    height,
  );

  let dithered: Uint8Array;
  if (options.disablePreprocessing) {
    dithered = quantizeGrayPixels(rawGray);
  } else {
    const preprocessed = applyImagePreprocessing(
      rawGray,
      width,
      height,
      options,
    );
    const method: DitherMethod = options.disableDithering
      ? "none"
      : (options.ditherMethod ?? "floyd-steinberg");
    dithered = ditherGrayPixels(preprocessed, width, height, method);
  }

  let finalNibbles: Uint8Array;
  let printWidth = width;
  let printHeight = height;
  let previewUri: string;

  if (cols > 1 || rows > 1) {
    previewUri = drawAnnotatedPreview(dithered, width, height, cols, rows);
    const strip = buildPrintStrip(dithered, width, height, cols, rows, 384);
    printWidth = strip.stripWidth;
    printHeight = strip.stripHeight;
    finalNibbles = grayToNibbles(strip.stripPixels, printWidth, printHeight);
  } else {
    previewUri = grayPixelsToJpegBase64(dithered, width, height);
    finalNibbles = grayToNibbles(dithered, width, height);
  }

  return {
    previewUri,
    nibbleData: finalNibbles,
    width: printWidth,
    height: printHeight,
    origWidth: decoded.width,
    origHeight: decoded.height,
    totalStrips: cols * rows,
  };
}

export interface CropRect {
  originX: number;
  originY: number;
  width: number;
  height: number;
}

export class ImageService {
  public async pickImageFromLibrary(
    allowsEditing = true,
  ): Promise<string | null> {
    const ImagePicker = await import("expo-image-picker");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0].uri;
    }
    return null;
  }

  public async pickImageFromCamera(
    allowsEditing = true,
  ): Promise<string | null> {
    const ImagePicker = await import("expo-image-picker");
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new Error("Camera permission is required to take photos.");
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0].uri;
    }
    return null;
  }

  public async cropImage(uri: string, crop: CropRect): Promise<string> {
    const ImageManipulator = await import("expo-image-manipulator");
    const manip = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          crop: {
            originX: Math.max(0, Math.round(crop.originX)),
            originY: Math.max(0, Math.round(crop.originY)),
            width: Math.max(1, Math.round(crop.width)),
            height: Math.max(1, Math.round(crop.height)),
          },
        },
      ],
      {
        format: ImageManipulator.SaveFormat.JPEG,
        compress: 1,
      },
    );
    return manip.uri;
  }

  public async getImageDimensions(
    uri: string,
  ): Promise<{ width: number; height: number }> {
    const { Image } = await import("react-native");
    return new Promise((resolve, reject) => {
      Image.getSize(
        uri,
        (width, height) => resolve({ width, height }),
        (error) => reject(error),
      );
    });
  }

  public async process(
    uri: string,
    options: ImageOptions = {},
  ): Promise<ProcessedImageData> {
    return await processImageUri(uri, options);
  }

  public async print(
    processedData: ProcessedImageData | null,
    settings: PrintSettingsOptions = DEFAULT_IMAGE_SETTINGS,
  ): Promise<void> {
    if (!processedData) return;

    await sendPrintJob(processedData.nibbleData, processedData.width, settings);
  }
}

export const imageService = new ImageService();
