import jpeg from "jpeg-js";
import qrcode from "qrcode-generator";
import { base64ToUint8Array } from "../core/base64";
import {
  ditherGrayPixels,
  grayToNibbles,
  resizeAndGrayscale,
} from "../core/imageProcessor";
import {
  sendPrintJob,
  type PrintSettingsOptions,
} from "../core/printerService";
import {
  NFC_ICON_BITMAP_BASE64,
  NFC_ICON_SOURCE_SIZE,
  NFC_ICON_SVG_PATH,
  NFC_ICON_VIEWBOX_MIN,
  NFC_ICON_VIEWBOX_SIZE,
} from "./nfcIcon";

export const DEFAULT_QRCODE_SETTINGS: PrintSettingsOptions = {
  quality: 49,
  speed: 20,
  energy: 2000,
  chunkRows: 20,
  chunkDelayMs: 0,
  feed: 100,
};

export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

export interface EmbeddedLogoOptions {
  uri: string;
  base64?: string;
  sizeRatio?: number;
  padding?: number;
  borderRadius?: number;
}

export interface QRCodeGenerateOptions {
  text: string;
  size?: number;
  errorCorrection?: ErrorCorrectionLevel;
  logo?: EmbeddedLogoOptions;
  nfcLogo?: boolean;
}

export interface QRCodePrintData {
  svgXml: string;
  nibbleData: Uint8Array;
  width: number;
  height: number;
  actualQrSize: number;
  text: string;
  hasLogo: boolean;
  hasNfcLogo: boolean;
}

export function decodeBase64ToUint8Array(base64: string): Uint8Array {
  return base64ToUint8Array(base64);
}

const NFC_LOGO_SIZE_RATIO = 0.26;

function stampNfcIconPixels(
  pixels: Uint8Array,
  width: number,
  height: number,
  logoX: number,
  logoY: number,
  logoSize: number,
): void {
  const bitmap = base64ToUint8Array(NFC_ICON_BITMAP_BASE64);
  const sourceScale = NFC_ICON_SOURCE_SIZE / logoSize;

  for (let y = 0; y < logoSize; y++) {
    const sourceYStart = Math.floor(y * sourceScale);
    const sourceYEnd = Math.min(
      NFC_ICON_SOURCE_SIZE,
      Math.max(sourceYStart + 1, Math.ceil((y + 1) * sourceScale)),
    );

    for (let x = 0; x < logoSize; x++) {
      const sourceXStart = Math.floor(x * sourceScale);
      const sourceXEnd = Math.min(
        NFC_ICON_SOURCE_SIZE,
        Math.max(sourceXStart + 1, Math.ceil((x + 1) * sourceScale)),
      );

      let blackPixels = 0;
      let totalPixels = 0;

      for (let sourceY = sourceYStart; sourceY < sourceYEnd; sourceY++) {
        for (let sourceX = sourceXStart; sourceX < sourceXEnd; sourceX++) {
          const index = sourceY * NFC_ICON_SOURCE_SIZE + sourceX;
          const bit = (bitmap[index >> 3] >> (7 - (index & 7))) & 1;
          blackPixels += bit;
          totalPixels++;
        }
      }

      const targetX = logoX + x;
      const targetY = logoY + y;
      if (
        targetX >= 0 &&
        targetX < width &&
        targetY >= 0 &&
        targetY < height
      ) {
        pixels[targetY * width + targetX] =
          totalPixels > 0 && blackPixels * 2 >= totalPixels ? 0 : 255;
      }
    }
  }
}

function buildNfcLogoSvg(
  centerX: number,
  centerY: number,
  size: number,
): string {
  const scale = size / NFC_ICON_VIEWBOX_SIZE;
  const offsetX = centerX - size / 2 - NFC_ICON_VIEWBOX_MIN * scale;
  const offsetY = centerY - size / 2 - NFC_ICON_VIEWBOX_MIN * scale;

  return `<g id="nfc-logo">
  <g transform="translate(${offsetX.toFixed(2)} ${offsetY.toFixed(2)}) scale(${scale.toFixed(4)})">
    <path d="${NFC_ICON_SVG_PATH}" fill="#000000" />
  </g>
</g>`;
}

