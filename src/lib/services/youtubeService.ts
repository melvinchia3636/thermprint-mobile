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
  duration?: string;
  thumbnailUrl: string;
  previewUri: string;
  svgXml: string;
  width: number;
  height: number;
  nibbleData: Uint8Array;
}

export interface YouTubeMetadata {
  videoId: string;
  url: string;
  title: string;
  authorName?: string;
  duration?: string;
  durationSeconds?: number;
  thumbnailUrl: string;
}

const INFO_PADDING = 10;
const INFO_SIDE_PADDING = 6;
const QR_SIZE = 76;
const TITLE_FONT_SIZE = 16;
const TITLE_LINE_HEIGHT = 20;
const AUTHOR_FONT_SIZE = 13;
const AUTHOR_LINE_HEIGHT = 18;
const MAX_TITLE_LINES = 3;
const DURATION_FONT_SIZE = 15;
const DURATION_BADGE_PADDING = 6;
const DURATION_BADGE_HEIGHT = DURATION_FONT_SIZE + 2 * DURATION_BADGE_PADDING;
const DURATION_BADGE_MARGIN = 8;
const FONT_BOLD = "DMSans_700Bold, DM Sans, sans-serif";
const FONT_REGULAR = "DMSans_400Regular, DM Sans, sans-serif";
const AVG_CHAR_WIDTH_RATIO = 0.55;

export function formatYouTubeDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return hrs > 0
    ? `${hrs}:${pad(mins)}:${pad(secs)}`
    : `${mins}:${pad(secs)}`;
}

