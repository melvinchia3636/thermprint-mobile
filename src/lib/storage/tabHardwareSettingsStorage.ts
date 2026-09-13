import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect, useRef } from "react";
import type { PrintSettingsOptions } from "../core/printerService";
import { DEFAULT_IMAGE_SETTINGS } from "../services/imageService";
import { DEFAULT_CALENDAR_SETTINGS } from "../services/calendarService";
import { DEFAULT_QRCODE_SETTINGS } from "../services/qrcodeService";
import { DEFAULT_SPINE_TAG_SETTINGS } from "../services/spineTagService";
import { DEFAULT_YOUTUBE_SETTINGS } from "../services/youtubeService";

export type TabKey = "image" | "calendar" | "qrcode" | "spinetag" | "youtube";

const TAB_STORAGE_KEYS: Record<TabKey, string> = {
  image: "@thermprint/hardware_settings_image",
  calendar: "@thermprint/hardware_settings_calendar",
  qrcode: "@thermprint/hardware_settings_qrcode",
  spinetag: "@thermprint/hardware_settings_spinetag",
  youtube: "@thermprint/hardware_settings_youtube",
};

const TAB_DEFAULT_SETTINGS: Record<TabKey, PrintSettingsOptions> = {
  image: DEFAULT_IMAGE_SETTINGS,
  calendar: DEFAULT_CALENDAR_SETTINGS,
  qrcode: DEFAULT_QRCODE_SETTINGS,
  spinetag: DEFAULT_SPINE_TAG_SETTINGS,
  youtube: DEFAULT_YOUTUBE_SETTINGS,
};

const memoryStorage = new Map<string, string>();

async function getStoredItem(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return memoryStorage.get(key) ?? null;
  }
}

async function setStoredItem(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    memoryStorage.set(key, value);
  }
}

async function removeStoredItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    memoryStorage.delete(key);
  }
}

export function getTabDefaultSettings(tabKey: TabKey): PrintSettingsOptions {
  return { ...(TAB_DEFAULT_SETTINGS[tabKey] || DEFAULT_IMAGE_SETTINGS) };
}

export async function loadTabHardwareSettings(
  tabKey: TabKey
): Promise<PrintSettingsOptions> {
  const defaults = getTabDefaultSettings(tabKey);
  const key = TAB_STORAGE_KEYS[tabKey];
  try {
    const raw = await getStoredItem(key);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return { ...defaults, ...(parsed || {}) };
  } catch {
    return defaults;
  }
}

export async function saveTabHardwareSettings(
  tabKey: TabKey,
  settings: Partial<PrintSettingsOptions>
): Promise<PrintSettingsOptions> {
  const defaults = getTabDefaultSettings(tabKey);
  const key = TAB_STORAGE_KEYS[tabKey];
  try {
    const current = await loadTabHardwareSettings(tabKey);
    const updated: PrintSettingsOptions = {
      ...current,
      ...settings,
    };
    await setStoredItem(key, JSON.stringify(updated));
    return updated;
  } catch {
    return { ...defaults, ...settings };
  }
}

export async function resetTabHardwareSettings(
  tabKey: TabKey
): Promise<PrintSettingsOptions> {
  const defaults = getTabDefaultSettings(tabKey);
  const key = TAB_STORAGE_KEYS[tabKey];
  await removeStoredItem(key);
  return defaults;
}

export function useTabHardwareSettings(tabKey: TabKey) {
  const defaultSettings = getTabDefaultSettings(tabKey);
  const [settings, setSettingsState] = useState<PrintSettingsOptions>(defaultSettings);
  const isLoadedRef = useRef(false);

  useEffect(() => {
    async function load() {
      try {
        const loaded = await loadTabHardwareSettings(tabKey);
        setSettingsState(loaded);
      } catch {
        // Fall back to defaults
      } finally {
        isLoadedRef.current = true;
      }
    }
    load();
  }, [tabKey]);

  function setSettings(newSettings: PrintSettingsOptions) {
    setSettingsState(newSettings);
    if (isLoadedRef.current) {
      saveTabHardwareSettings(tabKey, newSettings);
    }
  }

  async function resetSettings() {
    const defaults = await resetTabHardwareSettings(tabKey);
    setSettingsState(defaults);
  }

  return {
    settings,
    setSettings,
    resetSettings,
    isLoaded: isLoadedRef.current,
  };
}
