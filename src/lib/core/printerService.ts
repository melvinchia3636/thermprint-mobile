import {
  buildGrayScanPacket,
  feedPaper,
  feedPaperSpeed,
  getDevState,
  setEnergy,
  setPrintModeGray16,
  setQuality,
} from "./protocol";

export interface PrintSettingsOptions {
  quality: number;
  speed: number;
  energy: number;
  chunkRows: number;
  chunkDelayMs: number;
  feed: number;
}

export const DEFAULT_PRINT_SETTINGS: PrintSettingsOptions = {
  quality: 51,
  speed: 20,
  energy: 5000,
  chunkRows: 20,
  chunkDelayMs: 150,
  feed: 100,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let isPrintingActive = false;

export function isPrintingInProgress(): boolean {
  return isPrintingActive;
}

export async function sendPrintJob(
  nibbleData: Uint8Array,
  width: number,
  settings: PrintSettingsOptions = DEFAULT_PRINT_SETTINGS,
  onProgress?: (current: number, total: number) => void,
  cancelSignal?: { cancelled: boolean },
): Promise<void> {
  if (isPrintingActive) {
    throw new Error("Another print job is currently in progress. Please wait.");
  }

  isPrintingActive = true;
  try {
    const halfWidth = Math.floor(width / 2);
    const chunkSize = halfWidth * settings.chunkRows;

    const chunks: Uint8Array[] = [];
    let offset = 0;
    while (offset < nibbleData.length) {
      const end = Math.min(offset + chunkSize, nibbleData.length);
      chunks.push(nibbleData.slice(offset, end));
      offset = end;
    }

    if (cancelSignal?.cancelled) return;

    const { bluetoothService } = await import("./bluetooth");

    await bluetoothService.writePacket(setQuality(settings.quality));
    await sleep(100);

    if (settings.energy > 0) {
      await bluetoothService.writePacket(setEnergy(settings.energy));
      await sleep(100);
    }

    await bluetoothService.writePacket(setPrintModeGray16());
    await sleep(100);

    await bluetoothService.writePacket(feedPaperSpeed(settings.speed));
    await sleep(200);

    for (let i = 0; i < chunks.length; i++) {
      if (cancelSignal?.cancelled) return;

      await bluetoothService.writePacket(buildGrayScanPacket(chunks[i]));
      await bluetoothService.writePacket(feedPaperSpeed(settings.speed));

      if (settings.chunkDelayMs > 0) {
        await sleep(settings.chunkDelayMs);
      }
      if (onProgress) {
        onProgress(i + 1, chunks.length);
      }
    }

    await sleep(500);
    await bluetoothService.writePacket(feedPaper(settings.feed));
    await sleep(200);
    await bluetoothService.writePacket(getDevState());
    await sleep(100);
  } finally {
    isPrintingActive = false;
  }
}
