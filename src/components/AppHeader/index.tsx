import { View } from "react-native";
import { Appbar, useTheme } from "react-native-paper";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Text } from "@/components/Text";
import type { PrinterStatus } from "@/lib/core";
import { ConnectionBadge } from "./components/ConnectionBadge";

export function AppHeader({
  status,
  title = "ThermPrint",
  icon = "receipt-long",
  canGoBack = false,
  onGoBack,
  onPressBluetooth,
}: {
  status: PrinterStatus;
  title?: string;
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
          <View className="flex-1 flex-row items-center gap-2">
            <MaterialIcons
              name={icon}
              size={canGoBack ? 18 : 22}
              color={theme.colors.primary}
            />
            <Text
              variant={canGoBack ? "titleMedium" : "titleLarge"}
              weight="bold"
              numberOfLines={1}
              ellipsizeMode="tail"
              className="flex-shrink"
            >
              {title}
            </Text>
          </View>
        }
      />
      <ConnectionBadge
        status={status}
        onPress={onPressBluetooth}
        style={{ marginLeft: 12, marginRight: 16 }}
      />
    </Appbar.Header>
  );
}
