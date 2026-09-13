import { View } from "react-native";
import { Card, useTheme } from "react-native-paper";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Text } from "@/components/Text";
import type { FeatureTab } from "@/lib/core";

export function ModeCard({
  id,
  title,
  description,
  icon,
  onPress,
}: {
  id: FeatureTab;
  title: string;
  description: string;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  onPress: (id: FeatureTab) => void;
}) {
  const theme = useTheme();

  return (
    <View className="flex-1">
      <Card
        mode="elevated"
        style={{ flex: 1, backgroundColor: theme.colors.surfaceVariant }}
        contentStyle={{ flex: 1 }}
        onPress={() => onPress(id)}
      >
        <Card.Content
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 20,
            paddingHorizontal: 8,
          }}
        >
          <MaterialIcons name={icon} size={36} color={theme.colors.primary} />
          <Text
            variant="titleMedium"
            weight="bold"
            className="mt-3 text-center"
          >
            {title}
          </Text>
          <Text
            variant="bodyMedium"
            className="text-zinc-400 mt-1 text-center"
          >
            {description}
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
}
