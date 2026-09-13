import { useState } from "react";
import { ScrollView } from "react-native";
import {
  youtubeService,
  useTabHardwareSettings,
  type YouTubeMetadata,
  type YouTubePrintData,
} from "@/lib/services";
import { toastService } from "@/lib/core";

import { YouTubeVideoInput } from "./components/YouTubeVideoInput";
import { PrintButton } from "@/components/PrintButton";
import { PrintingProgressBar } from "@/components/PrintingProgressBar";
import { DeviceSettings } from "@/components/DeviceSettings";
import { YouTubeConfigProvider, useYouTubeConfig } from "./context";
import { usePrintAction } from "@/hooks";
import { PreviewCard } from "@/components/PreviewCard";

function YouTubeTabContent() {
  const { inputUrl } = useYouTubeConfig();
  const [metadata, setMetadata] = useState<YouTubeMetadata | null>(null);
  const {
    settings: printerSettings,
    setSettings: setPrinterSettings,
    resetSettings: handleResetSettings,
  } = useTabHardwareSettings("youtube");
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [cachedPrintData, setCachedPrintData] =
    useState<YouTubePrintData | null>(null);

  const { executePrint } = usePrintAction();

  async function handlePrint() {
    await executePrint(() =>
      youtubeService.print(inputUrl, printerSettings),
    );
  }

  async function handleLoadPreview() {
    if (!inputUrl.trim()) {
      toastService.show("Please enter a YouTube video URL or ID");
      return;
    }

    setIsLoadingPreview(true);
    setMetadata(null);
    setCachedPrintData(null);

    try {
      const meta = await youtubeService.fetchMetadata(inputUrl);
      setMetadata(meta);

      const printData = await youtubeService.generatePrintData(inputUrl, 384);
      setCachedPrintData(printData);
    } catch (err) {
      toastService.show(
        err instanceof Error ? err.message : "Failed to load YouTube video",
      );
    } finally {
      setIsLoadingPreview(false);
    }
  }

  return (
    <ScrollView contentContainerClassName="p-4 pb-10">
      <YouTubeVideoInput
        onLoadPreview={handleLoadPreview}
        isLoadingPreview={isLoadingPreview}
        metadata={metadata}
      />
      <DeviceSettings
        settings={printerSettings}
        onSettingsChange={setPrinterSettings}
        onResetSettings={handleResetSettings}
      />
      <PreviewCard
        isLoading={isLoadingPreview}
        noticeText={
          cachedPrintData
            ? "Thermal print preview with 16-level Floyd-Steinberg dithering and embedded QR code."
            : undefined
        }
        data={cachedPrintData}
      />
      <PrintingProgressBar />
      <PrintButton
        onPress={handlePrint}
        disabled={isLoadingPreview || !metadata}
      />
    </ScrollView>
  );
}

export function YouTubeTab() {
  return (
    <YouTubeConfigProvider>
      <YouTubeTabContent />
    </YouTubeConfigProvider>
  );
}
