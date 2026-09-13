import { describe, it, expect } from "bun:test";
import { ToastService, toastService } from "../toastService";

describe("ToastService", () => {
  it("should show and hide toast correctly", () => {
    const service = new ToastService();
    expect(service.getCurrentToast()).toBeNull();

    service.show("Test message", { duration: 2000 });
    const current = service.getCurrentToast();
    expect(current).not.toBeNull();
    expect(current?.message).toBe("Test message");
    expect(current?.duration).toBe(2000);

    service.hide();
    expect(service.getCurrentToast()).toBeNull();
  });

  it("should notify subscribers when toast changes", () => {
    const service = new ToastService();
    const history: (string | null)[] = [];

    const unsubscribe = service.subscribe((toast) => {
      history.push(toast ? toast.message : null);
    });

    service.show("First Toast");
    service.show("Second Toast");
    service.hide();
    unsubscribe();

    service.show("Third Toast (ignored after unsub)");

    expect(history).toEqual([null, "First Toast", "Second Toast", null]);
  });

  it("should support action callbacks", () => {
    const service = new ToastService();
    let actionTriggered = false;

    service.show("Undoable action", {
      action: {
        label: "Undo",
        onPress: () => {
          actionTriggered = true;
        },
      },
    });

    const toast = service.getCurrentToast();
    expect(toast?.action?.label).toBe("Undo");
    toast?.action?.onPress();
    expect(actionTriggered).toBe(true);
  });

  it("should export singleton instance", () => {
    expect(toastService).toBeInstanceOf(ToastService);
  });
});
