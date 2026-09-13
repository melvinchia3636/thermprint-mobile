import dayjs from "dayjs";
import bwipjs from "bwip-js/generic";
import {
  sendPrintJob,
  type PrintSettingsOptions,
} from "../core/printerService";
import { grayToNibbles } from "../core/imageProcessor";

export interface SpineTagOptions {
  volume: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  code?: string;
}

export interface SpineTagPrintData {
  svgXml: string;
  dmtxSvg: string;
  volumeStr: string;
  formattedStart: string;
  formattedEnd: string;
  width: number;
  height: number;
  code: string;
  payload: string;
  nibbleData?: Uint8Array;
}

export const DEFAULT_SPINE_TAG_SETTINGS: PrintSettingsOptions = {
  quality: 51,
  speed: 20,
  energy: 5000,
  chunkRows: 20,
  chunkDelayMs: 0,
  feed: 100,
};

export function generateRandomCode(length: number = 16): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateSpineTagData(
  options: SpineTagOptions,
): SpineTagPrintData {
  const width = 384;
  const height = 120;
  const volumeStr = (options.volume || "1").padStart(3, "0");
  const code =
    options.code && options.code.trim().length > 0
      ? options.code.trim().toUpperCase()
      : generateRandomCode();

  const startDateIso = dayjs(options.startDate).isValid()
    ? dayjs(options.startDate).format("YYYY-MM-DD")
    : options.startDate;
  const endDateIso = dayjs(options.endDate).isValid()
    ? dayjs(options.endDate).format("YYYY-MM-DD")
    : options.endDate;

  const payload = `${options.volume},${startDateIso},${endDateIso},${code}`;

  const formattedStart = dayjs(startDateIso).isValid()
    ? dayjs(startDateIso).format("DD/MM/YYYY")
    : startDateIso;
  const formattedEnd = dayjs(endDateIso).isValid()
    ? dayjs(endDateIso).format("DD/MM/YYYY")
    : endDateIso;

  // Generate Data Matrix barcode
  const rawDmtx = bwipjs.raw({
    bcid: "datamatrix",
    text: payload,
  });
  const entry = rawDmtx[0];
  if (!entry || !("pixs" in entry)) {
    throw new Error("Failed to generate Data Matrix barcode");
  }
  const { pixs, pixx, pixy } = entry;
  const dmtxSize = 84;
  const dmtxX = 18;
  const dmtxY = 18;

  let dmtxSvgPaths = "";
  for (let my = 0; my < pixy; my++) {
    for (let mx = 0; mx < pixx; mx++) {
      if (pixs[my * pixx + mx] === 1) {
        const rx = (dmtxX + (mx * dmtxSize) / pixx).toFixed(2);
        const ry = (dmtxY + (my * dmtxSize) / pixy).toFixed(2);
        const rw = (
          ((mx + 1) * dmtxSize) / pixx -
          (mx * dmtxSize) / pixx +
          0.05
        ).toFixed(2);
        const rh = (
          ((my + 1) * dmtxSize) / pixy -
          (my * dmtxSize) / pixy +
          0.05
        ).toFixed(2);
        dmtxSvgPaths += `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="#000" />\n`;
      }
    }
  }

  // Volume vertical stack (3 digits centered at x=155)
  const centerXMid = 155;
  const charSpacing = 26;
  const startVolY = 42;
  let volumeSvgText = "";
  for (let i = 0; i < volumeStr.length; i++) {
    const yPos = startVolY + i * charSpacing;
    volumeSvgText += `<text x="${centerXMid}" y="${yPos}" text-anchor="middle" font-family="IBMPlexSans_700Bold" font-weight="bold" font-size="28" letter-spacing="-0.5" fill="#000">${volumeStr[i]}</text>\n`;
  }

  // Right dates section (left aligned at x=214)
  const xStart = 214;
  const datesSvgText = `
    <text x="${xStart}" y="37" font-family="IBMPlexSans_700Bold" font-weight="bold" font-size="16" letter-spacing="0" fill="#000">START</text>
    <text x="${xStart}" y="55" font-family="IBMPlexSans_400Regular" font-size="18" letter-spacing="0" fill="#000">${formattedStart}</text>
    <text x="${xStart}" y="78" font-family="IBMPlexSans_700Bold" font-weight="bold" font-size="16" letter-spacing="0" fill="#000">END</text>
    <text x="${xStart}" y="96" font-family="IBMPlexSans_400Regular" font-size="18" letter-spacing="0" fill="#000">${formattedEnd}</text>
  `;

  const svgXml = `
<svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#fff" />
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" fill="none" stroke="#000" stroke-width="1" />
  <!-- Data Matrix -->
  ${dmtxSvgPaths}
  <!-- Separating Lines -->
  <line x1="120.5" y1="0" x2="120.5" y2="${height}" stroke="#000" stroke-width="1" />
  <line x1="190.5" y1="0" x2="190.5" y2="${height}" stroke="#000" stroke-width="1" />
  <!-- Volume Number -->
  ${volumeSvgText}
  <!-- Dates -->
  ${datesSvgText}
</svg>
`.trim();

  // Generate fallback bitmap for tests/headless
  const buffer = new Uint8Array(width * height);
  buffer.fill(255);
  // Border
  for (let x = 0; x < width; x++) {
    buffer[x] = 0;
    buffer[(height - 1) * width + x] = 0;
  }
  for (let y = 0; y < height; y++) {
    buffer[y * width] = 0;
    buffer[y * width + (width - 1)] = 0;
    buffer[y * width + 120] = 0;
    buffer[y * width + 190] = 0;
  }
  // Data matrix modules into buffer
  for (let dy = 0; dy < dmtxSize; dy++) {
    const my = Math.floor((dy / dmtxSize) * pixy);
    for (let dx = 0; dx < dmtxSize; dx++) {
      const mx = Math.floor((dx / dmtxSize) * pixx);
      if (pixs[my * pixx + mx] === 1) {
        buffer[(dmtxY + dy) * width + (dmtxX + dx)] = 0;
      }
    }
  }
  const nibbleData = grayToNibbles(buffer, width, height);

  return {
    svgXml,
    dmtxSvg: dmtxSvgPaths,
    volumeStr,
    formattedStart,
    formattedEnd,
    width,
    height,
    code,
    payload,
    nibbleData,
  };
}

export class SpineTagService {
  public generateRandomCode(length: number = 16): string {
    return generateRandomCode(length);
  }

  public generatePrintData(options: SpineTagOptions): SpineTagPrintData {
    return generateSpineTagData(options);
  }

  public async print(
    options: SpineTagOptions,
    viewRef?: import("../core/viewRasterizer").ViewCaptureTarget,
    settings: PrintSettingsOptions = DEFAULT_SPINE_TAG_SETTINGS,
  ): Promise<SpineTagPrintData> {
    const data = this.generatePrintData(options);

    let nibbles = data.nibbleData;
    let printWidth = data.width;

    if (viewRef) {
      const { rasterizeViewToNibbles } = await import("../core/viewRasterizer");
      const rasterized = await rasterizeViewToNibbles(viewRef, 384);
      nibbles = rasterized.nibbleData;
      printWidth = rasterized.width;
    }

    if (!nibbles) {
      throw new Error("No print data available for Spine Tag.");
    }

    await sendPrintJob(nibbles, printWidth, settings);

    return data;
  }
}

export const spineTagService = new SpineTagService();
