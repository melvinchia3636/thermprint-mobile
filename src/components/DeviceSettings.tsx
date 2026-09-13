import { useState } from "react";
import { View, Pressable, type StyleProp, type ViewStyle } from "react-native";
import {
  TextInput,
  Button,
  IconButton,
  RadioButton,
  useTheme,
} from "react-native-paper";
import { Text } from "@/components/Text";
import { SectionCard } from "@/components/SectionCard";
import { Modal } from "@/components/Modal";
import { NumberStepper } from "@/components/NumberStepper";
import type { PrintSettingsOptions } from "@/lib/core";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const QUALITY_OPTIONS = [
  {
    value: 49,
    name: "Light",
    desc: "Lowest heat, fastest print, saves battery",
  },
  { value: 50, name: "Normal", desc: "Standard balanced default" },
  { value: 51, name: "Dark", desc: "Higher contrast and deep shadows" },
  { value: 52, name: "Vivid", desc: "Saturated dark tones" },
  { value: 53, name: "Max", desc: "Maximum thermal head dwell heat" },
];

const SPEED_OPTIONS = [
  {
    value: 10,
    name: "Fast",
    desc: "10 units - Quickest feed for rapid prints",
  },
  {
    value: 20,
    name: "Normal",
    desc: "20 units - Standard balanced feed speed",
  },
  {
    value: 40,
    name: "Slow",
    desc: "40 units - Slower feed for improved contrast",
  },
  {
    value: 60,
    name: "Ultra Slow",
    desc: "60 units - Maximum dwell time for deep dark output",
  },
];

