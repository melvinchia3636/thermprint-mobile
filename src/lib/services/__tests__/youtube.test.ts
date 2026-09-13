import { describe, it, expect } from "bun:test";
import {
  extractYouTubeVideoId,
  overlayQrCode,
  youtubeService,
} from "../youtubeService";

describe("YouTube Video ID Parser", () => {
  it("should parse standard watch URLs", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(extractYouTubeVideoId("https://youtube.com/watch?v=dQw4w9WgXcQ&t=10s")).toBe("dQw4w9WgXcQ");
  });

  it("should parse short youtu.be URLs", () => {
    expect(extractYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(extractYouTubeVideoId("http://youtu.be/dQw4w9WgXcQ?t=5")).toBe("dQw4w9WgXcQ");
  });

  it("should parse shorts URLs", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("should parse embed URLs", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("should accept raw 11-character video ID", () => {
    expect(extractYouTubeVideoId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("should throw error on invalid URLs", () => {
    expect(() => extractYouTubeVideoId("https://google.com")).toThrow();
    expect(() => extractYouTubeVideoId("not-a-url")).toThrow();
  });
});

describe("YouTube Image Processing & QR Overlay", () => {
  it("should resize and grayscale RGBA buffers accurately", () => {
    const srcW = 2;
    const srcH = 2;
    const rgba = new Uint8Array([
      255, 255, 255, 255, // white
      0, 0, 0, 255,       // black
      255, 0, 0, 255,     // red
      0, 255, 0, 255,     // green
    ]);

    const dstW = 4;
    const dstH = 4;
    const gray = youtubeService.resizeAndGrayscale(rgba, srcW, srcH, dstW, dstH);
    expect(gray.length).toBe(16);
    expect(gray[0]).toBe(255); // Top-left is white
  });

  it("should stamp QR code onto grayscale buffer", () => {
    const bufW = 384;
    const bufH = 216;
    const gray = new Uint8Array(bufW * bufH);
    gray.fill(128); // medium gray background

    overlayQrCode(gray, bufW, bufH, "https://youtu.be/dQw4w9WgXcQ", 76);

    // QR area in bottom-right corner should have white margin (255) and black modules (0)
    let hasBlack = false;
    let hasWhite = false;
    for (let y = bufH - 76; y < bufH; y++) {
      for (let x = bufW - 76; x < bufW; x++) {
        if (gray[y * bufW + x] === 0) hasBlack = true;
        if (gray[y * bufW + x] === 255) hasWhite = true;
      }
    }
    expect(hasBlack).toBe(true);
    expect(hasWhite).toBe(true);
  });

  it("should provide youtubeService singleton instance with service methods", () => {
    const { youtubeService } = require("../youtubeService");
    expect(youtubeService.extractVideoId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeService.defaultPrinterWidth).toBe(384);
  });
});
