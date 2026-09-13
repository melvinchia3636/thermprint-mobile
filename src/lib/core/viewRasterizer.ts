import { captureRef } from "react-native-view-shot";
import * as ImageManipulator from "expo-image-manipulator";
import jpeg from "jpeg-js";
import { base64ToUint8Array } from "./base64";
import { ditherGrayPixels, grayToNibbles, resizeAndGrayscale } from "./imageProcessor";

export type ViewCaptureTarget = Parameters<typeof captureRef>[0];

export interface RasterizedNibbles {
  nibbleData: Uint8Array;
  width: number;
  height: number;
}

export async function rasterizeViewToNibbles(
  viewRef: ViewCaptureTarget,
  targetWidth = 384
): Promise<RasterizedNibbles> {
  if (!viewRef) {
    throw new Error("Invalid view reference provided for rasterization.");
  }

  const uri = await captureRef(viewRef, {
    format: "png",
    quality: 1,
  });

  const manip = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: targetWidth } }],
    { format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );

  if (!manip.base64) {
    throw new Error("Failed to capture view image base64.");
  }

  const jpegBytes = base64ToUint8Array(manip.base64);
  const decoded = jpeg.decode(jpegBytes, { useTArray: true });
  const targetHeight = decoded.height;

  const gray = resizeAndGrayscale(
    decoded.data,
    decoded.width,
    decoded.height,
    targetWidth,
    targetHeight
  );

  const dithered = ditherGrayPixels(gray, targetWidth, targetHeight);
  const nibbleData = grayToNibbles(dithered, targetWidth, targetHeight);

  return {
    nibbleData,
    width: targetWidth,
    height: targetHeight,
  };
}
