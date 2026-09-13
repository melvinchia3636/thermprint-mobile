import { type StyleProp, type ViewStyle } from "react-native";
import { Button } from "react-native-paper";
import { usePrintProgress } from "@/contexts";

export function PrintButton({
  onPress,
  loading,
  disabled = false,
  style,
}: {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { isPrinting } = usePrintProgress();
  const isLoading = loading !== undefined ? loading : isPrinting;

  return (
    <Button
      mode="contained"
      icon="printer"
      onPress={onPress}
      loading={isLoading}
      disabled={disabled || isLoading}
      contentStyle={{ paddingVertical: 6 }}
      style={style}
    >
      Print
    </Button>
  );
}
