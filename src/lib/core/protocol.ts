import { LZO } from "lzo-ts";

export const WRITE_UUID = "0000AE01-0000-1000-8000-00805F9B34FB";
export const GRAY_LEVELS = 16;

const CHECKSUM_TABLE = new Int8Array([
  0, 7, 14, 9, 28, 27, 18, 21, 56, 63, 54, 49, 36, 35, 42, 45,
  112, 119, 126, 121, 108, 107, 98, 101, 72, 79, 70, 65, 84, 83, 90, 93,
  -32, -25, -18, -23, -4, -5, -14, -11, -40, -33, -42, -47, -60, -61, -54, -51,
  -112, -105, -98, -103, -116, -117, -126, -123, -88, -81, -90, -95, -76, -77, -70, -67,
  -57, -64, -55, -50, -37, -36, -43, -46, -1, -8, -15, -10, -29, -28, -19, -22,
  -73, -80, -71, -66, -85, -84, -91, -94, -113, -120, -127, -122, -109, -108, -99, -102,
  39, 32, 41, 46, 59, 60, 53, 50, 31, 24, 17, 22, 3, 4, 13, 10,
  87, 80, 89, 94, 75, 76, 69, 66, 111, 104, 97, 102, 115, 116, 125, 122,
  -119, -114, -121, -128, -107, -110, -101, -100, -79, -74, -65, -72, -83, -86, -93, -92,
  -7, -2, -9, -16, -27, -30, -21, -20, -63, -58, -49, -56, -35, -38, -45, -44,
  105, 110, 103, 96, 117, 114, 123, 124, 81, 86, 95, 88, 77, 74, 67, 68,
  25, 30, 23, 16, 5, 2, 11, 12, 33, 38, 47, 40, 61, 58, 51, 52,
  78, 73, 64, 71, 82, 85, 92, 91, 118, 113, 120, 127, 106, 109, 100, 99,
  62, 57, 48, 55, 34, 37, 44, 43, 6, 1, 8, 15, 26, 29, 20, 19,
  -82, -87, -96, -89, -78, -75, -68, -69, -106, -111, -104, -97, -118, -115, -124, -125,
  -34, -39, -48, -41, -62, -59, -52, -53, -26, -31, -24, -17, -6, -3, -12, -13
]);

export function crc8(data: Uint8Array | number[]): number {
  let crc = 0;
  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    crc = CHECKSUM_TABLE[(crc ^ byte) & 0xFF];
  }
  return crc & 0xFF;
}

export function buildPacket(cmd: number, payload: Uint8Array | number[], sub: number = 0x00): Uint8Array {
  const length = payload.length;
  const pkt = new Uint8Array(8 + length);
  pkt[0] = 0x51;
  pkt[1] = 0x78;
  pkt[2] = cmd & 0xFF;
  pkt[3] = sub & 0xFF;
  pkt[4] = length & 0xFF;
  pkt[5] = (length >> 8) & 0xFF;

  for (let i = 0; i < length; i++) {
    pkt[6 + i] = payload[i];
  }

  pkt[6 + length] = crc8(payload);
  pkt[7 + length] = 0xFF;
  return pkt;
}

export function setEnergy(energyValue: number): Uint8Array {
  return buildPacket(0xAF, [energyValue & 0xFF, (energyValue >> 8) & 0xFF]);
}

export function setQuality(level: number): Uint8Array {
  return buildPacket(0xA4, [level & 0xFF]);
}

export function setPrintModeGray16(): Uint8Array {
  return buildPacket(0xBE, [0x00, 0x01]);
}

export function feedPaperSpeed(speed: number): Uint8Array {
  return buildPacket(0xBD, [speed & 0xFF]);
}

export function feedPaper(pixels: number): Uint8Array {
  return buildPacket(0xA1, [pixels & 0xFF, (pixels >> 8) & 0xFF]);
}

export function getDevState(): Uint8Array {
  return buildPacket(0xA3, [0x00]);
}

export function buildGrayScanPacket(rawData: Uint8Array): Uint8Array {
  const compressed = LZO.compress(rawData);
  const origLen = rawData.length;
  const compLen = compressed.length;

  const payload = new Uint8Array(4 + compLen);
  payload[0] = origLen & 0xFF;
  payload[1] = (origLen >> 8) & 0xFF;
  payload[2] = compLen & 0xFF;
  payload[3] = (compLen >> 8) & 0xFF;
  payload.set(compressed, 4);

  const length = compLen + 4;
  const pkt = new Uint8Array(8 + length);
  pkt[0] = 0x51;
  pkt[1] = 0x78;
  pkt[2] = 0xCF;
  pkt[3] = 0x00;
  pkt[4] = length & 0xFF;
  pkt[5] = (length >> 8) & 0xFF;
  pkt.set(payload, 6);
  pkt[6 + length] = crc8(payload);
  pkt[7 + length] = 0xFF;

  return pkt;
}
