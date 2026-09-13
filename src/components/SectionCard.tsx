import React, { type ReactNode } from "react";
import { View, Pressable, type StyleProp, type ViewStyle } from "react-native";
import { Surface, useTheme } from "react-native-paper";
import { Text } from "@/components/Text";

export function SectionCard({
  title,
  subtitle,
  headerExtra,
  children,
  style,
  onHeaderPress,
}: {
  title?: string;
  subtitle?: string;
  headerExtra?: ReactNode;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  onHeaderPress?: () => void;
}) {
  const theme = useTheme();
  const validChildren = React.Children.toArray(children).filter(Boolean);
  const hasChildren = validChildren.length > 0;

  return (
    <Surface
      style={[
        {
          padding: 16,
          borderRadius: 16,
          backgroundColor: theme.colors.surface,
          marginBottom: 16,
        },
        style,
      ]}
      elevation={1}
    >
      {(title || headerExtra) && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: hasChildren ? 12 : 0,
          }}
        >
          <View style={{ flex: 1, marginRight: headerExtra ? 8 : 0 }}>
            {onHeaderPress ? (
              <Pressable onPress={onHeaderPress}>
                {title && (
                  <Text variant="titleMedium" weight="bold">
                    {title}
                  </Text>
                )}
                {subtitle && (
                  <Text
                    variant="bodySmall"
                    className="text-zinc-400 mt-0.5"
                  >
                    {subtitle}
                  </Text>
                )}
              </Pressable>
            ) : (
              <>
                {title && (
                  <Text variant="titleMedium" weight="bold">
                    {title}
                  </Text>
                )}
                {subtitle && (
                  <Text
                    variant="bodySmall"
                    className="text-zinc-400 mt-0.5"
                  >
                    {subtitle}
                  </Text>
                )}
              </>
            )}
          </View>
          {headerExtra}
        </View>
      )}
      {hasChildren ? children : null}
    </Surface>
  );
}
