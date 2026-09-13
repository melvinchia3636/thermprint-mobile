import { bluetoothService } from "@/lib/core/bluetooth";
import { toastService } from "@/lib/core/toastService";
import { usePrintProgress } from "@/contexts/PrintProgressContext";

export function usePrintAction() {
  const { isPrinting, startPrinting, finishPrinting } = usePrintProgress();

  async function executePrint<T = void>(
    printFn: () => Promise<T>,
    onSuccess?: (result: T) => void,
  ) {
    if (isPrinting) return;

    if (!bluetoothService.isConnected()) {
      toastService.show(
        "Printer is offline. Please tap the Bluetooth badge at the top right to connect.",
      );
      return;
    }

    startPrinting("Streaming to thermal printer...");

    try {
      const result = await printFn();
      toastService.show("Printed successfully!");
      onSuccess?.(result);
    } catch (err) {
      toastService.show(err instanceof Error ? err.message : "Print failed");
    } finally {
      finishPrinting();
    }
  }

  return { executePrint, isPrinting };
}
