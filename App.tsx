import { Buffer } from "buffer";
global.Buffer = global.Buffer || Buffer;

import "./global.css";
import { useState, useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PaperProvider, Surface, ActivityIndicator } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_700Bold,
} from "@expo-google-fonts/ibm-plex-sans";
import { NavigationContainer, DarkTheme as NavDarkTheme, useNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator, NativeStackHeaderProps } from "@react-navigation/native-stack";
import { theme } from "./src/theme";
import { AppHeader } from "./src/components/AppHeader";
import { GlobalToast } from "./src/components/GlobalToast";
import { HomeScreen } from "./src/pages/HomeScreen";
import { ImageTab } from "./src/pages/ImageTab";
import { QRCodeTab } from "./src/pages/QRCodeTab";
import { CalendarTab } from "./src/pages/CalendarTab";
import { SpineTagTab } from "./src/pages/SpineTagTab";
import { YouTubeTab } from "./src/pages/YouTubeTab";
import { DeviceSelectorModal } from "./src/components/AppHeader/components/DeviceSelectorModal";
import { PrintProgressProvider } from "./src/contexts";
import { shareIntentService } from "./src/lib/services";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  bluetoothService,
  toastService,
  type PrinterStatus,
  type RootStackParamList,
} from "./src/lib/core";

const Stack = createNativeStackNavigator<RootStackParamList>();

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>["name"];

const MODE_TITLES: Record<string, { title: string; subtitle: string; icon: MaterialIconName }> = {
  Home: { title: "ThermPrint", subtitle: "Thermal BLE Printer", icon: "receipt-long" },
  image: { title: "Image Printing", subtitle: "Thermal BLE Print", icon: "image" },
  qrcode: { title: "QR Code", subtitle: "Thermal BLE Print", icon: "qr-code" },
  calendar: { title: "Calendar", subtitle: "Thermal BLE Print", icon: "calendar-month" },
  spine_tag: { title: "Journal Spine Tag", subtitle: "Thermal BLE Print", icon: "label" },
  youtube: { title: "YouTube Video", subtitle: "Thermal BLE Print", icon: "smart-display" },
};

const navigationTheme = {
  ...NavDarkTheme,
  colors: {
    ...NavDarkTheme.colors,
    background: "#09090B",
    card: "#18181B",
    text: "#FAFAFA",
    border: "#27272A",
    primary: "#FAFAFA",
  },
};

export default function App() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_700Bold,
  });

  const [status, setStatus] = useState<PrinterStatus>("offline");
  const [connectedDeviceName, setConnectedDeviceName] = useState<string | null>(null);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [pendingShareUri, setPendingShareUri] = useState<string | null>(null);
  const navigationRef = useNavigationContainerRef<RootStackParamList>();

  function handleShareUri(uri: string) {
    if (navigationRef.isReady()) {
      navigationRef.navigate("image", { imageUri: uri });
    } else {
      setPendingShareUri(uri);
    }
  }

  function handleNavigationReady() {
    if (pendingShareUri) {
      navigationRef.navigate("image", { imageUri: pendingShareUri });
      setPendingShareUri(null);
    }
  }

  useEffect(() => {
    let prevStatus: PrinterStatus = "offline";
    const unsub = bluetoothService.subscribeStatus((newStatus: PrinterStatus, deviceName: string | null) => {
      if (newStatus === "online" && prevStatus !== "online") {
        toastService.show(`Connected to ${deviceName || "thermal printer"}`);
      }
      prevStatus = newStatus;
      setStatus(newStatus);
      setConnectedDeviceName(deviceName);
    });
    return () => {
      unsub();
    };
  }, []);

  useEffect(() => {
    shareIntentService.getInitialSharedUri().then((uri) => {
      if (uri) {
        handleShareUri(uri);
      }
    });

    const unsubShare = shareIntentService.subscribeSharedImage((uri) => {
      handleShareUri(uri);
    });

    return () => {
      unsubShare();
    };
  }, []);

  function handleBluetoothPress() {
    setIsDeviceModalOpen(true);
  }

  if (!fontsLoaded) {
    return (
      <PaperProvider theme={theme}>
        <Surface style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" animating={true} />
        </Surface>
      </PaperProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <PrintProgressProvider>
          <StatusBar style="light" />
          <NavigationContainer
            ref={navigationRef}
            theme={navigationTheme}
            onReady={handleNavigationReady}
          >
            <Stack.Navigator
              initialRouteName="Home"
              screenOptions={{
                contentStyle: { backgroundColor: theme.colors.background },
                header: ({ navigation, back, route }: NativeStackHeaderProps) => {
                  const info = MODE_TITLES[route.name] || {
                    title: "ThermPrint",
                    subtitle: "Thermal BLE Printer",
                    icon: "receipt-long",
                  };
                  const subtitle =
                    status === "online" && connectedDeviceName
                      ? `Connected: ${connectedDeviceName}`
                      : info.subtitle;

                  return (
                    <AppHeader
                      status={status}
                      title={info.title}
                      subtitle={subtitle}
                      icon={info.icon}
                      canGoBack={Boolean(back)}
                      onGoBack={navigation.goBack}
                      onPressBluetooth={handleBluetoothPress}
                    />
                  );
                },
              }}
            >
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="image" component={ImageTab} />
              <Stack.Screen name="qrcode" component={QRCodeTab} />
              <Stack.Screen name="calendar" component={CalendarTab} />
              <Stack.Screen name="spine_tag" component={SpineTagTab} />
              <Stack.Screen name="youtube" component={YouTubeTab} />
            </Stack.Navigator>

            <DeviceSelectorModal
              visible={isDeviceModalOpen}
              onDismiss={() => setIsDeviceModalOpen(false)}
            />

            <GlobalToast />
          </NavigationContainer>
        </PrintProgressProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
