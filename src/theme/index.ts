import { MD3DarkTheme, configureFonts } from "react-native-paper";

const fontConfig = {
  displayLarge: {
    fontFamily: "DMSans_700Bold",
    fontWeight: "normal" as const,
  },
  displayMedium: {
    fontFamily: "DMSans_700Bold",
    fontWeight: "normal" as const,
  },
  displaySmall: {
    fontFamily: "DMSans_700Bold",
    fontWeight: "normal" as const,
  },
  headlineLarge: {
    fontFamily: "DMSans_700Bold",
    fontWeight: "normal" as const,
  },
  headlineMedium: {
    fontFamily: "DMSans_700Bold",
    fontWeight: "normal" as const,
  },
  headlineSmall: {
    fontFamily: "DMSans_700Bold",
    fontWeight: "normal" as const,
  },
  titleLarge: {
    fontFamily: "DMSans_700Bold",
    fontWeight: "normal" as const,
  },
  titleMedium: {
    fontFamily: "DMSans_500Medium",
    fontWeight: "normal" as const,
  },
  titleSmall: {
    fontFamily: "DMSans_500Medium",
    fontWeight: "normal" as const,
  },
  labelLarge: {
    fontFamily: "DMSans_500Medium",
    fontWeight: "normal" as const,
  },
  labelMedium: {
    fontFamily: "DMSans_500Medium",
    fontWeight: "normal" as const,
  },
  labelSmall: {
    fontFamily: "DMSans_500Medium",
    fontWeight: "normal" as const,
  },
  bodyLarge: {
    fontFamily: "DMSans_400Regular",
    fontWeight: "normal" as const,
  },
  bodyMedium: {
    fontFamily: "DMSans_400Regular",
    fontWeight: "normal" as const,
  },
  bodySmall: {
    fontFamily: "DMSans_400Regular",
    fontWeight: "normal" as const,
  },
  default: {
    fontFamily: "DMSans_400Regular",
    fontWeight: "normal" as const,
  },
};

export const theme = {
  ...MD3DarkTheme,
  dark: true,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#FAFAFA",
    onPrimary: "#09090B",
    primaryContainer: "#27272A",
    onPrimaryContainer: "#FAFAFA",
    secondary: "#E4E4E7",
    onSecondary: "#09090B",
    secondaryContainer: "#27272A",
    onSecondaryContainer: "#FAFAFA",
    tertiary: "#D4D4D8",
    onTertiary: "#09090B",
    tertiaryContainer: "#27272A",
    onTertiaryContainer: "#FAFAFA",
    background: "#09090B",
    surface: "#18181B",
    surfaceVariant: "#27272A",
    onSurface: "#FAFAFA",
    onSurfaceVariant: "#A1A1AA",
    outline: "#3F3F46",
    outlineVariant: "#27272A",
    inverseSurface: "#FAFAFA",
    inverseOnSurface: "#09090B",
    inversePrimary: "#18181B",
    backdrop: "rgba(0, 0, 0, 0.7)",
    elevation: {
      level0: "transparent",
      level1: "#18181B",
      level2: "#202024",
      level3: "#27272A",
      level4: "#2C2C31",
      level5: "#333338",
    },
  },
};
