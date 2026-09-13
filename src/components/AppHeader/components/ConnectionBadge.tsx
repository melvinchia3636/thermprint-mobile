import type { StyleProp, ViewStyle } from "react-native";
import { Chip, useTheme } from "react-native-paper";
import type { PrinterStatus } from "@/lib/core";

export function ConnectionBadge({
  status,
  style,
  onPress,
}: {
  status: PrinterStatus;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const isOnline = status === "online";
  const isConnecting = status === "connecting";

  const iconName = isOnline
    ? "bluetooth-connect"
    : isConnecting
      ? "bluetooth-transfer"
      : "bluetooth-off";

  const label = isOnline
    ? "Connected"
    : isConnecting
      ? "Connecting..."
      : "Connect";

  return (
    <Chip
      icon={iconName}
      onPress={onPress}
      compact
      style={[
        {
          backgroundColor: theme.colors.surfaceVariant,
          borderColor: theme.colors.outline,
          borderWidth: 1,
        },
        style,
      ]}
      textStyle={{
        color: theme.colors.onSurface,
        fontWeight: "600",
      }}
    >
      {label}
    </Chip>
  );
}
