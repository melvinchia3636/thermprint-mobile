import type { RefObject } from "react";
import { View, Image } from "react-native";
import { SvgXml } from "react-native-svg";
import { ActivityIndicator, Icon, useTheme } from "react-native-paper";
import { Text } from "@/components/Text";
import { SectionCard } from "@/components/SectionCard";

export function PreviewCard({
  data,
  canvasRef,
  noticeText,
  isLoading = false,
}: {
  data?: {
    svgXml?: string;
    previewUri?: string;
    width: number;
    height: number;
  } | null;
  canvasRef?: RefObject<View | null>;
  noticeText?: string;
  isLoading?: boolean;
}) {
  const theme = useTheme();

  return (
    <SectionCard
      title="Thermal Print Preview"
      headerExtra={
        data && (
          <Text variant="bodySmall" weight="medium" className="text-zinc-400">
            {`${data.width} × ${data.height} px`}
          </Text>
        )
      }
    >
      {isLoading ? (
        <View className="items-center py-8">
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyMedium" className="mt-3 text-zinc-400">
            Generating preview...
          </Text>
        </View>
      ) : data ? (
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 8,
            width: "100%",
            maxWidth: 384,
            alignSelf: "center",
            padding: 12,
            alignItems: "center",
            shadowColor: "#000000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <View
            ref={canvasRef}
            collapsable={false}
            style={{
              width: "100%",
              aspectRatio: data.width / data.height,
              backgroundColor: "#FFFFFF",
              borderRadius: 4,
              overflow: "hidden",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {data?.svgXml ? (
              <SvgXml xml={data.svgXml} width="100%" height="100%" />
            ) : data.previewUri ? (
              <Image
                source={{ uri: data.previewUri }}
                className="w-full h-full"
                resizeMode="contain"
              />
            ) : null}
          </View>
        </View>
      ) : (
        <View className="items-center py-8">
          <Icon
            source="image-outline"
            size={40}
            color={theme.colors.onSurfaceVariant}
          />
          <Text variant="bodyMedium" className="mt-3 text-zinc-400 text-center">
            Preview will appear here
          </Text>
        </View>
      )}

      {noticeText && (
        <View className="flex-row items-center gap-2 mt-3">
          <Icon
            source="information-outline"
            size={18}
            color={theme.colors.primary}
          />
          <Text variant="bodySmall" className="text-zinc-400 flex-1">
            {noticeText}
          </Text>
        </View>
      )}
    </SectionCard>
  );
}
