import { describe, expect, test } from "bun:test";
import {
  loadTabHardwareSettings,
  saveTabHardwareSettings,
  resetTabHardwareSettings,
  getTabDefaultSettings,
  type TabKey,
} from "../../storage/tabHardwareSettingsStorage";
import { DEFAULT_CALENDAR_SETTINGS } from "../calendarService";
import { DEFAULT_QRCODE_SETTINGS } from "../qrcodeService";

describe("Tab Hardware Settings Persistence", () => {
  const tabs: TabKey[] = ["image", "calendar", "qrcode", "spinetag", "youtube"];

  test("should load default hardware settings for each tab when empty", async () => {
    for (const tab of tabs) {
      await resetTabHardwareSettings(tab);
      const settings = await loadTabHardwareSettings(tab);
      const defaults = getTabDefaultSettings(tab);
      expect(settings.quality).toBe(defaults.quality);
      expect(settings.speed).toBe(defaults.speed);
      expect(settings.energy).toBe(defaults.energy);
      expect(settings.chunkDelayMs).toBe(defaults.chunkDelayMs);
    }
  });

  test("should store hardware settings separately for each tab without collision", async () => {
    // Reset all tabs first
    for (const tab of tabs) {
      await resetTabHardwareSettings(tab);
    }

    // Set distinctive energy and quality for each tab
    await saveTabHardwareSettings("image", { energy: 10000, quality: 51 });
    await saveTabHardwareSettings("calendar", { energy: 0, quality: 49 });
    await saveTabHardwareSettings("qrcode", { energy: 12000, quality: 53 });
    await saveTabHardwareSettings("spinetag", { energy: 9000, quality: 50 });
    await saveTabHardwareSettings("youtube", { energy: 11000, quality: 52 });

    // Verify each tab maintained its independent configuration
    const imageSettings = await loadTabHardwareSettings("image");
    const calendarSettings = await loadTabHardwareSettings("calendar");
    const qrcodeSettings = await loadTabHardwareSettings("qrcode");
    const spinetagSettings = await loadTabHardwareSettings("spinetag");
    const youtubeSettings = await loadTabHardwareSettings("youtube");

    expect(imageSettings.energy).toBe(10000);
    expect(imageSettings.quality).toBe(51);

    expect(calendarSettings.energy).toBe(0);
    expect(calendarSettings.quality).toBe(49);

    expect(qrcodeSettings.energy).toBe(12000);
    expect(qrcodeSettings.quality).toBe(53);

    expect(spinetagSettings.energy).toBe(9000);
    expect(spinetagSettings.quality).toBe(50);

    expect(youtubeSettings.energy).toBe(11000);
    expect(youtubeSettings.quality).toBe(52);
  });

  test("should merge with defaults when loading partial stored settings", async () => {
    await resetTabHardwareSettings("calendar");
    await saveTabHardwareSettings("calendar", { energy: 10000 });
    const settings = await loadTabHardwareSettings("calendar");
    expect(settings.energy).toBe(10000);
    expect(settings.quality).toBe(DEFAULT_CALENDAR_SETTINGS.quality);
    expect(settings.speed).toBe(DEFAULT_CALENDAR_SETTINGS.speed);
    expect(settings.chunkDelayMs).toBe(DEFAULT_CALENDAR_SETTINGS.chunkDelayMs);
  });

  test("should reset a single tab without affecting other tabs", async () => {
    await saveTabHardwareSettings("qrcode", { energy: 12000 });
    await saveTabHardwareSettings("youtube", { energy: 8000 });

    await resetTabHardwareSettings("qrcode");

    const qrcodeSettings = await loadTabHardwareSettings("qrcode");
    const youtubeSettings = await loadTabHardwareSettings("youtube");

    expect(qrcodeSettings.energy).toBe(DEFAULT_QRCODE_SETTINGS.energy);
    expect(youtubeSettings.energy).toBe(8000);
  });
});
