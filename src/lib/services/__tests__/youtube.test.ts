import { describe, it, expect } from "bun:test";
import {
  escapeXml,
  extractYouTubeVideoId,
  formatYouTubeDuration,
  generateYouTubeSvg,
  truncateLines,
  wrapYouTubeTitle,
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

describe("YouTube Formatting & SVG Composition", () => {
  it("should format durations as minutes or hours", () => {
    expect(formatYouTubeDuration(0)).toBe("0:00");
    expect(formatYouTubeDuration(59)).toBe("0:59");
    expect(formatYouTubeDuration(185)).toBe("3:05");
    expect(formatYouTubeDuration(3725)).toBe("1:02:05");
  });

  it("should wrap titles to the available width", () => {
    const lines = wrapYouTubeTitle(
      "A Very Long YouTube Video Title That Should Wrap Across Lines",
      278,
      16,
    );
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(31);
    }
  });

  it("should truncate excess title lines with an ellipsis", () => {
    const lines = truncateLines(["one", "two", "three", "four"], 3);
    expect(lines).toHaveLength(3);
    expect(lines[2].endsWith("..")).toBe(true);
  });

  it("should escape XML special characters", () => {
    expect(escapeXml('Tom & Jerry <"test">')).toBe(
      "Tom &amp; Jerry &lt;&quot;test&quot;&gt;",
    );
  });

  it("should build an SVG with a duration badge, title and author", () => {
    const thumbnailHeight = 216;
    const { svgXml, width, height } = generateYouTubeSvg({
      width: 384,
      thumbnailHeight,
      thumbnailDataUri: "data:image/jpeg;base64,AAAA",
      title: "A Very Long YouTube Video Title That Should Wrap Across Lines",
      authorName: "Some Channel",
      duration: "1:23",
      url: "https://youtu.be/dQw4w9WgXcQ",
    });

    expect(width).toBe(384);
    expect(height).toBeGreaterThan(thumbnailHeight);
    expect(svgXml).toContain('<image href="data:image/jpeg;base64,AAAA"');
    expect(svgXml).toContain("A Very Long YouTube");
    expect(svgXml).toContain("Some Channel");

    // Duration badge sits on the thumbnail with white text
    expect(svgXml).toMatch(/rx="4" fill="#000000"/);
    expect(svgXml).toMatch(/fill="#FFFFFF">1:23</);

    // QR modules start on the right-hand side of the info band, below the thumbnail
    const qrLeft = 384 - 76 - 6;
    const rects = svgXml.match(/<rect x="([\d.]+)" y="([\d.]+)"[^/]*fill="#000000" \/>/g) ?? [];
    const qrRects = rects.filter((r) => {
      const x = parseFloat(r.match(/x="([\d.]+)"/)![1]);
      const y = parseFloat(r.match(/y="([\d.]+)"/)![1]);
      return x >= qrLeft && y >= thumbnailHeight;
    });
    expect(qrRects.length).toBeGreaterThan(0);
  });

  it("should provide youtubeService singleton instance with service methods", () => {
    const { youtubeService } = require("../youtubeService");
    expect(youtubeService.extractVideoId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeService.defaultPrinterWidth).toBe(384);
  });
});
