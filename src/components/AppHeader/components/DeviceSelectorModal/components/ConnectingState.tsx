import { View } from "react-native";
import { ActivityIndicator, useTheme } from "react-native-paper";
import { Text } from "@/components/Text";

export function ConnectingState() {
  const theme = useTheme();

  return (
    <View className="items-center py-6">
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text
        variant="titleMedium"
        weight="medium"
        className="mt-3 text-white"
      >
        Connecting to printer...
      </Text>
      <Text
        variant="bodySmall"
        className="text-zinc-400 mt-1"
      >
        Negotiating GATT services and MTU
      </Text>
    </View>
  );
}
