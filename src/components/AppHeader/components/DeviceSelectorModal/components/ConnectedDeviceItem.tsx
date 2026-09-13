import { View } from "react-native";
import { Card, Icon, useTheme } from "react-native-paper";
import { Text } from "@/components/Text";

export function ConnectedDeviceItem({
  name,
  mtuSize,
}: {
  name?: string | null;
  mtuSize: number;
}) {
  const theme = useTheme();

  return (
    <Card
      mode="elevated"
      style={{ backgroundColor: theme.colors.surfaceVariant, marginBottom: 8 }}
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
            {name || "Thermal Printer"}
          </Text>
          <Text
            variant="bodySmall"
            className="text-white mt-0.5"
          >
            Connected & Ready to print
          </Text>
          <Text
            variant="bodySmall"
            className="text-zinc-400 mt-0.5"
          >
            MTU: {mtuSize} bytes
          </Text>
        </View>
        <Icon
          source="check-circle"
          size={22}
          color={theme.colors.primary}
        />
      </Card.Content>
    </Card>
  );
}