export function generateQRCodeData(
  options: QRCodeGenerateOptions,
): QRCodePrintData {
  const text = options.text.trim();
  if (!text) {
    throw new Error("QR code text cannot be empty");
  }

  // When center artwork is embedded, default to 'H' error correction (up to 30% recovery) if not specified
  const hasNfcLogo = Boolean(options.nfcLogo);
  const hasCenterArtwork = Boolean(options.logo) || hasNfcLogo;
  const errorCorrection =
    options.errorCorrection || (hasCenterArtwork ? "H" : "M");
  const targetSize = Math.max(50, Math.min(384, options.size || 280));
  const printerWidth = 384;

  const qr = qrcode(0, errorCorrection);
  qr.addData(text);
  qr.make();

  const moduleCount = qr.getModuleCount();
  const margin = 2; // module margins
  const totalModules = moduleCount + 2 * margin;

  const modulePixelSize = Math.max(1, Math.floor(targetSize / totalModules));
  const actualQrSize = totalModules * modulePixelSize;
  const height = actualQrSize;

  const offsetX = Math.floor((printerWidth - actualQrSize) / 2);

  // 1. Generate grayscale pixel buffer (255 = white, 0 = black)
  const pixels = new Uint8Array(printerWidth * height);
  pixels.fill(255);

  let svgRects = "";

  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (qr.isDark(r, c)) {
        const startX = offsetX + (c + margin) * modulePixelSize;
        const startY = (r + margin) * modulePixelSize;

        for (let dy = 0; dy < modulePixelSize; dy++) {
          const y = startY + dy;
          for (let dx = 0; dx < modulePixelSize; dx++) {
            const x = startX + dx;
            if (x >= 0 && x < printerWidth && y >= 0 && y < height) {
              pixels[y * printerWidth + x] = 0;
            }
          }
        }

        svgRects += `<rect x="${startX}" y="${startY}" width="${modulePixelSize}" height="${modulePixelSize}" fill="#000000" />\n`;
      }
    }
  }

  // 2. Handle embedded center artwork (custom logo or NFC badge)
  let logoSvg = "";
  if (hasCenterArtwork) {
    const sizeRatio = hasNfcLogo
      ? NFC_LOGO_SIZE_RATIO
      : Math.max(0.15, Math.min(0.3, options.logo?.sizeRatio || 0.22));
    const logoSize = Math.round(actualQrSize * sizeRatio);
    const bgPadding = hasNfcLogo ? 4 : options.logo?.padding ?? 4;
    const rx = hasNfcLogo ? 6 : options.logo?.borderRadius ?? 4;

    const logoX = offsetX + Math.floor((actualQrSize - logoSize) / 2);
    const logoY = Math.floor((actualQrSize - logoSize) / 2);

    const bgX = logoX - bgPadding;
    const bgY = logoY - bgPadding;
    const bgSize = logoSize + 2 * bgPadding;

    // Clear the center area in pixel buffer with pure white (255)
    for (let py = bgY; py < bgY + bgSize; py++) {
      for (let px = bgX; px < bgX + bgSize; px++) {
        if (px >= 0 && px < printerWidth && py >= 0 && py < height) {
          pixels[py * printerWidth + px] = 255;
        }
      }
    }

    if (hasNfcLogo) {
      const centerX = logoX + logoSize / 2;
      const centerY = logoY + logoSize / 2;

      stampNfcIconPixels(
        pixels,
        printerWidth,
        height,
        logoX,
        logoY,
        logoSize,
      );

      logoSvg = `
  <rect x="${bgX}" y="${bgY}" width="${bgSize}" height="${bgSize}" rx="${rx}" fill="#FFFFFF" />
  ${buildNfcLogoSvg(centerX, centerY, logoSize)}
`;
    } else if (options.logo) {
      // If base64 image data is provided, decode and stamp dithered logo into the pixel buffer
      if (options.logo.base64) {
        try {
          const bytes = decodeBase64ToUint8Array(options.logo.base64);
          const decoded = jpeg.decode(bytes, { useTArray: true });
          const logoGray = resizeAndGrayscale(
            decoded.data,
            decoded.width,
            decoded.height,
            logoSize,
            logoSize,
          );
          const logoDithered = ditherGrayPixels(logoGray, logoSize, logoSize);

          for (let ly = 0; ly < logoSize; ly++) {
            for (let lx = 0; lx < logoSize; lx++) {
              const py = logoY + ly;
              const px = logoX + lx;
              if (px >= 0 && px < printerWidth && py >= 0 && py < height) {
                pixels[py * printerWidth + px] = logoDithered[ly * logoSize + lx];
              }
            }
          }
        } catch {
          // If decoding fails, the clear white mask in center remains intact
        }
      }

      const imageHref = options.logo.base64
        ? options.logo.base64.startsWith("data:")
          ? options.logo.base64
          : `data:image/jpeg;base64,${options.logo.base64}`
        : options.logo.uri;

      logoSvg = `
  <rect x="${bgX}" y="${bgY}" width="${bgSize}" height="${bgSize}" rx="${rx}" fill="#FFFFFF" />
  <image href="${imageHref}" x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid slice" />
`;
    }
  }

  const svgXml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${printerWidth} ${height}" width="${printerWidth}" height="${height}">
  <rect width="${printerWidth}" height="${height}" fill="#FFFFFF" />
  ${svgRects}
  ${logoSvg}
</svg>`;

  const nibbleData = grayToNibbles(pixels, printerWidth, height);

  return {
    svgXml,
    nibbleData,
    width: printerWidth,
    height,
    actualQrSize,
    text,
    hasLogo: Boolean(options.logo) || hasNfcLogo,
    hasNfcLogo,
  };
}

export class QRCodeService {
  readonly printerWidth: number = 384;
  readonly defaultSettings: PrintSettingsOptions = DEFAULT_QRCODE_SETTINGS;

  decodeBase64(base64: string): Uint8Array {
    return decodeBase64ToUint8Array(base64);
  }

  generatePrintData(options: QRCodeGenerateOptions): QRCodePrintData {
    return generateQRCodeData(options);
  }

  async print(
    options: QRCodeGenerateOptions,
    settings: Partial<PrintSettingsOptions> = {},
  ): Promise<QRCodePrintData> {
    const printData = this.generatePrintData(options);
    const mergedSettings = { ...this.defaultSettings, ...settings };
    await sendPrintJob(printData.nibbleData, printData.width, mergedSettings);
    return printData;
  }
}

export const qrcodeService = new QRCodeService();
