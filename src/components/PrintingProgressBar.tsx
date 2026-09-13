import { type StyleProp, type ViewStyle } from "react-native";
import { ProgressBar, Surface, useTheme } from "react-native-paper";
import { Text } from "@/components/Text";
import { usePrintProgress } from "@/contexts";

export function PrintingProgressBar({
  visible,
  message,
  style,
}: {
  visible?: boolean;
  message?: string | null;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const context = usePrintProgress();

  const isVisible = visible !== undefined ? visible : context.isPrinting;
  const displayMessage =
    message !== undefined ? message : context.printProgress;

  if (!isVisible) return null;

  return (
    <Surface
      style={[
        {
          marginBottom: 16,
          padding: 16,
          borderRadius: 12,
          backgroundColor: theme.colors.surfaceVariant,
        },
        style,
      ]}
      elevation={1}
    >
      <Text
        variant="titleMedium"
        weight="medium"
        className="mb-2"
      >
        Printing in progress...
      </Text>
      <ProgressBar
        indeterminate
        color={theme.colors.primary}
        style={{ height: 6, borderRadius: 3 }}
      />
      {displayMessage ? (
        <Text
          variant="bodyMedium"
          className="text-zinc-400 mt-2"
        >
          {displayMessage}
        </Text>
      ) : null}
    </Surface>
  );
}
