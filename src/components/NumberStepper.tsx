import type { StyleProp, ViewStyle } from "react-native";
import { View, Pressable } from "react-native";
import { IconButton, useTheme } from "react-native-paper";
import { Text } from "@/components/Text";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export function roundToStep(val: number, step: number): number {
  const stepStr = step.toString();
  const decimals = stepStr.includes(".") ? stepStr.split(".")[1].length : 0;
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

export function NumberStepper({
  value,
  onChange,
  min,
  max,
  step = 1,
  formatValue,
  label,
  valueLabel,
  presets,
  formatPreset,
  disabled = false,
  iconSize = 20,
  style,
}: {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  formatValue?: (val: number) => string;
  label?: string;
  valueLabel?: string;
  presets?: number[];
  formatPreset?: (val: number) => string;
  disabled?: boolean;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();

  function handleDecrease() {
    if (disabled) return;
    const next = roundToStep(value - step, step);
    if (min !== undefined && next < min) {
      onChange(min);
    } else {
      onChange(next);
    }
  }

  function handleIncrease() {
    if (disabled) return;
    const next = roundToStep(value + step, step);
    if (max !== undefined && next > max) {
      onChange(max);
    } else {
      onChange(next);
    }
  }

  const displayVal = formatValue ? formatValue(value) : String(value);

  return (
    <View style={style}>
      {(label || valueLabel) && (
        <View className="flex-row justify-between items-center mb-1.5">
          {label && (
            <Text
              variant="bodySmall"
              weight="medium"
              className="text-zinc-400"
            >
              {label}
            </Text>
          )}
          {valueLabel && (
            <Text
              variant="bodySmall"
              weight="medium"
              className="text-white"
            >
              {valueLabel}
            </Text>
          )}
        </View>
      )}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: theme.colors.surfaceVariant,
          borderRadius: 8,
          padding: 4,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <IconButton
          icon={() => <MaterialIcons name="remove" size={iconSize} color={theme.colors.onSurface} />}
          size={iconSize}
          onPress={handleDecrease}
          disabled={disabled || (min !== undefined && value <= min)}
        />
        <View className="flex-1 items-center">
          <Text variant="bodyLarge" weight="bold">
            {displayVal}
          </Text>
        </View>
        <IconButton
          icon={() => <MaterialIcons name="add" size={iconSize} color={theme.colors.onSurface} />}
          size={iconSize}
          onPress={handleIncrease}
          disabled={disabled || (max !== undefined && value >= max)}
        />
      </View>

      {presets && presets.length > 0 && (
        <View className="flex-row flex-wrap gap-1.5 mt-2">
          {presets.map((presetVal) => {
            const isActive = Math.abs(value - presetVal) < (step / 2 || 0.001);
            return (
              <Pressable
                key={presetVal}
                onPress={() => !disabled && onChange(presetVal)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 6,
                  backgroundColor: isActive ? theme.colors.primary : theme.colors.surfaceVariant,
                }}
              >
                <Text
                  variant="bodySmall"
                  weight={isActive ? "bold" : "medium"}
                  className={isActive ? "text-zinc-900" : "text-zinc-400"}
                >
                  {formatPreset
                    ? formatPreset(presetVal)
                    : formatValue
                    ? formatValue(presetVal)
                    : String(presetVal)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