export function DeviceSettings({
  settings,
  onSettingsChange,
  onResetSettings,
  title = "Printer Hardware Settings",
  defaultExpanded = false,
  style,
}: {
  settings: PrintSettingsOptions;
  onSettingsChange: (newSettings: PrintSettingsOptions) => void;
  onResetSettings?: () => void;
  title?: string;
  defaultExpanded?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isQualityModalOpen, setIsQualityModalOpen] = useState(false);
  const [isSpeedModalOpen, setIsSpeedModalOpen] = useState(false);

  const currentQualityObj =
    QUALITY_OPTIONS.find((opt) => opt.value === settings.quality) ||
    QUALITY_OPTIONS[1];

  const currentSpeedObj = SPEED_OPTIONS.find(
    (opt) => opt.value === settings.speed,
  ) || {
    value: settings.speed,
    name: `Custom (${settings.speed})`,
    desc: `${settings.speed} units custom speed`,
  };

  const delayText = `${((settings.chunkDelayMs ?? 0) / 1000).toFixed(1)}s delay`;
  const summarySubtitle = `${currentQualityObj.name} • ${settings.energy === 0 ? "Auto" : settings.energy.toLocaleString()} energy • ${currentSpeedObj.name} speed • ${delayText}`;

  return (
    <>
      <SectionCard
        title={title}
        subtitle={!isExpanded ? summarySubtitle : undefined}
        style={style}
        onHeaderPress={() => setIsExpanded(!isExpanded)}
        headerExtra={
          <IconButton
            icon={isExpanded ? "chevron-up" : "chevron-down"}
            size={24}
            onPress={() => setIsExpanded(!isExpanded)}
            style={{ margin: 0, marginTop: -8 }}
          />
        }
      >
        {isExpanded ? (
          <View>
            <View className="mb-4">
              <Text
                variant="bodySmall"
                weight="medium"
                className="text-zinc-400 mb-2"
              >
                Print Heat Quality
              </Text>
              <Pressable onPress={() => setIsQualityModalOpen(true)}>
                <View pointerEvents="none">
                  <TextInput
                    mode="outlined"
                    value={currentQualityObj.name}
                    editable={false}
                    left={
                      <TextInput.Icon
                        icon={() => (
                          <MaterialIcons
                            name="whatshot"
                            size={20}
                            color={theme.colors.primary}
                          />
                        )}
                      />
                    }
                    right={
                      <TextInput.Icon
                        icon={() => (
                          <MaterialIcons
                            name="arrow-drop-down"
                            size={24}
                            color={theme.colors.onSurfaceVariant}
                          />
                        )}
                      />
                    }
                    style={{ backgroundColor: theme.colors.surfaceVariant }}
                  />
                </View>
              </Pressable>
            </View>

            <NumberStepper
              label="Thermal Energy"
              value={settings.energy}
              onChange={(val) =>
                onSettingsChange({
                  ...settings,
                  energy: val,
                })
              }
              min={0}
              max={12000}
              step={1000}
              formatValue={(val) =>
                val === 0 ? "0 (Auto)" : `${val.toLocaleString()} units`
              }
              presets={[0, 9000, 10000, 11000, 12000]}
              formatPreset={(val) =>
                val === 0 ? "0 (Auto)" : val.toLocaleString()
              }
              style={{ marginBottom: 16 }}
              iconSize={18}
            />

            <View className="mb-4">
              <Text
                variant="bodySmall"
                weight="medium"
                className="text-zinc-400 mb-2"
              >
                Paper Feed Speed
              </Text>
              <Pressable onPress={() => setIsSpeedModalOpen(true)}>
                <View pointerEvents="none">
                  <TextInput
                    mode="outlined"
                    value={currentSpeedObj.name}
                    editable={false}
                    left={
                      <TextInput.Icon
                        icon={() => (
                          <MaterialIcons
                            name="speed"
                            size={20}
                            color={theme.colors.primary}
                          />
                        )}
                      />
                    }
                    right={
                      <TextInput.Icon
                        icon={() => (
                          <MaterialIcons
                            name="arrow-drop-down"
                            size={24}
                            color={theme.colors.onSurfaceVariant}
                          />
                        )}
                      />
                    }
                    style={{ backgroundColor: theme.colors.surfaceVariant }}
                  />
                </View>
              </Pressable>
            </View>

            <NumberStepper
              label="BLE Chunk Delay"
              value={settings.chunkDelayMs}
              onChange={(val) =>
                onSettingsChange({
                  ...settings,
                  chunkDelayMs: val,
                })
              }
              min={0}
              max={1000}
              step={100}
              formatValue={(val) =>
                val === 0 ? "0.0s (No Delay)" : `${(val / 1000).toFixed(1)}s`
              }
              iconSize={18}
            />

            {onResetSettings && (
              <Button
                mode="outlined"
                onPress={onResetSettings}
                style={{ marginTop: 16 }}
                textColor={theme.colors.primary}
                icon="refresh"
              >
                Reset to Defaults
              </Button>
            )}
          </View>
        ) : null}
      </SectionCard>

      <Modal
        visible={isQualityModalOpen}
        onDismiss={() => setIsQualityModalOpen(false)}
        title="Select Print Heat Quality"
        secondaryAction={{
          label: "Cancel",
          onPress: () => setIsQualityModalOpen(false),
        }}
      >
        <View className="gap-2">
          {QUALITY_OPTIONS.map((opt) => {
            const isSelected = settings.quality === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => {
                  onSettingsChange({ ...settings, quality: opt.value });
                  setIsQualityModalOpen(false);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: isSelected
                    ? theme.colors.surfaceVariant
                    : "transparent",
                  borderWidth: 1,
                  borderColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.outlineVariant,
                }}
              >
                <RadioButton.Android
                  value={String(opt.value)}
                  status={isSelected ? "checked" : "unchecked"}
                  onPress={() => {
                    onSettingsChange({ ...settings, quality: opt.value });
                    setIsQualityModalOpen(false);
                  }}
                  color={theme.colors.primary}
                />
                <View className="flex-1 ml-2">
                  <Text
                    variant="bodyLarge"
                    weight="medium"
                    className="text-white"
                  >
                    {opt.name}
                  </Text>
                  <Text
                    variant="bodySmall"
                    className="text-zinc-400 mt-0.5"
                  >
                    {opt.desc}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </Modal>

      <Modal
        visible={isSpeedModalOpen}
        onDismiss={() => setIsSpeedModalOpen(false)}
        title="Select Paper Feed Speed"
        secondaryAction={{
          label: "Cancel",
          onPress: () => setIsSpeedModalOpen(false),
        }}
      >
        <View className="gap-2">
          {SPEED_OPTIONS.map((opt) => {
            const isSelected = settings.speed === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => {
                  onSettingsChange({ ...settings, speed: opt.value });
                  setIsSpeedModalOpen(false);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: isSelected
                    ? theme.colors.surfaceVariant
                    : "transparent",
                  borderWidth: 1,
                  borderColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.outlineVariant,
                }}
              >
                <RadioButton.Android
                  value={String(opt.value)}
                  status={isSelected ? "checked" : "unchecked"}
                  onPress={() => {
                    onSettingsChange({ ...settings, speed: opt.value });
                    setIsSpeedModalOpen(false);
                  }}
                  color={theme.colors.primary}
                />
                <View className="flex-1 ml-2">
                  <Text
                    variant="bodyLarge"
                    weight="medium"
                    className="text-white"
                  >
                    {opt.name}
                  </Text>
                  <Text
                    variant="bodySmall"
                    className="text-zinc-400 mt-0.5"
                  >
                    {opt.desc}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </Modal>
    </>
  );
}
