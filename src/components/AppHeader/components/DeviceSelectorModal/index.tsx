import { useState, useEffect } from "react";
import { View, ScrollView } from "react-native";
import {
  Modal,
  Portal,
  Button,
  IconButton,
  Divider,
  Surface,
  useTheme,
} from "react-native-paper";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Text } from "@/components/Text";
import {
  bluetoothService,
  type DiscoveredDevice,
  type PrinterStatus,
} from "@/lib/core";
import { DeviceItem } from "./components/DeviceItem";
import { ConnectedDeviceItem } from "./components/ConnectedDeviceItem";
import { ConnectingState } from "./components/ConnectingState";
import { EmptyState } from "@/components/EmptyState";
import { DisconnectConfirmDialog } from "./components/DisconnectConfirmDialog";

export function DeviceSelectorModal({
  visible,
  onDismiss,
}: {
  visible: boolean;
  onDismiss: () => void;
}) {
  const theme = useTheme();
  const [status, setStatus] = useState<PrinterStatus>("offline");
  const [connectedName, setConnectedName] = useState<string | null>(null);
  const [devices, setDevices] = useState<DiscoveredDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  useEffect(() => {
    const unsubStatus = bluetoothService.subscribeStatus(
      (newStatus: PrinterStatus, newDeviceName: string | null) => {
        setStatus(newStatus);
        setConnectedName(newDeviceName);
        if (newStatus === "online") {
          setIsConnecting(false);
        }
      },
    );

    const unsubScan = bluetoothService.subscribeScan(
      (discovered: DiscoveredDevice[], scanning: boolean, error: string | null) => {
        setDevices(discovered);
        setIsScanning(scanning);
        setScanError(error);
      },
    );

    return () => {
      unsubStatus();
      unsubScan();
    };
  }, []);

  useEffect(() => {
    if (visible && status === "offline") {
      handleScan();
    }
  }, [visible]);

  function handleScan() {
    setConnectError(null);
    bluetoothService.startScan();
  }

  async function handleConnect(device: DiscoveredDevice) {
    setIsConnecting(true);
    setConnectError(null);
    try {
      await bluetoothService.connectToDevice(device);
      onDismiss();
    } catch (err) {
      setConnectError(
        err instanceof Error ? err.message : "Failed to connect to printer",
      );
    } finally {
      setIsConnecting(false);
    }
  }

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={{
          backgroundColor: theme.colors.surface,
          margin: 20,
          padding: 20,
          borderRadius: 16,
          maxHeight: "85%",
        }}
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <MaterialIcons name="bluetooth" size={24} color={theme.colors.primary} />
            <Text variant="titleLarge" weight="bold">
              Bluetooth Printer
            </Text>
          </View>
          <IconButton icon="close" size={20} onPress={onDismiss} />
        </View>

        <Divider style={{ marginBottom: 16 }} />

        {status === "online" ? (
          <View className="gap-4">
            <ConnectedDeviceItem
              name={connectedName}
              mtuSize={bluetoothService.mtuSize}
            />
          </View>
        ) : (
          <ScrollView className="max-h-[340px]">
            {(scanError || connectError) && (
              <Surface
                style={{
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: "#450A0A",
                  marginBottom: 12,
                }}
              >
                <Text
                  variant="bodyMedium"
                  weight="medium"
                  className="text-red-300"
                >
                  {connectError || scanError}
                </Text>
              </Surface>
            )}

            {isConnecting && <ConnectingState />}

            {!isConnecting && (
              <View className="gap-1">
                {devices.length === 0 ? (
                  <EmptyState
                    isLoading={isScanning}
                    loadingText="Scanning for nearby BLE printers..."
                    icon="bluetooth-disabled"
                    title="No Bluetooth devices found yet."
                    description="Make sure your printer is powered ON and nearby."
                  />
                ) : (
                  devices.map((device) => (
                    <DeviceItem
                      key={device.id}
                      device={device}
                      onConnect={handleConnect}
                      disabled={isConnecting}
                    />
                  ))
                )}
              </View>
            )}
          </ScrollView>
        )}

        <Divider style={{ marginVertical: 16 }} />

        <View className="flex-row justify-end gap-2">
          {status === "online" ? (
            <Button
              mode="contained-tonal"
              className="w-full"
              icon="bluetooth-off"
              onPress={() => setShowDisconnectConfirm(true)}
              textColor={theme.colors.error}
            >
              Disconnect Printer
            </Button>
          ) : (
            <Button
              mode="contained"
              className="w-full"
              icon={isScanning ? undefined : "refresh"}
              onPress={handleScan}
              loading={isScanning}
              disabled={isScanning || isConnecting}
            >
              {isScanning ? "Scanning..." : "Scan for Devices"}
            </Button>
          )}
        </View>

        <DisconnectConfirmDialog
          visible={showDisconnectConfirm}
          deviceName={connectedName}
          onConfirm={() => bluetoothService.disconnect()}
          onDismiss={() => setShowDisconnectConfirm(false)}
        />
      </Modal>
    </Portal>
  );
}
