import { View } from "react-native";
import { TextInput, Button, useTheme } from "react-native-paper";
import { Text } from "@/components/Text";
import { SectionCard } from "@/components/SectionCard";
import type { YouTubeMetadata } from "@/lib/services";
import { useYouTubeConfig } from "../context";

export function YouTubeVideoInput({
  onLoadPreview,
  isLoadingPreview,
  metadata,
}: {
  onLoadPreview: () => void;
  isLoadingPreview: boolean;
  metadata: YouTubeMetadata | null;
}) {
  const theme = useTheme();
  const { inputUrl, setInputUrl } = useYouTubeConfig();

  return (
    <SectionCard title="YouTube Video">
      <TextInput
        mode="outlined"
        label="Video URL or ID"
        placeholder="https://youtu.be/... or video ID"
        value={inputUrl}
        onChangeText={setInputUrl}
        autoCapitalize="none"
        keyboardType="url"
        right={
          inputUrl ? (
            <TextInput.Icon icon="close" onPress={() => setInputUrl("")} />
          ) : undefined
        }
        style={{
          backgroundColor: theme.colors.surfaceVariant,
          marginBottom: 12,
        }}
      />

      <Button
        mode="contained-tonal"
        icon="magnify"
        onPress={onLoadPreview}
        loading={isLoadingPreview}
        disabled={isLoadingPreview || !inputUrl.trim()}
      >
        Load Preview
      </Button>

      {metadata && (
        <View className="mt-3 p-3 rounded-lg bg-zinc-800">
          <Text
            variant="titleMedium"
            weight="bold"
            numberOfLines={2}
          >
            {metadata.title}
          </Text>
          {metadata.authorName && (
            <Text
              variant="bodyMedium"
              className="text-zinc-400 mt-1"
            >
              {metadata.authorName}
            </Text>
          )}
        </View>
      )}
    </SectionCard>
  );
}
