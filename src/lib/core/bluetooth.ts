import { Platform, PermissionsAndroid } from "react-native";
import { BleManager, Characteristic, Device, State } from "react-native-ble-plx";
import type { PrinterStatus } from "./types";
import { WRITE_UUID } from "./protocol";
import { uint8ArrayToBase64 } from "./base64";

export interface DiscoveredDevice {
  id: string;
  name: string;
  rssi: number | null;
  rawDevice: Device;
}

type StatusListener = (status: PrinterStatus, deviceName: string | null) => void;
type ScanListener = (devices: DiscoveredDevice[], isScanning: boolean, scanError: string | null) => void;
type BluetoothStateListener = (state: State) => void;

class BluetoothService {
  private manager: BleManager | null = null;
  private connectedDevice: Device | null = null;
  private writeCharacteristic: Characteristic | null = null;
  private connectedDeviceName: string | null = null;
  private currentStatus: PrinterStatus = "offline";
  private bluetoothState: State = State.Unknown;
  private statusListeners: Set<StatusListener> = new Set();
  private scanListeners: Set<ScanListener> = new Set();
  private stateListeners: Set<BluetoothStateListener> = new Set();
  private discoveredDevices: Map<string, DiscoveredDevice> = new Map();
  private isScanning = false;
  private lastScanError: string | null = null;
  private scanTimeout: ReturnJSSetTimeout | null = null;
  public mtuSize = 256;

  constructor() {
    try {
      this.manager = new BleManager();
      this.manager.onStateChange((state) => {
        this.bluetoothState = state;
        for (const listener of this.stateListeners) {
          listener(state);
        }
      }, true);
    } catch {
      this.manager = null;
    }
  }

  public getStatus(): PrinterStatus {
    return this.currentStatus;
  }

  public isConnected(): boolean {
    return this.currentStatus === "online" && this.connectedDevice !== null && this.writeCharacteristic !== null;
  }

  public getConnectedDeviceName(): string | null {
    return this.connectedDeviceName;
  }

  public getBluetoothState(): State {
    return this.bluetoothState;
  }

