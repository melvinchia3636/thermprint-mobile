import { useState, useEffect, useMemo } from "react";
import { View, TouchableOpacity } from "react-native";
import { Modal, Portal, Button, IconButton, useTheme } from "react-native-paper";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import dayjs from "dayjs";
import { Text } from "@/components/Text";

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function DatePickerModal({
  visible,
  onDismiss,
  value,
  onConfirm,
  title = "Select Date",
}: {
  visible: boolean;
  onDismiss: () => void;
  value: string;
  onConfirm: (date: string) => void;
  title?: string;
}) {
  const theme = useTheme();

  const [currentMonth, setCurrentMonth] = useState(() => {
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed.startOf("month") : dayjs().startOf("month");
  });

  const [selectedDate, setSelectedDate] = useState(() => {
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed : dayjs();
  });

  useEffect(() => {
    if (visible) {
      const parsed = dayjs(value);
      if (parsed.isValid()) {
        setSelectedDate(parsed);
        setCurrentMonth(parsed.startOf("month"));
      } else {
        const now = dayjs();
        setSelectedDate(now);
        setCurrentMonth(now.startOf("month"));
      }
    }
  }, [visible, value]);

  const calendarGrid = useMemo(() => {
    const daysInMonth = currentMonth.daysInMonth();
    const firstDayIso = (currentMonth.day() + 6) % 7; // Monday = 0, Sunday = 6

    const weeks: (number | null)[][] = [];
    let currentWeek: (number | null)[] = new Array(firstDayIso).fill(null);

    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [currentMonth]);

  const todayStr = dayjs().format("YYYY-MM-DD");
  const selectedStr = selectedDate.format("YYYY-MM-DD");

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={{
          backgroundColor: theme.colors.surface,
          marginHorizontal: 24,
          borderRadius: 20,
          padding: 20,
          elevation: 5,
        }}
      >
        <View className="mb-4">
          <Text
            variant="bodySmall"
            weight="bold"
            className="text-white uppercase tracking-wider"
          >
            {title}
          </Text>
          <Text
            variant="headlineSmall"
            weight="bold"
            className="mt-1"
          >
            {selectedDate.format("ddd, D MMM YYYY")}
          </Text>
        </View>

        <View className="flex-row items-center justify-between mb-3 px-1">
          <IconButton
            icon={() => <MaterialIcons name="chevron-left" size={24} color={theme.colors.onSurface} />}
            onPress={() => setCurrentMonth((prev) => prev.subtract(1, "month"))}
            size={20}
          />
          <Text variant="titleMedium" weight="bold">
            {currentMonth.format("MMMM YYYY")}
          </Text>
          <IconButton
            icon={() => <MaterialIcons name="chevron-right" size={24} color={theme.colors.onSurface} />}
            onPress={() => setCurrentMonth((prev) => prev.add(1, "month"))}
            size={20}
          />
        </View>

        <View
          className="flex-row justify-around mb-2"
        >
          {DAYS_OF_WEEK.map((day) => (
            <View key={day} className="w-[36px] items-center">
              <Text
                variant="bodySmall"
                weight="medium"
                className={day === "Sun" ? "text-red-400" : "text-zinc-400"}
              >
                {day}
              </Text>
            </View>
          ))}
        </View>

        <View className="gap-1">
          {calendarGrid.map((week, weekIdx) => (
            <View
              key={`week-${weekIdx}`}
              className="flex-row justify-around"
            >
              {week.map((dayNum, dayIdx) => {
                if (dayNum === null) {
                  return <View key={`empty-${dayIdx}`} className="w-[36px] h-[36px]" />;
                }

                const cellDateStr = currentMonth.date(dayNum).format("YYYY-MM-DD");
                const isSelected = cellDateStr === selectedStr;
                const isToday = cellDateStr === todayStr;

                return (
                  <TouchableOpacity
                    key={`day-${dayNum}`}
                    onPress={() => setSelectedDate(currentMonth.date(dayNum))}
                    activeOpacity={0.7}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isSelected
                        ? theme.colors.primary
                        : isToday
                        ? theme.colors.surfaceVariant
                        : "transparent",
                      borderWidth: isToday && !isSelected ? 1 : 0,
                      borderColor: theme.colors.primary,
                    }}
                  >
                    <Text
                      variant="bodyMedium"
                      weight={isSelected || isToday ? "bold" : "medium"}
                      className={
                        isSelected
                          ? "text-zinc-900"
                          : isToday
                          ? "text-white"
                          : "text-zinc-200"
                      }
                    >
                      {dayNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 20,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: theme.colors.outlineVariant || "#333333",
          }}
        >
          <Button
            mode="text"
            onPress={() => {
              const now = dayjs();
              setSelectedDate(now);
              setCurrentMonth(now.startOf("month"));
            }}
          >
            Today
          </Button>

          <View className="flex-row gap-2">
            <Button mode="text" onPress={onDismiss}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={() => {
                onConfirm(selectedDate.format("YYYY-MM-DD"));
                onDismiss();
              }}
            >
              OK
            </Button>
          </View>
        </View>
      </Modal>
    </Portal>
  );
}
