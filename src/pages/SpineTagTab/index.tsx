import { useMemo, useRef } from "react";
import { ScrollView, View } from "react-native";
import { PrintButton } from "@/components/PrintButton";
import { PrintingProgressBar } from "@/components/PrintingProgressBar";
import { DeviceSettings } from "@/components/DeviceSettings";
import { SpineTagConfigCard } from "./components/SpineTagConfigCard";
import { spineTagService, useTabHardwareSettings } from "@/lib/services";
import { SpineTagConfigProvider, useSpineTagConfig } from "./context";
import { usePrintAction } from "@/hooks";
import { PreviewCard } from "@/components/PreviewCard";

function SpineTagTabContent() {
  const previewRef = useRef<View>(null);
  const { volume, startDate, endDate, code } = useSpineTagConfig();

  const {
    settings: printerSettings,
    setSettings: setPrinterSettings,
    resetSettings: handleResetSettings,
  } = useTabHardwareSettings("spinetag");

  const spineTagData = useMemo(() => {
    try {
      return spineTagService.generatePrintData({
        volume,
        startDate,
        endDate,
        code,
      });
    } catch {
      return null;
    }
  }, [volume, startDate, endDate, code]);

  const { executePrint } = usePrintAction();

  return (
    <ScrollView contentContainerClassName="p-4 pb-10">
      <SpineTagConfigCard />
      <DeviceSettings
        settings={printerSettings}
        onSettingsChange={setPrinterSettings}
        onResetSettings={handleResetSettings}
      />
      <PreviewCard data={spineTagData} canvasRef={previewRef} />
      <PrintingProgressBar />
      <PrintButton
        onPress={() =>
          executePrint(() =>
            spineTagService.print(
              {
                volume,
                startDate,
                endDate,
                code,
              },
              previewRef.current,
              printerSettings,
            ),
          )
        }
        disabled={!spineTagData}
      />
    </ScrollView>
  );
}

export function SpineTagTab() {
  return (
    <SpineTagConfigProvider>
      <SpineTagTabContent />
    </SpineTagConfigProvider>
  );
}
