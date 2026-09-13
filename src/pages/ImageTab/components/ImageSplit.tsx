import { View } from "react-native";
import { Button, useTheme } from "react-native-paper";
import { Text } from "@/components/Text";
import { SectionCard } from "@/components/SectionCard";
import { NumberStepper } from "@/components/NumberStepper";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useImageConfig } from "../context";

export function ImageSplit() {
  const theme = useTheme();
  const { splitCols, setSplitCols, splitRows, setSplitRows, resetGrid } =
    useImageConfig();
  const totalStrips = splitCols * splitRows;

  return (
    <SectionCard
      title="Poster & Grid Splitting"
      headerExtra={
        totalStrips > 1 ? (
          <Button
            mode="text"
            compact
            onPress={resetGrid}
            textColor={theme.colors.primary}
          >
            Reset 1×1
          </Button>
        ) : undefined
      }
    >
      <View className="flex-row gap-3 mb-3">
        <NumberStepper
          style={{ flex: 1 }}
          label="Columns (Width)"
          value={splitCols}
          onChange={setSplitCols}
          min={1}
          max={10}
          step={1}
          iconSize={18}
        />
        <NumberStepper
          style={{ flex: 1 }}
          label="Rows (Height)"
          value={splitRows}
          onChange={setSplitRows}
          min={1}
          max={10}
          step={1}
          iconSize={18}
        />
      </View>

      {totalStrips > 1 && (
        <View
          className="flex-row items-center p-2.5 rounded-lg bg-zinc-800"
        >
          <MaterialIcons
            name="grid-view"
            size={20}
            color={theme.colors.primary}
            style={{ marginRight: 8 }}
          />
          <Text
            variant="bodySmall"
            className="flex-1 text-zinc-400"
          >
            Prints as a continuous strip of{" "}
            <Text weight="bold" className="text-white">{totalStrips} sections</Text>{" "}
            with dashed cut lines ({splitCols} columns × {splitRows} rows).
          </Text>
        </View>
      )}
    </SectionCard>
  );
}
