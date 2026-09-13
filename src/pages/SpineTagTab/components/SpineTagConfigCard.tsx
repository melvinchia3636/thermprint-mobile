import { useState } from "react";
import { View, Pressable } from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import { SectionCard } from "@/components/SectionCard";
import { DatePickerModal } from "@/components/DatePickerModal";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useSpineTagConfig } from "../context";

export function SpineTagConfigCard() {
  const theme = useTheme();
  const {
    volume,
    setVolume,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    code,
    setCode,
    regenerateCode,
  } = useSpineTagConfig();

  const [activeDatePicker, setActiveDatePicker] = useState<"start" | "end" | null>(null);

  return (
    <SectionCard title="Journal Tag Configuration">
      <View className="mb-4">
        <TextInput
          mode="outlined"
          label="Volume Number"
          placeholder="e.g. 1 (formatted as 001 on tag)"
          value={volume}
          onChangeText={(val) => setVolume(val.replace(/[^0-9]/g, ""))}
          keyboardType="number-pad"
          left={
            <TextInput.Icon
              icon={() => (
                <MaterialIcons
                  name="bookmark"
                  size={20}
                  color={theme.colors.primary}
                />
              )}
            />
          }
          style={{ backgroundColor: theme.colors.surfaceVariant }}
        />
      </View>

      <View className="mb-4">
        <Pressable onPress={() => setActiveDatePicker("start")}>
          <View pointerEvents="none">
            <TextInput
              mode="outlined"
              label="Start Date"
              value={startDate}
              editable={false}
              left={
                <TextInput.Icon
                  icon={() => (
                    <MaterialIcons
                      name="event"
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

      <View className="mb-4">
        <Pressable onPress={() => setActiveDatePicker("end")}>
          <View pointerEvents="none">
            <TextInput
              mode="outlined"
              label="End Date"
              value={endDate}
              editable={false}
              left={
                <TextInput.Icon
                  icon={() => (
                    <MaterialIcons
                      name="event-available"
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

      <View>
        <TextInput
          mode="outlined"
          label="Data Matrix Code (16 chars)"
          placeholder="16-character alphanumeric code"
          value={code}
          onChangeText={(val) => setCode(val.toUpperCase())}
          maxLength={16}
          autoCapitalize="characters"
          left={
            <TextInput.Icon
              icon={() => (
                <MaterialIcons
                  name="qr-code-2"
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
                  name="refresh"
                  size={22}
                  color={theme.colors.primary}
                />
              )}
              onPress={regenerateCode}
            />
          }
          style={{ backgroundColor: theme.colors.surfaceVariant }}
        />
      </View>

      <DatePickerModal
        visible={activeDatePicker !== null}
        onDismiss={() => setActiveDatePicker(null)}
        title={activeDatePicker === "start" ? "Select Start Date" : "Select End Date"}
        value={activeDatePicker === "start" ? startDate : endDate}
        onConfirm={(newDate) => {
          if (activeDatePicker === "start") setStartDate(newDate);
          else if (activeDatePicker === "end") setEndDate(newDate);
        }}
      />
    </SectionCard>
  );
}
