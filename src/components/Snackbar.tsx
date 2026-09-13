import type { ReactNode } from "react";
import { Portal, Snackbar as PaperSnackbar } from "react-native-paper";

export function Snackbar({
  visible,
  onDismiss,
  duration = 3000,
  action,
  children,
}: {
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
  action?: { label: string; onPress: () => void };
  children: ReactNode;
}) {
  return (
    <Portal>
      <PaperSnackbar
        visible={visible}
        onDismiss={onDismiss}
        duration={duration}
        wrapperStyle={{ bottom: 0, left: 0, right: 0 }}
        style={{ marginHorizontal: 16, marginBottom: 16, borderRadius: 8 }}
        action={action}
      >
        {children}
      </PaperSnackbar>
    </Portal>
  );
}
