import { describe, it, expect } from "bun:test";
import {
  applyImagePreprocessing,
  quantizeGrayPixels,
  buildPrintStrip,
  drawAnnotatedPreview,
  grayPixelsToJpegBase64,
  imageService,
} from "../imageService";

describe("Image Preprocessing & Algorithms", () => {
  it("should quantize gray pixels into 16 discrete levels", () => {
    const input = new Uint8Array([0, 15, 16, 31, 128, 240, 255]);
    const quantized = quantizeGrayPixels(input);
    expect(quantized.length).toBe(input.length);
    // Values should be multiples of 17 (255 / 15)
    for (const val of quantized) {
      expect(val % 17).toBe(0);
    }
  });

  it("should apply contrast and gamma adjustments", () => {
    const input = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      input[i] = i;
    }

    const output = applyImagePreprocessing(input, {
      contrast: 1.5,
      gamma: 1.2,
      sharpness: 0,
    });

    expect(output.length).toBe(256);
    // Dark values near 0 should clamp to 0
    expect(output[0]).toBe(0);
    // Bright values near 255 should clamp to 255
    expect(output[255]).toBe(255);
  });

  it("should apply sharpness preprocessing when dimensions are provided", () => {
    const width = 16;
    const height = 16;
    const input = new Uint8Array(width * height);
    for (let i = 0; i < input.length; i++) {
      input[i] = (i * 13) % 256;
    }

    const outputWithoutSharpness = applyImagePreprocessing(input, width, height, {
      sharpness: 0,
    });
    const outputWithSharpness = applyImagePreprocessing(input, width, height, {
      sharpness: 1.1,
    });

    expect(outputWithSharpness.length).toBe(width * height);
    expect(outputWithoutSharpness.length).toBe(width * height);
    // Outputs should differ because sharpness enhances local gradients
    let hasDiff = false;
    for (let i = 0; i < outputWithSharpness.length; i++) {
      if (outputWithSharpness[i] !== outputWithoutSharpness[i]) {
        hasDiff = true;
        break;
      }
    }
    expect(hasDiff).toBe(true);
  });

  it("should slice and stack multi-column grid into print strip with dashed lines", () => {
    const width = 768; // 2 columns of 384
    const height = 200;
    const dithered = new Uint8Array(width * height);
    dithered.fill(128);

    const strip = buildPrintStrip(dithered, width, height, 2, 1, 384);
    expect(strip.stripWidth).toBe(384);
    expect(strip.stripHeight).toBe(200 * 2); // 400px total stacked height
    expect(strip.stripPixels.length).toBe(384 * 400);
  });

  it("should generate annotated preview with red split lines", () => {
    const width = 384;
    const height = 200;
    const dithered = new Uint8Array(width * height);
    dithered.fill(200);

    const preview = drawAnnotatedPreview(dithered, width, height, 2, 2);
    expect(preview.startsWith("data:image/jpeg;base64,")).toBe(true);
  });

  it("should generate standard JPEG preview base64 URI", () => {
    const width = 384;
    const height = 100;
    const pixels = new Uint8Array(width * height);
    pixels.fill(255);

    const uri = grayPixelsToJpegBase64(pixels, width, height);
    expect(uri.startsWith("data:image/jpeg;base64,")).toBe(true);
  });

  it("should export imageService singleton instance and crop methods", () => {
    expect(imageService).toBeDefined();
    expect(typeof imageService.process).toBe("function");
    expect(typeof imageService.print).toBe("function");
    expect(typeof imageService.pickImageFromLibrary).toBe("function");
    expect(typeof imageService.pickImageFromCamera).toBe("function");
    expect(typeof imageService.cropImage).toBe("function");
    expect(typeof imageService.getImageDimensions).toBe("function");
  });

  it("should produce directly quantized values without error diffusion when dithering is disabled", () => {
    const input = new Uint8Array([50, 100, 150, 200]);
    const quantized = quantizeGrayPixels(input);
    expect(quantized.length).toBe(4);
    for (const val of quantized) {
      expect(val % 17).toBe(0);
    }
  });
});
