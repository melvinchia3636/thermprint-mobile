import { useMemo } from "react";
import { ScrollView } from "react-native";
import { QRConfig } from "./components/QRConfig";
import { PrintButton } from "@/components/PrintButton";
import { PrintingProgressBar } from "@/components/PrintingProgressBar";
import { qrcodeService, useTabHardwareSettings } from "@/lib/services";
import { DeviceSettings } from "@/components/DeviceSettings";
import { QRCodeConfigProvider, useQRCodeConfig } from "./context";
import { usePrintAction } from "@/hooks";
import { PreviewCard } from "@/components/PreviewCard";

function QRCodeTabContent() {
  const { text, size, errorCorrection, logo } = useQRCodeConfig();
  const {
    settings: printerSettings,
    setSettings: setPrinterSettings,
    resetSettings: handleResetSettings,
  } = useTabHardwareSettings("qrcode");

  const qrData = useMemo(() => {
    if (!text.trim()) return null;
    try {
      return qrcodeService.generatePrintData({
        text,
        size,
        errorCorrection,
        logo: logo || undefined,
      });
    } catch {
      return null;
    }
  }, [text, size, errorCorrection, logo]);

  const { executePrint } = usePrintAction();

  return (
    <ScrollView contentContainerClassName="p-4 pb-10">
      <QRConfig />
      <DeviceSettings
        settings={printerSettings}
        onSettingsChange={setPrinterSettings}
        onResetSettings={handleResetSettings}
      />
      <PreviewCard
        noticeText={
          logo
            ? "Center logo embedded. High error correction ensures QR code remains scannable."
            : "Make sure the code is scannable before printing."
        }
        data={qrData}
      />
      <PrintingProgressBar />
      <PrintButton
        onPress={() =>
          executePrint(() =>
            qrcodeService.print(
              {
                text,
                size,
                errorCorrection,
                logo: logo || undefined,
              },
              printerSettings,
            ),
          )
        }
        disabled={!qrData}
      />
    </ScrollView>
  );
}

export function QRCodeTab() {
  return (
    <QRCodeConfigProvider>
      <QRCodeTabContent />
    </QRCodeConfigProvider>
  );
}
