import { View } from "react-native";
import { Appbar, useTheme } from "react-native-paper";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Text } from "@/components/Text";
import type { PrinterStatus } from "@/lib/core";
import { ConnectionBadge } from "./components/ConnectionBadge";

export function AppHeader({
  status,
  title = "ThermPrint",
  subtitle = "Thermal BLE Printer",
  icon = "receipt-long",
  canGoBack = false,
  onGoBack,
  onPressBluetooth,
}: {
  status: PrinterStatus;
  title?: string;
  subtitle?: string;
  icon?: React.ComponentProps<typeof MaterialIcons>["name"];
  canGoBack?: boolean;
  onGoBack?: () => void;
  onPressBluetooth: () => void;
}) {
  const theme = useTheme();

  return (
    <Appbar.Header elevated mode="small">
      {canGoBack && <Appbar.BackAction onPress={onGoBack} />}
      <Appbar.Content
        title={
          <View className="flex-row items-center gap-2">
            <MaterialIcons name={icon} size={22} color={theme.colors.primary} />
            <Text variant="titleLarge" weight="bold">
              {title}
            </Text>
          </View>
        }
        subtitle={subtitle}
        subtitleStyle={{ fontFamily: "DMSans_400Regular" }}
      />
      <ConnectionBadge
        status={status}
        onPress={onPressBluetooth}
        style={{ marginRight: 16 }}
      />
    </Appbar.Header>
  );
}


