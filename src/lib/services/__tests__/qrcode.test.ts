import { describe, it, expect } from "bun:test";
import { generateQRCodeData } from "../qrcodeService";

describe("QR Code Generation Service", () => {
  it("should throw error if text is empty", () => {
    expect(() => generateQRCodeData({ text: "" })).toThrow("QR code text cannot be empty");
    expect(() => generateQRCodeData({ text: "   " })).toThrow("QR code text cannot be empty");
  });

  it("should generate valid QR code print data with 384px width", () => {
    const data = generateQRCodeData({
      text: "https://github.com",
      size: 280,
      errorCorrection: "M",
    });

    expect(data.width).toBe(384);
    expect(data.height).toBeGreaterThan(50);
    expect(data.actualQrSize).toBeLessThanOrEqual(384);
    expect(data.svgXml).toContain("<svg");
    expect(data.svgXml).toContain("<rect");
    expect(data.nibbleData.length).toBe((384 / 2) * (data.height + 16)); // with 16 padding rows
  });

  it("should support different error correction levels", () => {
    const dataL = generateQRCodeData({ text: "Test Message", errorCorrection: "L" });
    const dataH = generateQRCodeData({ text: "Test Message", errorCorrection: "H" });

    expect(dataL.svgXml).toContain("<svg");
    expect(dataH.svgXml).toContain("<svg");
    expect(dataL.nibbleData.length).toBeGreaterThan(0);
    expect(dataH.nibbleData.length).toBeGreaterThan(0);
  });

  it("should support custom target sizes up to 384px", () => {
    const small = generateQRCodeData({ text: "Small QR", size: 100 });
    const max = generateQRCodeData({ text: "Max QR", size: 384 });

    expect(small.actualQrSize).toBeLessThan(max.actualQrSize);
    expect(max.actualQrSize).toBeLessThanOrEqual(384);
  });

  it("should generate valid QR code with embedded logo", () => {
    const dataWithLogo = generateQRCodeData({
      text: "https://example.com",
      size: 280,
      logo: {
        uri: "file:///mock/logo.png",
        sizeRatio: 0.22,
        padding: 4,
      },
    });

    expect(dataWithLogo.hasLogo).toBe(true);
    expect(dataWithLogo.svgXml).toContain("<image");
    expect(dataWithLogo.svgXml).toContain("file:///mock/logo.png");
    expect(dataWithLogo.nibbleData.length).toBeGreaterThan(0);
  });

  it("should provide qrcodeService singleton instance with service methods", () => {
    const { qrcodeService } = require("../qrcodeService");
    expect(qrcodeService.printerWidth).toBe(384);
    const data = qrcodeService.generatePrintData({ text: "Hello World" });
    expect(data.width).toBe(384);
  });
});
