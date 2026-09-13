import jpeg from "jpeg-js";
import qrcode from "qrcode-generator";
import {
  ditherGrayPixels,
  grayToNibbles,
  resizeAndGrayscale,
} from "../core/imageProcessor";
import {
  sendPrintJob,
  type PrintSettingsOptions,
} from "../core/printerService";
import { grayPixelsToJpegBase64 } from "./imageService";

export const DEFAULT_YOUTUBE_SETTINGS: PrintSettingsOptions = {
  quality: 50,
  speed: 20,
  energy: 3000,
  chunkRows: 20,
  chunkDelayMs: 0,
  feed: 100,
};

export interface YouTubePrintData {
  videoId: string;
  url: string;
  title: string;
  authorName?: string;
  thumbnailUrl: string;
  previewUri: string;
  svgXml: string;
  width: number;
  height: number;
  nibbleData: Uint8Array;
  grayPixels: Uint8Array;
}

export interface YouTubeMetadata {
  videoId: string;
  url: string;
  title: string;
  authorName?: string;
  thumbnailUrl: string;
}

export function extractYouTubeVideoId(url: string): string {
  const clean = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) {
    return clean;
  }
  const match = clean.match(
    /(?:v=|\/shorts\/|\/embed\/|\/v\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  if (match && match[1]) {
    return match[1];
  }
  throw new Error(
    "Invalid YouTube URL. Please provide a valid YouTube link or video ID.",
  );
}

export async function fetchYouTubeMetadata(
  url: string,
): Promise<YouTubeMetadata> {
  const videoId = extractYouTubeVideoId(url);
  const canonicalUrl = "https://www.youtube.com/watch?v=" + videoId;

  let title = "YouTube Video (" + videoId + ")";
  let authorName: string | undefined = undefined;

  try {
    const oembedUrl =
      "https://www.youtube.com/oembed?url=" +
      encodeURIComponent(canonicalUrl) +
      "&format=json";
    const res = await fetch(oembedUrl);
    if (res.ok) {
      const data = (await res.json()) as {
        title?: string;
        author_name?: string;
      };
      if (data.title) title = data.title;
      if (data.author_name) authorName = data.author_name;
    }
  } catch {
    // Fallback if oembed fails
  }

  const thumbnailUrl =
    "https://img.youtube.com/vi/" + videoId + "/hqdefault.jpg";
  return {
    videoId,
    url: canonicalUrl,
    title,
    authorName,
    thumbnailUrl,
  };
}

export async function fetchThumbnailBytes(
  videoId: string,
): Promise<{ bytes: Uint8Array; url: string }> {
  const resolutions = [
    "maxresdefault.jpg",
    "sddefault.jpg",
    "hqdefault.jpg",
    "default.jpg",
  ];
  for (const res of resolutions) {
    const thumbUrl = "https://img.youtube.com/vi/" + videoId + "/" + res;
    try {
      const resp = await fetch(thumbUrl);
      if (resp.ok) {
        const arrayBuf = await resp.arrayBuffer();
        if (arrayBuf.byteLength > 1000) {
          return { bytes: new Uint8Array(arrayBuf), url: thumbUrl };
        }
      }
    } catch {
      // Try next resolution
    }
  }
  throw new Error("Failed to download YouTube thumbnail image.");
}

export function overlayQrCode(
  grayBuffer: Uint8Array,
  bufW: number,
  bufH: number,
  url: string,
  qrSize = 76,
): void {
  const qr = qrcode(0, "M");
  qr.addData(url);
  qr.make();
  const modCount = qr.getModuleCount();
  const padding = 4;
  const innerSize = qrSize - 2 * padding;
  const modSize = innerSize / modCount;

  const startX = bufW - qrSize - 4;
  const startY = bufH - qrSize - 4;

  for (let y = startY; y < startY + qrSize; y++) {
    for (let x = startX; x < startX + qrSize; x++) {
      if (x >= 0 && x < bufW && y >= 0 && y < bufH) {
        grayBuffer[y * bufW + x] = 255;
      }
    }
  }

  for (let r = 0; r < modCount; r++) {
    for (let c = 0; c < modCount; c++) {
      if (qr.isDark(r, c)) {
        const mx = Math.round(startX + padding + c * modSize);
        const my = Math.round(startY + padding + r * modSize);
        const mx2 = Math.round(startX + padding + (c + 1) * modSize);
        const my2 = Math.round(startY + padding + (r + 1) * modSize);

        for (let py = my; py < my2; py++) {
          for (let px = mx; px < mx2; px++) {
            if (px >= 0 && px < bufW && py >= 0 && py < bufH) {
              grayBuffer[py * bufW + px] = 0;
            }
          }
        }
      }
    }
  }
}

export async function generateYouTubePrintData(
  url: string,
  printerWidth: number = 384,
): Promise<YouTubePrintData> {
  const meta = await fetchYouTubeMetadata(url);
  const { bytes, url: resolvedThumbUrl } = await fetchThumbnailBytes(
    meta.videoId,
  );

  const decoded = jpeg.decode(bytes, { useTArray: true });
  const targetHeight = Math.round(
    decoded.height * (printerWidth / decoded.width),
  );

  const grayPixels = resizeAndGrayscale(
    decoded.data,
    decoded.width,
    decoded.height,
    printerWidth,
    targetHeight,
  );

  overlayQrCode(grayPixels, printerWidth, targetHeight, meta.url, 76);

  const dithered = ditherGrayPixels(grayPixels, printerWidth, targetHeight);
  const nibbleData = grayToNibbles(dithered, printerWidth, targetHeight);
  const previewUri = grayPixelsToJpegBase64(
    dithered,
    printerWidth,
    targetHeight,
  );
  const svgXml = `<svg width="${printerWidth}" height="${targetHeight}" viewBox="0 0 ${printerWidth} ${targetHeight}" xmlns="http://www.w3.org/2000/svg">
  <image href="${previewUri}" width="${printerWidth}" height="${targetHeight}" />
</svg>`;

  return {
    videoId: meta.videoId,
    url: meta.url,
    title: meta.title,
    authorName: meta.authorName,
    thumbnailUrl: resolvedThumbUrl,
    previewUri,
    svgXml,
    width: printerWidth,
    height: targetHeight,
    nibbleData,
    grayPixels,
  };
}

export class YouTubeService {
  readonly defaultPrinterWidth: number = 384;
  readonly defaultQrSize: number = 76;
  readonly defaultSettings: PrintSettingsOptions = DEFAULT_YOUTUBE_SETTINGS;

  extractVideoId(url: string): string {
    return extractYouTubeVideoId(url);
  }

  async fetchMetadata(url: string): Promise<YouTubeMetadata> {
    return fetchYouTubeMetadata(url);
  }

  async fetchThumbnailBytes(
    videoId: string,
  ): Promise<{ bytes: Uint8Array; url: string }> {
    return fetchThumbnailBytes(videoId);
  }

  resizeAndGrayscale(
    rgbaData: Uint8Array,
    srcW: number,
    srcH: number,
    dstW: number,
    dstH: number,
  ): Uint8Array {
    return resizeAndGrayscale(rgbaData, srcW, srcH, dstW, dstH);
  }

  overlayQrCode(
    grayBuffer: Uint8Array,
    bufW: number,
    bufH: number,
    url: string,
    qrSize: number = this.defaultQrSize,
  ): void {
    overlayQrCode(grayBuffer, bufW, bufH, url, qrSize);
  }

  async generatePrintData(
    url: string,
    printerWidth: number = this.defaultPrinterWidth,
  ): Promise<YouTubePrintData> {
    return generateYouTubePrintData(url, printerWidth);
  }

  async print(
    url: string,
    settings: Partial<PrintSettingsOptions> = {},
  ): Promise<YouTubePrintData> {
    const printData = await this.generatePrintData(
      url,
      this.defaultPrinterWidth,
    );
    const mergedSettings = { ...this.defaultSettings, ...settings };
    await sendPrintJob(printData.nibbleData, printData.width, mergedSettings);
    return printData;
  }
}

export const youtubeService = new YouTubeService();