export async function fetchYouTubeDuration(
  videoId: string,
): Promise<number | undefined> {
  try {
    const watchUrl = "https://www.youtube.com/watch?v=" + videoId;
    const res = await fetch(watchUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!res.ok) return undefined;
    const html = await res.text();
    const match = html.match(/"lengthSeconds":"(\d+)"/);
    if (match && match[1]) {
      const seconds = parseInt(match[1], 10);
      if (Number.isFinite(seconds) && seconds > 0) return seconds;
    }
  } catch {
    // Duration is optional; ignore failures
  }
  return undefined;
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

  const durationSeconds = await fetchYouTubeDuration(videoId);

  const thumbnailUrl =
    "https://img.youtube.com/vi/" + videoId + "/hqdefault.jpg";
  return {
    videoId,
    url: canonicalUrl,
    title,
    authorName,
    duration:
      durationSeconds !== undefined
        ? formatYouTubeDuration(durationSeconds)
        : undefined,
    durationSeconds,
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

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function wrapYouTubeTitle(
  title: string,
  maxWidth: number,
  fontSize: number = TITLE_FONT_SIZE,
): string[] {
  const maxChars = Math.max(
    1,
    Math.floor(maxWidth / (fontSize * AVG_CHAR_WIDTH_RATIO)),
  );
  const words = title.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  const pushWord = (word: string) => {
    let remaining = word;
    while (remaining.length > maxChars) {
      lines.push(remaining.slice(0, maxChars));
      remaining = remaining.slice(maxChars);
    }
    return remaining;
  };

  if (words.length === 0) return ["YouTube Video"];

  for (const word of words) {
    if (current.length === 0) {
      current = pushWord(word);
    } else if (current.length + 1 + word.length <= maxChars) {
      current += " " + word;
    } else {
      lines.push(current);
      current = pushWord(word);
    }
  }

  if (current.length > 0) lines.push(current);
  return lines;
}

export function truncateLines(lines: string[], maxLines: number): string[] {
  if (lines.length <= maxLines) return lines;
  const truncated = lines.slice(0, maxLines);
  const last = truncated[maxLines - 1];
  const ellipsis = "..";
  truncated[maxLines - 1] =
    last.length > ellipsis.length
      ? last.slice(0, last.length - ellipsis.length) + ellipsis
      : ellipsis;
  return truncated;
}

export interface YouTubeSvgOptions {
  width: number;
  thumbnailHeight: number;
  thumbnailDataUri: string;
  title: string;
  authorName?: string;
  duration?: string;
  url: string;
  qrSize?: number;
}

export interface YouTubeSvgResult {
  svgXml: string;
  width: number;
  height: number;
}

export function generateYouTubeSvg(
  options: YouTubeSvgOptions,
): YouTubeSvgResult {
  const {
    width,
    thumbnailHeight,
    thumbnailDataUri,
    title,
    authorName,
    duration,
    url,
    qrSize = QR_SIZE,
  } = options;

  const qrX = width - qrSize - INFO_SIDE_PADDING;
  const textX = INFO_SIDE_PADDING;
  const textMaxWidth = qrX - textX;

  const titleLines = truncateLines(
    wrapYouTubeTitle(title, textMaxWidth),
    MAX_TITLE_LINES,
  );
  const titleBlockHeight = titleLines.length * TITLE_LINE_HEIGHT;
  const textBlockHeight =
    titleBlockHeight + (authorName ? AUTHOR_LINE_HEIGHT : 0);
  const contentHeight = Math.max(qrSize, textBlockHeight);
  const bandHeight = contentHeight + INFO_PADDING * 2;
  const height = thumbnailHeight + bandHeight;

  const contentTop =
    thumbnailHeight +
    INFO_PADDING +
    Math.floor((contentHeight - textBlockHeight) / 2);

  const qr = qrcode(0, "M");
  qr.addData(url);
  qr.make();
  const modCount = qr.getModuleCount();
  const qrPadding = 4;
  const modSize = (qrSize - 2 * qrPadding) / modCount;
  const qrY =
    thumbnailHeight +
    INFO_PADDING +
    Math.floor((contentHeight - qrSize) / 2);

  let qrRects = "";
  for (let r = 0; r < modCount; r++) {
    for (let c = 0; c < modCount; c++) {
      if (!qr.isDark(r, c)) continue;
      const x = (qrX + qrPadding + c * modSize).toFixed(2);
      const y = (qrY + qrPadding + r * modSize).toFixed(2);
      qrRects += `<rect x="${x}" y="${y}" width="${modSize.toFixed(2)}" height="${modSize.toFixed(2)}" fill="#000000" />\n`;
    }
  }

  const titleSvg = titleLines
    .map((line, i) => {
      const y = contentTop + TITLE_FONT_SIZE + i * TITLE_LINE_HEIGHT;
      return `<text x="${textX}" y="${y}" font-family="${FONT_BOLD}" font-size="${TITLE_FONT_SIZE}" font-weight="bold" fill="#000000">${escapeXml(line)}</text>`;
    })
    .join("\n  ");

  const authorSvg = authorName
    ? `<text x="${textX}" y="${contentTop + titleBlockHeight + AUTHOR_FONT_SIZE}" font-family="${FONT_REGULAR}" font-size="${AUTHOR_FONT_SIZE}" fill="#000000">${escapeXml(authorName)}</text>`
    : "";

  let durationSvg = "";
  if (duration) {
    const textWidth =
      duration.length * DURATION_FONT_SIZE * AVG_CHAR_WIDTH_RATIO;
    const badgeWidth = Math.ceil(textWidth + 2 * DURATION_BADGE_PADDING);
    const badgeX = width - DURATION_BADGE_MARGIN - badgeWidth;
    const badgeY = thumbnailHeight - DURATION_BADGE_MARGIN - DURATION_BADGE_HEIGHT;
    const textBaseline =
      badgeY + DURATION_BADGE_HEIGHT / 2 + DURATION_FONT_SIZE * 0.35;
    durationSvg = `<rect x="${badgeX}" y="${badgeY}" width="${badgeWidth}" height="${DURATION_BADGE_HEIGHT}" rx="4" fill="#000000" />
  <text x="${badgeX + DURATION_BADGE_PADDING}" y="${textBaseline}" font-family="${FONT_BOLD}" font-size="${DURATION_FONT_SIZE}" font-weight="bold" fill="#FFFFFF">${escapeXml(duration)}</text>`;
  }

  const svgXml = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#FFFFFF" />
  <image href="${thumbnailDataUri}" x="0" y="0" width="${width}" height="${thumbnailHeight}" preserveAspectRatio="none" />
  ${durationSvg}
  <line x1="0" y1="${thumbnailHeight}" x2="${width}" y2="${thumbnailHeight}" stroke="#000000" stroke-width="2" />
  ${titleSvg}
  ${authorSvg}
  ${qrRects}
</svg>`;

  return { svgXml, width, height };
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
  const thumbnailHeight = Math.round(
    decoded.height * (printerWidth / decoded.width),
  );

  const thumbnailGray = resizeAndGrayscale(
    decoded.data,
    decoded.width,
    decoded.height,
    printerWidth,
    thumbnailHeight,
  );
  const thumbnailDithered = ditherGrayPixels(
    thumbnailGray,
    printerWidth,
    thumbnailHeight,
  );
  const thumbnailDataUri = grayPixelsToJpegBase64(
    thumbnailDithered,
    printerWidth,
    thumbnailHeight,
  );
  const { svgXml, height } = generateYouTubeSvg({
    width: printerWidth,
    thumbnailHeight,
    thumbnailDataUri,
    title: meta.title,
    authorName: meta.authorName,
    duration: meta.duration,
    url: meta.url,
  });

  const blank = new Uint8Array(printerWidth * height);
  blank.fill(255);
  const nibbleData = grayToNibbles(blank, printerWidth, height);

  return {
    videoId: meta.videoId,
    url: meta.url,
    title: meta.title,
    authorName: meta.authorName,
    duration: meta.duration,
    thumbnailUrl: resolvedThumbUrl,
    previewUri: thumbnailDataUri,
    svgXml,
    width: printerWidth,
    height,
    nibbleData,
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

  generateSvg(options: YouTubeSvgOptions): YouTubeSvgResult {
    return generateYouTubeSvg(options);
  }

  async generatePrintData(
    url: string,
    printerWidth: number = this.defaultPrinterWidth,
  ): Promise<YouTubePrintData> {
    return generateYouTubePrintData(url, printerWidth);
  }

  async print(
    url: string,
    viewRef?: import("../core/viewRasterizer").ViewCaptureTarget,
    settings: Partial<PrintSettingsOptions> = {},
  ): Promise<YouTubePrintData> {
    const printData = await this.generatePrintData(
      url,
      this.defaultPrinterWidth,
    );

    let nibbles = printData.nibbleData;
    let printWidth = printData.width;

    if (viewRef) {
      const { rasterizeViewToNibbles } = await import("../core/viewRasterizer");
      const rasterized = await rasterizeViewToNibbles(
        viewRef,
        this.defaultPrinterWidth,
      );
      nibbles = rasterized.nibbleData;
      printWidth = rasterized.width;
    }

    const mergedSettings = { ...this.defaultSettings, ...settings };
    await sendPrintJob(nibbles, printWidth, mergedSettings);
    return printData;
  }
}

export const youtubeService = new YouTubeService();
