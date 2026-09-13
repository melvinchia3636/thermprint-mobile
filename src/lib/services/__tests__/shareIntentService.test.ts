import { describe, it, expect, mock, beforeEach } from "bun:test";

const mockGetInitialSharedUri = mock(async () => null as string | null);
const mockClearSharedUri = mock(async () => true);
const mockRemoveListener = mock(() => {});
let registeredListener: ((uri: string) => void) | null = null;

mock.module("react-native", () => ({
  Platform: { OS: "android" },
  NativeModules: {
    ShareIntentModule: {
      getInitialSharedUri: mockGetInitialSharedUri,
      clearSharedUri: mockClearSharedUri,
      addListener: mock((_event: string) => {}),
      removeListeners: mock((_count: number) => {}),
    },
  },
  NativeEventEmitter: class {
    addListener(_event: string, callback: (uri: string) => void) {
      registeredListener = callback;
      return {
        remove: mockRemoveListener,
      };
    }
  },
}));

const { ShareIntentService, shareIntentService } = await import("../shareIntentService");

describe("ShareIntentService", () => {
  beforeEach(() => {
    mockGetInitialSharedUri.mockClear();
    mockClearSharedUri.mockClear();
    mockRemoveListener.mockClear();
    registeredListener = null;
  });

  it("should export singleton instance", () => {
    expect(shareIntentService).toBeInstanceOf(ShareIntentService);
  });

  it("should get initial shared uri from native module", async () => {
    mockGetInitialSharedUri.mockImplementation(async () => "file:///cache/shared_123.jpg");
    const service = new ShareIntentService();
    const result = await service.getInitialSharedUri();
    expect(result).toBe("file:///cache/shared_123.jpg");
    expect(mockGetInitialSharedUri).toHaveBeenCalled();
  });

  it("should clear shared uri via native module", async () => {
    const service = new ShareIntentService();
    const result = await service.clearSharedUri();
    expect(result).toBe(true);
    expect(mockClearSharedUri).toHaveBeenCalled();
  });

  it("should handle event emission and unsubscribe", () => {
    const service = new ShareIntentService();
    let receivedUri: string | null = null;
    const unsubscribe = service.subscribeSharedImage((uri) => {
      receivedUri = uri;
    });

    expect(typeof unsubscribe).toBe("function");
    expect(registeredListener).not.toBeNull();

    if (registeredListener) {
      (registeredListener as (uri: string) => void)("file:///cache/new_shared.jpg");
    }

    expect(receivedUri).toBe("file:///cache/new_shared.jpg");

    unsubscribe();
    expect(mockRemoveListener).toHaveBeenCalled();
  });
});
