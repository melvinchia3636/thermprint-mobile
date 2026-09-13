import { useState, useEffect } from "react";
import { Portal, Snackbar as PaperSnackbar } from "react-native-paper";
import { toastService, type ToastPayload } from "@/lib/core";

export function GlobalToast() {
  const [toast, setToast] = useState<ToastPayload | null>(null);

  useEffect(() => {
    const unsubscribe = toastService.subscribe((newToast: ToastPayload | null) => {
      setToast(newToast);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  function handleDismiss() {
    toastService.hide();
  }

  const action = toast?.action
    ? {
        label: toast.action.label,
        onPress: () => {
          toast.action?.onPress();
          handleDismiss();
        },
      }
    : {
        label: "OK",
        onPress: handleDismiss,
      };

  return (
    <Portal>
      <PaperSnackbar
        visible={toast !== null}
        onDismiss={handleDismiss}
        duration={toast?.duration ?? 3000}
        wrapperStyle={{ bottom: 0, left: 0, right: 0 }}
        style={{ marginHorizontal: 16, marginBottom: 16, borderRadius: 8 }}
        action={action}
      >
        {toast?.message ?? ""}
      </PaperSnackbar>
    </Portal>
  );
}
