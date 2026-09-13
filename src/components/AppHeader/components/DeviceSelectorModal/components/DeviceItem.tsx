import { View } from "react-native";
import { Card, useTheme } from "react-native-paper";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Text } from "@/components/Text";
import type { DiscoveredDevice } from "@/lib/core";

export function DeviceItem({
  device,
  onConnect,
  disabled = false,
}: {
  device: DiscoveredDevice;
  onConnect: (device: DiscoveredDevice) => void;
  disabled?: boolean;
}) {
  const theme = useTheme();

  return (
    <Card
      mode="elevated"
      style={{ backgroundColor: theme.colors.surfaceVariant, marginBottom: 8 }}
      onPress={() => {
        if (!disabled) {
          onConnect(device);
        }
      }}
    >
      <Card.Content
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 12,
          paddingHorizontal: 16,
        }}
      >
        <View className="flex-1 mr-3">
          <Text variant="titleMedium" weight="bold">
            {device.name}
          </Text>
          <Text
            variant="bodySmall"
            className="text-zinc-400 mt-0.5"
          >
            ID: {device.id}
          </Text>
          {device.rssi !== null && (
            <Text
              variant="bodySmall"
              className="text-white mt-0.5"
            >
              Signal: {device.rssi} dBm
            </Text>
          )}
        </View>
        <MaterialIcons
          name="chevron-right"
          size={20}
          color={theme.colors.onSurfaceVariant}
        />
      </Card.Content>
    </Card>
  );
}

