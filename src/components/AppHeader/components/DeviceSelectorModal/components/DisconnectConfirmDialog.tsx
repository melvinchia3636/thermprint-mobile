import { Dialog, Portal, Button, useTheme } from "react-native-paper";
import { Text } from "@/components/Text";

export function DisconnectConfirmDialog({
  visible,
  deviceName,
  onConfirm,
  onDismiss,
}: {
  visible: boolean;
  deviceName?: string | null;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const theme = useTheme();

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: 16,
        }}
      >
        <Dialog.Title>
          <Text variant="titleLarge" weight="bold">
            Disconnect Printer
          </Text>
        </Dialog.Title>
        <Dialog.Content>
          <Text
            variant="bodyMedium"
            className="text-zinc-400"
          >
            Are you sure you want to disconnect from {deviceName || "the printer"}?
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} textColor={theme.colors.onSurfaceVariant}>
            Cancel
          </Button>
          <Button
            mode="text"
            textColor={theme.colors.error}
            onPress={() => {
              onDismiss();
              onConfirm();
            }}
          >
            Disconnect
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
