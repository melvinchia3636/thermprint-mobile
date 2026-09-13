import { describe, it, expect } from "bun:test";
import {
  generateRandomCode,
  generateSpineTagData,
  spineTagService,
  DEFAULT_SPINE_TAG_SETTINGS,
} from "../spineTagService";

describe("Spine Tag Generator", () => {
  it("should generate a 16-character uppercase alphanumeric code", () => {
    const code = generateRandomCode();
    expect(code).toHaveLength(16);
    expect(/^[A-Z0-9]{16}$/.test(code)).toBe(true);

    const codeCustomLen = generateRandomCode(8);
    expect(codeCustomLen).toHaveLength(8);
    expect(/^[A-Z0-9]{8}$/.test(codeCustomLen)).toBe(true);
  });

  it("should generate valid spine tag print data with correct dimensions and payload", () => {
    const data = generateSpineTagData({
      volume: "1",
      startDate: "2026-09-01",
      endDate: "2026-09-30",
      code: "TESTCODE12345678",
    });

    expect(data.width).toBe(384);
    expect(data.height).toBe(120);
    expect(data.code).toBe("TESTCODE12345678");
    expect(data.payload).toBe("1,2026-09-01,2026-09-30,TESTCODE12345678");

    // 384/2 * (120 + 16 padding rows) = 192 * 136 = 26,112 bytes
    expect(data.nibbleData).toBeDefined();
    expect(data.nibbleData!.length).toBe(192 * (120 + 16));

    // Check SVG XML content
    expect(data.svgXml).toContain('viewBox="0 0 384 120"');
    expect(data.svgXml).toContain("START");
    expect(data.svgXml).toContain("END");
    expect(data.svgXml).toContain("01/09/2026");
    expect(data.svgXml).toContain("30/09/2026");
    expect(data.svgXml).toContain(">0<");
    expect(data.svgXml).toContain(">1<");
  });

  it("should pad volume to 3 digits and handle custom code", () => {
    const data = generateSpineTagData({
      volume: "42",
      startDate: "2026-01-01",
      endDate: "2026-01-31",
    });

    expect(data.code).toHaveLength(16);
    expect(data.payload).toBe(`42,2026-01-01,2026-01-31,${data.code}`);
    expect(data.svgXml).toContain("01/01/2026");
    expect(data.svgXml).toContain("31/01/2026");
    expect(data.svgXml).toContain(">0<");
    expect(data.svgXml).toContain(">4<");
    expect(data.svgXml).toContain(">2<");
  });

  it("should provide spineTagService singleton with default settings", () => {
    expect(DEFAULT_SPINE_TAG_SETTINGS.quality).toBe(51);
    expect(DEFAULT_SPINE_TAG_SETTINGS.speed).toBe(20);
    expect(DEFAULT_SPINE_TAG_SETTINGS.energy).toBe(5000);
    expect(DEFAULT_SPINE_TAG_SETTINGS.chunkRows).toBe(20);
    expect(DEFAULT_SPINE_TAG_SETTINGS.chunkDelayMs).toBe(0);
    expect(DEFAULT_SPINE_TAG_SETTINGS.feed).toBe(100);

    const code = spineTagService.generateRandomCode();
    expect(code).toHaveLength(16);

    const printData = spineTagService.generatePrintData({
      volume: "3",
      startDate: "2026-05-01",
      endDate: "2026-05-31",
    });
    expect(printData.width).toBe(384);
    expect(printData.height).toBe(120);
    expect(printData.nibbleData).toBeDefined();
    expect(printData.nibbleData!.length).toBeGreaterThan(0);
  });
});
