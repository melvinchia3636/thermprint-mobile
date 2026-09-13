import { describe, it, expect } from "bun:test";
import {
  crc8,
  buildPacket,
  setEnergy,
  setQuality,
  buildGrayScanPacket,
} from "../protocol";
import { applyUnsharpMask, ditherGrayPixels, grayToNibbles } from "../imageProcessor";
import { uint8ArrayToBase64 } from "../base64";

describe("Base64 Encoding", () => {
  it("should encode Uint8Array to standard base64 string", () => {
    const input = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    expect(uint8ArrayToBase64(input)).toBe("SGVsbG8=");
    expect(uint8ArrayToBase64(new Uint8Array([0x51, 0x78, 0xAF]))).toBe("UXiv");
  });
});

describe("Thermal Printer Protocol", () => {
  it("should correctly compute CRC8 checksums", () => {
    expect(crc8([])).toBe(0);
    expect(crc8([0x00])).toBe(0);
    expect(crc8([0xA4, 0x33])).toBe(213);
  });

  it("should build framed command packets with magic header 0x51 0x78 and footer 0xFF", () => {
    const packet = buildPacket(0xA4, [0x33]);
    expect(packet[0]).toBe(0x51);
    expect(packet[1]).toBe(0x78);
    expect(packet[2]).toBe(0xA4);
    expect(packet[3]).toBe(0x00);
    expect(packet[4]).toBe(0x01); // length low byte
    expect(packet[5]).toBe(0x00); // length high byte
    expect(packet[6]).toBe(0x33); // payload
    expect(packet[7]).toBe(crc8([0x33])); // crc
    expect(packet[8]).toBe(0xFF); // footer
  });

  it("should generate proper setEnergy packet", () => {
    const pkt = setEnergy(5000);
    expect(pkt[2]).toBe(0xAF);
    expect(pkt[6]).toBe(5000 & 0xFF);
    expect(pkt[7]).toBe((5000 >> 8) & 0xFF);
  });

  it("should generate proper setQuality packet", () => {
    const pkt = setQuality(51);
    expect(pkt[2]).toBe(0xA4);
    expect(pkt[6]).toBe(51);
  });

  it("should generate gray scan packet with LZO1X compression", () => {
    const rawData = new Uint8Array(192 * 10);
    rawData.fill(0x55);
    const pkt = buildGrayScanPacket(rawData);
    expect(pkt[0]).toBe(0x51);
    expect(pkt[1]).toBe(0x78);
    expect(pkt[2]).toBe(0xCF);
    expect(pkt[pkt.length - 1]).toBe(0xFF);
  });
});

describe("Image Processor", () => {
  it("should apply unsharp mask filter to enhance edges", () => {
    const width = 8;
    const height = 8;
    const pixels = new Uint8Array(width * height);
    pixels.fill(100);
    // Create an edge in the center
    for (let y = 3; y < 6; y++) {
      for (let x = 3; x < 6; x++) {
        pixels[y * width + x] = 200;
      }
    }

    const sharpened = applyUnsharpMask(pixels, width, height, 1.1, 2.0);
    expect(sharpened.length).toBe(pixels.length);
    // Center of the high region should be boosted/sharpened relative to surrounding
    expect(sharpened[4 * width + 4]).toBeGreaterThanOrEqual(200);
  });

  it("should return unchanged pixels if sharpness is 0", () => {
    const pixels = new Uint8Array([50, 100, 150, 200]);
    const result = applyUnsharpMask(pixels, 2, 2, 0);
    expect(Array.from(result)).toEqual([50, 100, 150, 200]);
  });

  it("should dither gray pixels with Floyd-Steinberg, Atkinson, and Bayer algorithms", () => {
    const width = 4;
    const height = 4;
    const pixels = new Uint8Array([
      128, 128, 128, 128,
      128, 128, 128, 128,
      128, 128, 128, 128,
      128, 128, 128, 128,
    ]);
    const fs = ditherGrayPixels(pixels, width, height, "floyd-steinberg");
    expect(fs.length).toBe(16);

    const atk = ditherGrayPixels(pixels, width, height, "atkinson");
    expect(atk.length).toBe(16);

    const bayer = ditherGrayPixels(pixels, width, height, "bayer");
    expect(bayer.length).toBe(16);

    const none = ditherGrayPixels(pixels, width, height, "none");
    expect(none.length).toBe(16);
  });

  it("should pack grayscale pixels into 4-bit nibbles with 16 padding rows", () => {
    const width = 384;
    const height = 20;
    const pixels = new Uint8Array(width * height);
    pixels.fill(0); // black
    const nibbles = grayToNibbles(pixels, width, height);
    const halfWidth = width / 2;
    const expectedLength = (height + 16) * halfWidth;
    expect(nibbles.length).toBe(expectedLength);
  });
});

