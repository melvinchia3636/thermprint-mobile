import { describe, it, expect, mock, beforeEach } from "bun:test";

mock.module("react-native", () => ({
  Platform: { OS: "ios" },
  PermissionsAndroid: {},
}));

mock.module("react-native-ble-plx", () => ({
  BleManager: class {},
  State: { Unknown: "Unknown" },
}));

const { bluetoothService } = await import("@/lib/core/bluetooth");
const { toastService } = await import("@/lib/core/toastService");
const { usePrintAction } = await import("../usePrintAction");

// Mock dependencies
const mockToastShow = mock((_msg: string) => {});
const mockStartPrinting = mock((_msg: string) => {});
const mockFinishPrinting = mock(() => {});
let mockIsConnected = true;
let mockIsPrinting = false;

mock.module("@/contexts/PrintProgressContext", () => ({
  usePrintProgress: () => ({
    isPrinting: mockIsPrinting,
    startPrinting: mockStartPrinting,
    finishPrinting: mockFinishPrinting,
  }),
}));



bluetoothService.isConnected = () => mockIsConnected;
toastService.show = mockToastShow;

describe("usePrintAction", () => {
  beforeEach(() => {
    mockToastShow.mockClear();
    mockStartPrinting.mockClear();
    mockFinishPrinting.mockClear();
    mockIsConnected = true;
    mockIsPrinting = false;
    bluetoothService.isConnected = () => mockIsConnected;
    toastService.show = mockToastShow;
  });

  it("should warn if printer is offline", async () => {
    mockIsConnected = false;
    const { executePrint } = usePrintAction();
    const printFn = mock(async () => {});

    await executePrint(printFn);

    expect(printFn).not.toHaveBeenCalled();
    expect(mockToastShow).toHaveBeenCalledWith(
      "Printer is offline. Please tap the Bluetooth badge at the top right to connect.",
    );
    expect(mockStartPrinting).not.toHaveBeenCalled();
  });

  it("should not execute if already printing", async () => {
    mockIsPrinting = true;
    const { executePrint } = usePrintAction();
    const printFn = mock(async () => {});

    await executePrint(printFn);

    expect(printFn).not.toHaveBeenCalled();
    expect(mockToastShow).not.toHaveBeenCalled();
  });

  it("should execute print successfully and call onSuccess with result", async () => {
    const { executePrint } = usePrintAction();
    const printFn = mock(async () => ({ data: "result" }));
    const onSuccess = mock((_res: unknown) => {});

    await executePrint(printFn, onSuccess);

    expect(mockStartPrinting).toHaveBeenCalledWith("Streaming to thermal printer...");
    expect(printFn).toHaveBeenCalled();
    expect(mockToastShow).toHaveBeenCalledWith("Printed successfully!");
    expect(onSuccess).toHaveBeenCalledWith({ data: "result" });
    expect(mockFinishPrinting).toHaveBeenCalled();
  });

  it("should handle error gracefully and show error toast", async () => {
    const { executePrint } = usePrintAction();
    const printFn = mock(async () => {
      throw new Error("Print stream error");
    });
    const onSuccess = mock(() => {});

    await executePrint(printFn, onSuccess);

    expect(printFn).toHaveBeenCalled();
    expect(mockToastShow).toHaveBeenCalledWith("Print stream error");
    expect(onSuccess).not.toHaveBeenCalled();
    expect(mockFinishPrinting).toHaveBeenCalled();
  });
});
