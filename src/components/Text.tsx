import { Text as RNText, type TextProps as RNTextProps } from "react-native";

export type TextVariant =
  | "displayLarge"
  | "displayMedium"
  | "displaySmall"
  | "headlineLarge"
  | "headlineMedium"
  | "headlineSmall"
  | "titleLarge"
  | "titleMedium"
  | "titleSmall"
  | "bodyLarge"
  | "bodyMedium"
  | "bodySmall"
  | "labelLarge"
  | "labelMedium"
  | "labelSmall";

export type FontFamily = "DMSans" | "IBMPlexSans";
export type FontWeight = "regular" | "medium" | "bold";

const VARIANT_STYLES: Record<
  TextVariant,
  { fontSize: number; lineHeight: number; defaultWeight: FontWeight }
> = {
  displayLarge: { fontSize: 57, lineHeight: 64, defaultWeight: "bold" },
  displayMedium: { fontSize: 45, lineHeight: 52, defaultWeight: "bold" },
  displaySmall: { fontSize: 36, lineHeight: 44, defaultWeight: "bold" },
  headlineLarge: { fontSize: 32, lineHeight: 40, defaultWeight: "bold" },
  headlineMedium: { fontSize: 28, lineHeight: 36, defaultWeight: "bold" },
  headlineSmall: { fontSize: 24, lineHeight: 32, defaultWeight: "bold" },
  titleLarge: { fontSize: 22, lineHeight: 28, defaultWeight: "bold" },
  titleMedium: { fontSize: 16, lineHeight: 24, defaultWeight: "medium" },
  titleSmall: { fontSize: 14, lineHeight: 20, defaultWeight: "medium" },
  labelLarge: { fontSize: 14, lineHeight: 20, defaultWeight: "medium" },
  labelMedium: { fontSize: 12, lineHeight: 16, defaultWeight: "medium" },
  labelSmall: { fontSize: 11, lineHeight: 16, defaultWeight: "medium" },
  bodyLarge: { fontSize: 16, lineHeight: 24, defaultWeight: "regular" },
  bodyMedium: { fontSize: 14, lineHeight: 20, defaultWeight: "regular" },
  bodySmall: { fontSize: 12, lineHeight: 16, defaultWeight: "regular" },
};

export type TextProps = Omit<RNTextProps, "style"> & {
  variant?: TextVariant;
  weight?: FontWeight;
  fontFamily?: FontFamily;
  className?: string;
};

export function Text({
  variant,
  weight,
  fontFamily = "DMSans",
  className,
  children,
  ...props
}: TextProps) {
  const resolvedWeight: FontWeight =
    weight || (variant && VARIANT_STYLES[variant]?.defaultWeight) || "regular";

  let resolvedFontFamily: string;
  if (fontFamily === "IBMPlexSans") {
    resolvedFontFamily =
      resolvedWeight === "bold"
        ? "IBMPlexSans_700Bold"
        : resolvedWeight === "medium"
        ? "IBMPlexSans_500Medium"
        : "IBMPlexSans_400Regular";
  } else {
    resolvedFontFamily =
      resolvedWeight === "bold"
        ? "DMSans_700Bold"
        : resolvedWeight === "medium"
        ? "DMSans_500Medium"
        : "DMSans_400Regular";
  }

  const variantStyle =
    variant && VARIANT_STYLES[variant]
      ? {
          fontSize: VARIANT_STYLES[variant].fontSize,
          lineHeight: VARIANT_STYLES[variant].lineHeight,
        }
      : {};

  return (
    <RNText
      {...props}
      className={`text-zinc-50 ${className ?? ""}`}
      style={[
        {
          fontSize: 16,
          lineHeight: 24,
        },
        variantStyle,
        { fontFamily: resolvedFontFamily },
      ]}
    >
      {children}
    </RNText>
  );
}
