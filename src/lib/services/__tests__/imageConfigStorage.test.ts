import { describe, expect, test } from "bun:test";
import {
  loadImageConfig,
  saveImageConfig,
  resetImageConfig,
} from "../../storage/imageConfigStorage";

describe("Image Configuration Persistence", () => {
  test("should load default configuration when storage is empty or reset", async () => {
    await resetImageConfig();
    const config = await loadImageConfig();
    expect(config.contrast).toBe(1.0);
    expect(config.gamma).toBe(1.0);
    expect(config.rotate).toBe(0);
    expect(config.disablePreprocessing).toBe(false);
    expect(config.disableDithering).toBe(false);
    expect(config.ditherMethod).toBe("floyd-steinberg");
    expect(config.splitCols).toBe(1);
    expect(config.splitRows).toBe(1);
  });

  test("should save and load partial and full configurations", async () => {
    await resetImageConfig();
    await saveImageConfig({
      contrast: 1.8,
      gamma: 0.8,
      rotate: 90,
      disablePreprocessing: true,
      disableDithering: true,
      ditherMethod: "atkinson",
      splitCols: 2,
      splitRows: 3,
    });

    const loaded = await loadImageConfig();
    expect(loaded.contrast).toBe(1.8);
    expect(loaded.gamma).toBe(0.8);
    expect(loaded.rotate).toBe(90);
    expect(loaded.disablePreprocessing).toBe(true);
    expect(loaded.disableDithering).toBe(true);
    expect(loaded.ditherMethod).toBe("atkinson");
    expect(loaded.splitCols).toBe(2);
    expect(loaded.splitRows).toBe(3);
  });

  test("should merge with defaults when loading partial configuration", async () => {
    await resetImageConfig();
    await saveImageConfig({ contrast: 2.2 });
    const config = await loadImageConfig();
    expect(config.contrast).toBe(2.2);
    expect(config.gamma).toBe(1.0);
    expect(config.rotate).toBe(0);
    expect(config.ditherMethod).toBe("floyd-steinberg");
  });

  test("should reset configuration back to defaults", async () => {
    await saveImageConfig({ contrast: 2.5, splitCols: 4 });
    const reset = await resetImageConfig();
    expect(reset.contrast).toBe(1.0);
    expect(reset.splitCols).toBe(1);

    const loaded = await loadImageConfig();
    expect(loaded.contrast).toBe(1.0);
    expect(loaded.splitCols).toBe(1);
  });
});