  public subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.currentStatus, this.connectedDeviceName);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  public subscribeScan(listener: ScanListener): () => void {
    this.scanListeners.add(listener);
    listener(Array.from(this.discoveredDevices.values()), this.isScanning, this.lastScanError);
    return () => {
      this.scanListeners.delete(listener);
    };
  }

  public subscribeState(listener: BluetoothStateListener): () => void {
    this.stateListeners.add(listener);
    listener(this.bluetoothState);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  private setStatus(status: PrinterStatus) {
    this.currentStatus = status;
    for (const listener of this.statusListeners) {
      listener(this.currentStatus, this.connectedDeviceName);
    }
  }

  private notifyScan() {
    const list = Array.from(this.discoveredDevices.values());
    for (const listener of this.scanListeners) {
      listener(list, this.isScanning, this.lastScanError);
    }
  }

  public async requestPermissions(): Promise<boolean> {
    if (Platform.OS === "android") {
      if (Platform.Version >= 31) {
        const results = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        return (
          results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
          results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    return true;
  }

  public async startScan(durationMs: number = 10000): Promise<void> {
    if (this.isScanning) return;
    this.discoveredDevices.clear();
    this.lastScanError = null;
    this.isScanning = true;
    this.notifyScan();

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      this.isScanning = false;
      this.lastScanError = "Bluetooth permissions were not granted. Please allow Bluetooth access in app settings.";
      this.notifyScan();
      return;
    }

    if (!this.manager) {
      this.isScanning = false;
      this.lastScanError = "Native Bluetooth manager not initialized.";
      this.notifyScan();
      return;
    }

    try {
      const state = await this.manager.state();
      if (state !== State.PoweredOn) {
        this.isScanning = false;
        this.lastScanError = `Bluetooth is ${state}. Please turn on Bluetooth in your device settings.`;
        this.notifyScan();
        return;
      }

      this.manager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
        if (error) {
          this.lastScanError = error.message || "Bluetooth scan error";
          this.stopScan();
          return;
        }

        if (device && (device.name || device.localName)) {
          const name = device.name || device.localName || "BLE Thermal Printer";
          this.discoveredDevices.set(device.id, {
            id: device.id,
            name,
            rssi: device.rssi,
            rawDevice: device,
          });
          this.notifyScan();
        }
      });

      this.scanTimeout = setTimeout(() => {
        this.stopScan();
      }, durationMs);
    } catch (err) {
      this.isScanning = false;
      this.lastScanError = err instanceof Error ? err.message : "Failed to start BLE scan";
      this.notifyScan();
    }
  }

  public stopScan() {
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }
    if (this.manager && this.isScanning) {
      try {
        this.manager.stopDeviceScan();
      } catch {}
    }
    this.isScanning = false;
    this.notifyScan();
  }

  public async connectToDevice(deviceItem: DiscoveredDevice | string): Promise<boolean> {
    this.stopScan();
    this.setStatus("connecting");

    const deviceId = typeof deviceItem === "string" ? deviceItem : deviceItem.id;
    const deviceName = typeof deviceItem === "string" ? deviceItem : deviceItem.name;

    if (!this.manager) {
      this.setStatus("offline");
      throw new Error("Native Bluetooth manager not initialized.");
    }

    try {
      const connected = await this.manager.connectToDevice(deviceId, { autoConnect: false });
      await connected.discoverAllServicesAndCharacteristics();

      if (Platform.OS === "android") {
        try {
          const updatedDevice = await connected.requestMTU(512);
          this.mtuSize = updatedDevice.mtu || 256;
        } catch {
          this.mtuSize = 256;
        }
      }

      // Discover writable GATT characteristic targeted at WRITE_UUID (0000AE01-...)
      const services = await connected.services();
      let targetChar: Characteristic | null = null;
      let candidateChar: Characteristic | null = null;

      for (const service of services) {
        const sUuid = service.uuid.toUpperCase();
        const characteristics = await service.characteristics();
        for (const char of characteristics) {
          const cUuid = char.uuid.toUpperCase();
          const isTargetUuid = cUuid.includes("AE01") || cUuid === WRITE_UUID.toUpperCase();
          const isTargetService = sUuid.includes("AE00") || sUuid.includes("AE30") || sUuid.includes("AE01");
          const isStandardGenericService = sUuid.startsWith("000018") || sUuid.length === 4;

          if (isTargetUuid) {
            targetChar = char;
            break;
          }

          if (isTargetService && (char.isWritableWithoutResponse || char.isWritableWithResponse)) {
            candidateChar = char;
          } else if (!isStandardGenericService && (char.isWritableWithoutResponse || char.isWritableWithResponse) && !candidateChar) {
            candidateChar = char;
          }
        }
        if (targetChar) break;
      }

      const finalChar = targetChar || candidateChar;
      if (!finalChar) {
        await connected.cancelConnection();
        throw new Error("Could not find a writable print characteristic on this Bluetooth device.");
      }

      this.connectedDevice = connected;
      this.writeCharacteristic = finalChar;
      this.connectedDeviceName = connected.name || connected.localName || deviceName;
      this.setStatus("online");

      connected.onDisconnected(() => {
        this.connectedDevice = null;
        this.writeCharacteristic = null;
        this.connectedDeviceName = null;
        this.setStatus("offline");
      });

      return true;
    } catch (err) {
      this.connectedDevice = null;
      this.writeCharacteristic = null;
      this.connectedDeviceName = null;
      this.setStatus("offline");
      throw err;
    }
  }

  public async writePacket(packet: Uint8Array): Promise<void> {
    if (!this.connectedDevice || !this.writeCharacteristic) {
      throw new Error("No physical thermal printer connected. Please connect via Bluetooth first.");
    }

    const mtuChunkSize = Math.max(20, this.mtuSize - 3);
    const serviceUuid = this.writeCharacteristic.serviceUUID;
    const charUuid = this.writeCharacteristic.uuid;

    for (let i = 0; i < packet.length; i += mtuChunkSize) {
      const slice = packet.slice(i, i + mtuChunkSize);
      const base64Chunk = uint8ArrayToBase64(slice);

      if (this.writeCharacteristic.isWritableWithoutResponse) {
        await this.connectedDevice.writeCharacteristicWithoutResponseForService(
          serviceUuid,
          charUuid,
          base64Chunk
        );
      } else {
        await this.connectedDevice.writeCharacteristicWithResponseForService(
          serviceUuid,
          charUuid,
          base64Chunk
        );
      }
      await new Promise((res) => setTimeout(res, 10));
    }
    await new Promise((res) => setTimeout(res, 20));
  }

  public async disconnect(): Promise<void> {
    if (this.connectedDevice) {
      try {
        await this.connectedDevice.cancelConnection();
      } catch {}
    }
    this.connectedDevice = null;
    this.writeCharacteristic = null;
    this.connectedDeviceName = null;
    this.setStatus("offline");
  }
}

type ReturnJSSetTimeout = ReturnType<typeof setTimeout>;

export const bluetoothService = new BluetoothService();
