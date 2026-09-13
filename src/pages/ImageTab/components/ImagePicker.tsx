import { View, Image, Pressable } from "react-native";
import { Button, IconButton, useTheme } from "react-native-paper";
import { Text } from "@/components/Text";
import { SectionCard } from "@/components/SectionCard";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export function ImagePicker({
  imageUri,
  onPickLibrary,
  onPickCamera,
  onRemoveImage,
  origDimensions,
}: {
  imageUri: string | null;
  onPickLibrary: () => void;
  onPickCamera: () => void;
  onRemoveImage: () => void;
  origDimensions?: { width: number; height: number };
}) {
  const theme = useTheme();

  return (
    <SectionCard
      title="Select Image"
      headerExtra={
        imageUri ? (
          <IconButton
            icon={() => <MaterialIcons name="delete-outline" size={20} color={theme.colors.error} />}
            size={20}
            onPress={onRemoveImage}
          />
        ) : undefined
      }
    >
      {imageUri ? (
        <View className="items-center">
          <View
            className="w-full h-[200px] bg-zinc-800 rounded-lg overflow-hidden border border-zinc-800 items-center justify-center"
          >
            <Image
              source={{ uri: imageUri }}
              className="w-full h-full"
              resizeMode="contain"
            />
          </View>

          {origDimensions && (
            <View
              className="flex-row items-center gap-1.5 mt-2"
            >
              <MaterialIcons name="photo-size-select-actual" size={16} color={theme.colors.onSurfaceVariant} />
              <Text
                variant="bodySmall"
                weight="medium"
                className="text-zinc-400"
              >
                Source: {origDimensions.width} × {origDimensions.height} px
              </Text>
            </View>
          )}

          <View
            className="flex-row gap-2.5 mt-3 w-full"
          >
            <Button
              mode="outlined"
              icon={() => <MaterialIcons name="photo-library" size={18} color={theme.colors.primary} />}
              onPress={onPickLibrary}
              style={{ flex: 1 }}
            >
              Change Photo
            </Button>
            <Button
              mode="outlined"
              icon={() => <MaterialIcons name="photo-camera" size={18} color={theme.colors.primary} />}
              onPress={onPickCamera}
              style={{ flex: 1 }}
            >
              Take Photo
            </Button>
          </View>
        </View>
      ) : (
        <View>
          <Pressable
            onPress={onPickLibrary}
            className="w-full h-[160px] rounded-lg border-2 border-dashed border-zinc-800 bg-zinc-800 items-center justify-center p-4"
          >
            <MaterialIcons
              name="add-photo-alternate"
              size={48}
              color={theme.colors.primary}
            />
            <Text
              variant="bodyLarge"
              weight="medium"
              className="mt-3 text-white"
            >
              Choose from Photo Library
            </Text>
            <Text
              variant="bodySmall"
              className="text-zinc-400 mt-1 text-center"
            >
              PNG, JPEG, WebP, or Camera Photo
            </Text>
          </Pressable>

          <Button
            mode="outlined"
            icon={() => <MaterialIcons name="photo-camera" size={18} color={theme.colors.primary} />}
            onPress={onPickCamera}
            style={{ marginTop: 12 }}
          >
            Take Photo with Camera
          </Button>
        </View>
      )}
    </SectionCard>
  );
}
