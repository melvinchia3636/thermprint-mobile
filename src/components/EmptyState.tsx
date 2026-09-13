import type { ReactNode } from "react";
import { View } from "react-native";
import { ActivityIndicator, useTheme } from "react-native-paper";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Text } from "@/components/Text";

export function EmptyState({
  icon = "info-outline",
  title,
  description,
  isLoading = false,
  loadingText,
  children,
}: {
  icon?: React.ComponentProps<typeof MaterialIcons>["name"];
  title?: string;
  description?: string;
  isLoading?: boolean;
  loadingText?: string;
  children?: ReactNode;
}) {
  const theme = useTheme();

  return (
    <View className="items-center justify-center py-7">
      {isLoading ? (
        <>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          {loadingText && (
            <Text
              variant="bodyMedium"
              className="mt-3 text-zinc-400 text-center"
            >
              {loadingText}
            </Text>
          )}
        </>
      ) : (
        <>
          <MaterialIcons name={icon} size={40} color={theme.colors.onSurfaceVariant} />
          {title && (
            <Text
              variant="titleMedium"
              weight="medium"
              className="mt-3 text-white text-center"
            >
              {title}
            </Text>
          )}
          {description && (
            <Text
              variant="bodyMedium"
              className="mt-1 text-zinc-400 text-center"
            >
              {description}
            </Text>
          )}
          {children}
        </>
      )}
    </View>
  );
}
