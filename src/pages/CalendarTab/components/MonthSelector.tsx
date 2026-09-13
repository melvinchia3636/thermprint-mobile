import { View } from "react-native";
import { Button, IconButton, useTheme } from "react-native-paper";
import { Text } from "@/components/Text";
import { SectionCard } from "@/components/SectionCard";
import { useCalendarConfig } from "../context";

export function MonthSelector() {
  const theme = useTheme();
  const { selectedDate, prevMonth, nextMonth } = useCalendarConfig();

  return (
    <SectionCard title="Select Month">
      <View className="flex-row items-center justify-between">
        <IconButton
          icon="chevron-left"
          mode="contained-tonal"
          size={24}
          onPress={prevMonth}
        />

        <View className="items-center">
          <Text variant="headlineSmall" weight="bold">
            {selectedDate.format("MMMM")}
          </Text>
          <Text variant="bodySmall" className="text-zinc-400">
            {selectedDate.format("YYYY")}
          </Text>
        </View>

        <IconButton
          icon="chevron-right"
          mode="contained-tonal"
          size={24}
          onPress={nextMonth}
        />
      </View>
    </SectionCard>
  );
}
