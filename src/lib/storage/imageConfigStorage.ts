import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DitherMethod } from "../core/imageProcessor";

export interface ImagePrintConfiguration {
  contrast: number;
  gamma: number;
  rotate: 0 | 90 | 180 | 270;
  disablePreprocessing: boolean;
  disableDithering: boolean;
  ditherMethod: DitherMethod;
  splitCols: number;
  splitRows: number;
}

export const DEFAULT_IMAGE_CONFIG: ImagePrintConfiguration = {
  contrast: 1.0,
  gamma: 1.0,
  rotate: 0,
  disablePreprocessing: false,
  disableDithering: false,
  ditherMethod: "floyd-steinberg",
  splitCols: 1,
  splitRows: 1,
};

const STORAGE_KEY = "@thermprint/image_print_config";
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

export async function loadImageConfig(): Promise<ImagePrintConfiguration> {
  try {
    const raw = await getStoredItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_IMAGE_CONFIG };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_IMAGE_CONFIG, ...(parsed || {}) };
  } catch {
    return { ...DEFAULT_IMAGE_CONFIG };
  }
}

export async function saveImageConfig(
  config: Partial<ImagePrintConfiguration>
): Promise<ImagePrintConfiguration> {
  try {
    const current = await loadImageConfig();
    const updated: ImagePrintConfiguration = {
      ...current,
      ...config,
    };
    await setStoredItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return { ...DEFAULT_IMAGE_CONFIG, ...config };
  }
}

export async function resetImageConfig(): Promise<ImagePrintConfiguration> {
  await removeStoredItem(STORAGE_KEY);
  return { ...DEFAULT_IMAGE_CONFIG };
}

