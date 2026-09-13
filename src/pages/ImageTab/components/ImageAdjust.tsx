import { View } from "react-native";
import { Switch, SegmentedButtons, Button, useTheme } from "react-native-paper";
import { Text } from "@/components/Text";
import { SectionCard } from "@/components/SectionCard";
import { NumberStepper } from "@/components/NumberStepper";
import type { DitherMethod } from "@/lib/core";
import { useImageConfig } from "../context";

const CONTRAST_PRESETS = [0.5, 0.8, 1.0, 1.2, 1.5, 2.0];
const GAMMA_PRESETS = [0.6, 0.8, 1.0, 1.2, 1.4, 1.8];

export function ImageAdjust() {
  const theme = useTheme();
  const {
    contrast,
    setContrast,
    gamma,
    setGamma,
    rotate,
    setRotate,
    disablePreprocessing,
    setDisablePreprocessing,
    ditherMethod,
    setDitherMethod,
    resetAdjustments,
  } = useImageConfig();

  return (
    <SectionCard
      title="Image Adjustments"
      headerExtra={
        <Button
          mode="text"
          compact
          onPress={resetAdjustments}
          textColor={theme.colors.primary}
        >
          Reset
        </Button>
      }
    >
      <View className="mb-4">
        <Text
          variant="bodySmall"
          weight="medium"
          className="text-zinc-400 mb-2"
        >
          Rotation
        </Text>
        <SegmentedButtons
          value={String(rotate)}
          onValueChange={(val) => setRotate(Number(val) as 0 | 90 | 180 | 270)}
          buttons={[
            { value: "0", label: "0°" },
            { value: "90", label: "90°" },
            { value: "180", label: "180°" },
            { value: "270", label: "270°" },
          ]}
        />
      </View>

      <View className="mb-4">
        <Text
          variant="bodySmall"
          weight="medium"
          className="text-zinc-400 mb-2"
        >
          Dithering Mode
        </Text>
        <SegmentedButtons
          value={ditherMethod}
          onValueChange={(val) => setDitherMethod(val as DitherMethod)}
          buttons={[
            { value: "floyd-steinberg", label: "Floyd" },
            { value: "atkinson", label: "Atkinson" },
            { value: "bayer", label: "Bayer" },
            { value: "none", label: "None" },
          ]}
        />
        <Text variant="bodySmall" className="text-zinc-400 mt-1">
          {ditherMethod === "floyd-steinberg" && "Serpentine Floyd-Steinberg: smooth photo gradients"}
          {ditherMethod === "atkinson" && "Atkinson (75% error): sharp small text & illustrations"}
          {ditherMethod === "bayer" && "Bayer Ordered: zero pixel shifting, dot matrix texture"}
          {ditherMethod === "none" && "None: direct 16-level grayscale quantization"}
        </Text>
      </View>

      <View
        className="flex-row items-center justify-between mb-4 bg-zinc-800 p-3 rounded-lg"
      >
        <View className="flex-1 pr-3">
          <Text variant="bodyMedium" weight="medium" className="text-white">
            Disable Preprocessing
          </Text>
          <Text variant="bodySmall" className="text-zinc-400 mt-0.5">
            Bypass contrast, gamma, and percentile filters
          </Text>
        </View>
        <Switch
          value={disablePreprocessing}
          onValueChange={setDisablePreprocessing}
          color={theme.colors.primary}
        />
      </View>

      {!disablePreprocessing && (
        <>
          <NumberStepper
            label="Contrast"
            value={contrast}
            onChange={setContrast}
            min={0}
            max={5}
            step={0.1}
            valueLabel={`${contrast.toFixed(1)}x`}
            formatValue={(v) => `${v.toFixed(1)}x`}
            presets={CONTRAST_PRESETS}
            style={{ marginBottom: 16 }}
          />

          <NumberStepper
            label="Gamma (Midtones & Brightness)"
            value={gamma}
            onChange={setGamma}
            min={0.1}
            max={5}
            step={0.1}
            valueLabel={gamma.toFixed(1)}
            formatValue={(v) => v.toFixed(1)}
            presets={GAMMA_PRESETS}
          />
        </>
      )}
    </SectionCard>
  );
}
