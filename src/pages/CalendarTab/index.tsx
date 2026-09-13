import { useMemo, useRef } from "react";
import { View, ScrollView } from "react-native";
import { useTabHardwareSettings, calendarService } from "@/lib/services";
import { MonthSelector } from "./components/MonthSelector";
import { PrintButton } from "@/components/PrintButton";
import { PrintingProgressBar } from "@/components/PrintingProgressBar";
import { DeviceSettings } from "@/components/DeviceSettings";
import { CalendarConfigProvider, useCalendarConfig } from "./context";
import { usePrintAction } from "@/hooks";
import { PreviewCard } from "@/components/PreviewCard";

function CalendarTabContent() {
  const receiptRef = useRef<View>(null);
  const { year, month } = useCalendarConfig();
  const { executePrint } = usePrintAction();

  const {
    settings: printerSettings,
    setSettings: setPrinterSettings,
    resetSettings: handleResetSettings,
  } = useTabHardwareSettings("calendar");

  const calendarData = useMemo(() => {
    return calendarService.generateCalendar(year, month);
  }, [year, month]);

  return (
    <ScrollView contentContainerClassName="p-4 pb-10">
      <MonthSelector />
      <DeviceSettings
        settings={printerSettings}
        onSettingsChange={setPrinterSettings}
        onResetSettings={handleResetSettings}
      />
      <PreviewCard data={calendarData} canvasRef={receiptRef} />
      <PrintingProgressBar />
      <PrintButton
        onPress={() =>
          executePrint(() =>
            calendarService.print(
              year,
              month,
              receiptRef.current,
              printerSettings,
            ),
          )
        }
      />
    </ScrollView>
  );
}

export function CalendarTab() {
  return (
    <CalendarConfigProvider>
      <CalendarTabContent />
    </CalendarConfigProvider>
  );
}
