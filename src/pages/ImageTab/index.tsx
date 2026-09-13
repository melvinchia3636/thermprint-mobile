import { useState, useEffect, useRef } from "react";
import { ScrollView } from "react-native";
import { PrintButton } from "@/components/PrintButton";
import { PrintingProgressBar } from "@/components/PrintingProgressBar";
import { PrintSuccessModal } from "@/components/PrintSuccessModal";
import { ImagePicker } from "./components/ImagePicker";
import { ImageAdjust } from "./components/ImageAdjust";
import { ImageSplit } from "./components/ImageSplit";
import {
  imageService,
  useTabHardwareSettings,
  type ProcessedImageData,
} from "@/lib/services";
import { useRoute, type RouteProp } from "@react-navigation/native";
import { type RootStackParamList, toastService } from "@/lib/core";
import { DeviceSettings } from "@/components/DeviceSettings";
import { ImageConfigProvider, useImageConfig } from "./context";
import { usePrintAction } from "@/hooks";
import { PreviewCard } from "@/components/PreviewCard";

function ImageTabContent() {
  const route = useRoute<RouteProp<RootStackParamList, "image">>();
  const [imageUri, setImageUri] = useState<string | null>(route.params?.imageUri ?? null);

  useEffect(() => {
    if (route.params?.imageUri) {
      setImageUri(route.params.imageUri);
    }
  }, [route.params?.imageUri]);
  const {
    contrast,
    gamma,
    rotate,
    disablePreprocessing,
    ditherMethod,
    splitCols,
    splitRows,
  } = useImageConfig();

  const {
    settings: printerSettings,
    setSettings: setPrinterSettings,
    resetSettings: handleResetSettings,
  } = useTabHardwareSettings("image");

  const [isProcessing, setIsProcessing] = useState(false);
  const [processedData, setProcessedData] = useState<ProcessedImageData | null>(
    null,
  );

  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const { executePrint } = usePrintAction();

  const processTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!imageUri) {
      setProcessedData(null);
      return;
    }

    if (processTimerRef.current) {
      clearTimeout(processTimerRef.current);
    }

    setIsProcessing(true);
    processTimerRef.current = setTimeout(async () => {
      try {
        const data = await imageService.process(imageUri, {
          contrast,
          gamma,
          rotate,
          disablePreprocessing,
          ditherMethod,
          splitCols,
          splitRows,
        });
        setProcessedData(data);
      } catch (err) {
        toastService.show(
          err instanceof Error ? err.message : "Failed to process image.",
        );
      } finally {
        setIsProcessing(false);
      }
    }, 250);

    return () => {
      if (processTimerRef.current) {
        clearTimeout(processTimerRef.current);
      }
    };
  }, [
    imageUri,
    contrast,
    gamma,
    rotate,
    disablePreprocessing,
    ditherMethod,
    splitCols,
    splitRows,
  ]);

  async function handlePickLibrary() {
    try {
      const uri = await imageService.pickImageFromLibrary();
      if (uri) {
        setImageUri(uri);
      }
    } catch (err) {
      toastService.show(
        err instanceof Error
          ? err.message
          : "Failed to pick image from library.",
      );
    }
  }

  async function handlePickCamera() {
    try {
      const uri = await imageService.pickImageFromCamera();
      if (uri) {
        setImageUri(uri);
      }
    } catch (err) {
      toastService.show(
        err instanceof Error ? err.message : "Failed to capture photo.",
      );
    }
  }

  function handlePrintAnotherImage() {
    setIsSuccessModalOpen(false);
    setImageUri(null);
    setProcessedData(null);
    setTimeout(() => {
      handlePickLibrary();
    }, 200);
  }

  return (
    <>
      <ScrollView contentContainerClassName="p-4 pb-10">
        <ImagePicker
          imageUri={imageUri}
          onPickLibrary={handlePickLibrary}
          onPickCamera={handlePickCamera}
          onRemoveImage={() => {
            setImageUri(null);
            setProcessedData(null);
          }}
          origDimensions={
            processedData
              ? {
                  width: processedData.origWidth,
                  height: processedData.origHeight,
                }
              : undefined
          }
        />

        {imageUri && (
          <>
            <ImageAdjust />
            <ImageSplit />
            <DeviceSettings
              settings={printerSettings}
              onSettingsChange={setPrinterSettings}
              onResetSettings={handleResetSettings}
            />
            <PreviewCard isLoading={isProcessing} data={processedData} />
            <PrintingProgressBar />
            <PrintButton
              onPress={() =>
                executePrint(
                  () => imageService.print(processedData, printerSettings),
                  () => setIsSuccessModalOpen(true),
                )
              }
              disabled={!processedData || isProcessing}
            />
          </>
        )}
      </ScrollView>
      <PrintSuccessModal
        visible={isSuccessModalOpen}
        onDismiss={() => setIsSuccessModalOpen(false)}
        onPrintAgain={handlePrintAnotherImage}
        message="Would you like to print another image?"
        printAgainLabel="Print Another Image"
      />
    </>
  );
}

export function ImageTab() {
  return (
    <ImageConfigProvider>
      <ImageTabContent />
    </ImageConfigProvider>
  );
}
