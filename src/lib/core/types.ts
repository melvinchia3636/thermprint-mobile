export type PrinterStatus = "offline" | "connecting" | "online";

export type FeatureTab =
  | "image"
  | "qrcode"
  | "calendar"
  | "spine_tag"
  | "youtube"
  | "nfc_tag";

export type RootStackParamList = {
  Home: undefined;
  image: { imageUri?: string } | undefined;
  qrcode: undefined;
  calendar: undefined;
  spine_tag: undefined;
  youtube: undefined;
  nfc_tag: undefined;
};
