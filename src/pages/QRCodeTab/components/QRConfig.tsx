import { useState } from "react";
import { View, Image } from "react-native";
import {
  TextInput,
  SegmentedButtons,
  Button,
  IconButton,
  useTheme,
} from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Text } from "@/components/Text";
import { SectionCard } from "@/components/SectionCard";
import type { ErrorCorrectionLevel } from "@/lib/services";
import { useQRCodeConfig } from "../context";

const SIZE_PRESETS = [
  { label: "Small", value: 180 },
  { label: "Medium", value: 260 },
  { label: "Large", value: 340 },
  { label: "Max (384px)", value: 384 },
];

const EC_LEVELS: {
  label: string;
  value: ErrorCorrectionLevel;
  desc: string;
}[] = [
  { label: "L", value: "L", desc: "7%" },
  { label: "M", value: "M", desc: "15%" },
  { label: "Q", value: "Q", desc: "25%" },
  { label: "H", value: "H", desc: "30%" },
];

export function QRConfig() {
  const theme = useTheme();
  const {
    contentType,
    setContentType,
    text,
    setText,
    size,
    setSize,
    errorCorrection,
    setErrorCorrection,
    logo,
    setLogo,
  } = useQRCodeConfig();

  const [isProcessingImage, setIsProcessingImage] = useState(false);

  async function handlePickImage() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setIsProcessingImage(true);
        const asset = result.assets[0];

        const manipulated = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 120, height: 120 } }],
          {
            compress: 0.7,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true,
          },
        );

        setLogo({
          uri: manipulated.uri,
          base64: manipulated.base64 || undefined,
          sizeRatio: 0.22,
          padding: 4,
          borderRadius: 4,
        });

        if (errorCorrection === "L" || errorCorrection === "M") {
          setErrorCorrection("H");
        }
      }
    } catch {
      // Permission or picker failure
    } finally {
      setIsProcessingImage(false);
    }
  }

  return (
    <SectionCard title="QR Code Configuration">
      <SegmentedButtons
        value={contentType}
        onValueChange={(val) => setContentType(val as "url" | "text")}
        buttons={[
          { value: "url", label: "Website URL", icon: "link" },
          { value: "text", label: "Plain Text", icon: "text" },
        ]}
        style={{ marginBottom: 12 }}
      />

      <TextInput
        mode="outlined"
        label={contentType === "url" ? "URL Address" : "Text Content"}
        placeholder={
          contentType === "url"
            ? "https://example.com"
            : "Enter text to encode..."
        }
        value={text}
        onChangeText={setText}
        autoCapitalize="none"
        keyboardType={contentType === "url" ? "url" : "default"}
        right={
          text ? (
            <TextInput.Icon icon="close" onPress={() => setText("")} />
          ) : undefined
        }
        style={{
          backgroundColor: theme.colors.surfaceVariant,
          marginBottom: 16,
        }}
      />

      <View className="mb-4">
        <Text
          variant="bodySmall"
          className="text-zinc-400 mb-2"
        >
          Center Logo / Image
        </Text>
        {logo ? (
          <View className="flex-row items-center justify-between bg-zinc-800 p-2.5 rounded-xl">
            <View className="flex-row items-center gap-3">
              <Image
                source={{ uri: logo.uri }}
                className="w-[44px] h-[44px] rounded-lg bg-white"
              />
              <View>
                <Text variant="bodyMedium" weight="medium">
                  Embedded Image
                </Text>
                <Text
                  variant="bodySmall"
                  className="text-zinc-400"
                >
                  Auto EC: High (H) recommended
                </Text>
              </View>
            </View>
            <View className="flex-row items-center">
              <IconButton
                icon="pencil"
                size={20}
                onPress={handlePickImage}
                disabled={isProcessingImage}
              />
              <IconButton
                icon="trash-can-outline"
                size={20}
                iconColor={theme.colors.error}
                onPress={() => setLogo(null)}
                disabled={isProcessingImage}
              />
            </View>
          </View>
        ) : (
          <Button
            mode="outlined"
            icon="image-plus"
            onPress={handlePickImage}
            loading={isProcessingImage}
            disabled={isProcessingImage}
            style={{ borderColor: theme.colors.outline }}
          >
            {isProcessingImage
              ? "Processing image..."
              : "Embed Center Image / Logo"}
          </Button>
        )}
      </View>

      <View className="mb-4">
        <Text
          variant="bodySmall"
          className="text-zinc-400 mb-1.5"
        >
          QR Code Size ({size}px)
        </Text>
        <SegmentedButtons
          value={String(size)}
          onValueChange={(val) => setSize(Number(val))}
          buttons={SIZE_PRESETS.map((p) => ({
            value: String(p.value),
            label: p.label,
          }))}
        />
      </View>

      <View>
        <Text
          variant="bodySmall"
          className="text-zinc-400 mb-1.5"
        >
          Error Correction Level
        </Text>
        <SegmentedButtons
          value={errorCorrection}
          onValueChange={(val) =>
            setErrorCorrection(val as ErrorCorrectionLevel)
          }
          buttons={EC_LEVELS.map((ec) => ({
            value: ec.value,
            label: `${ec.label} (${ec.desc})`,
          }))}
        />
      </View>
    </SectionCard>
  );
}
