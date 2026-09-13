import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import type { DitherMethod } from "@/lib/core";
import {
  DEFAULT_IMAGE_CONFIG,
  loadImageConfig,
  saveImageConfig,
} from "@/lib/services";

type ImageConfigContextType = {
  contrast: number;
  gamma: number;
  rotate: 0 | 90 | 180 | 270;
  disablePreprocessing: boolean;
  ditherMethod: DitherMethod;
  splitCols: number;
  splitRows: number;
  setContrast: (val: number) => void;
  setGamma: (val: number) => void;
  setRotate: (val: 0 | 90 | 180 | 270) => void;
  setDisablePreprocessing: (val: boolean) => void;
  setDitherMethod: (method: DitherMethod) => void;
  setSplitCols: (val: number) => void;
  setSplitRows: (val: number) => void;
  resetAdjustments: () => void;
  resetGrid: () => void;
  resetAllConfig: () => void;
};

const ImageConfigContext = createContext<ImageConfigContextType | null>(null);

export function ImageConfigProvider({ children }: { children: ReactNode }) {
  const [contrast, setContrast] = useState(DEFAULT_IMAGE_CONFIG.contrast);
  const [gamma, setGamma] = useState(DEFAULT_IMAGE_CONFIG.gamma);
  const [rotate, setRotate] = useState<0 | 90 | 180 | 270>(
    DEFAULT_IMAGE_CONFIG.rotate,
  );
  const [disablePreprocessing, setDisablePreprocessing] = useState(
    DEFAULT_IMAGE_CONFIG.disablePreprocessing,
  );
  const [ditherMethod, setDitherMethod] = useState<DitherMethod>(
    DEFAULT_IMAGE_CONFIG.ditherMethod,
  );
  const [splitCols, setSplitCols] = useState(DEFAULT_IMAGE_CONFIG.splitCols);
  const [splitRows, setSplitRows] = useState(DEFAULT_IMAGE_CONFIG.splitRows);

  const isLoadedRef = useRef(false);

  useEffect(() => {
    async function initConfig() {
      try {
        const config = await loadImageConfig();
        setContrast(config.contrast);
        setGamma(config.gamma);
        setRotate(config.rotate);
        setDisablePreprocessing(config.disablePreprocessing);
        setDitherMethod(config.ditherMethod);
        setSplitCols(config.splitCols);
        setSplitRows(config.splitRows);
      } catch {
        // Fall back to default state
      } finally {
        isLoadedRef.current = true;
      }
    }
    initConfig();
  }, []);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    saveImageConfig({
      contrast,
      gamma,
      rotate,
      disablePreprocessing,
      ditherMethod,
      splitCols,
      splitRows,
    });
  }, [
    contrast,
    gamma,
    rotate,
    disablePreprocessing,
    ditherMethod,
    splitCols,
    splitRows,
  ]);

  function resetAdjustments() {
    setContrast(DEFAULT_IMAGE_CONFIG.contrast);
    setGamma(DEFAULT_IMAGE_CONFIG.gamma);
    setRotate(DEFAULT_IMAGE_CONFIG.rotate);
    setDisablePreprocessing(DEFAULT_IMAGE_CONFIG.disablePreprocessing);
    setDitherMethod(DEFAULT_IMAGE_CONFIG.ditherMethod);
  }

  function resetGrid() {
    setSplitCols(DEFAULT_IMAGE_CONFIG.splitCols);
    setSplitRows(DEFAULT_IMAGE_CONFIG.splitRows);
  }

  function resetAllConfig() {
    resetAdjustments();
    resetGrid();
  }

  return (
    <ImageConfigContext.Provider
      value={{
        contrast,
        gamma,
        rotate,
        disablePreprocessing,
        ditherMethod,
        splitCols,
        splitRows,
        setContrast,
        setGamma,
        setRotate,
        setDisablePreprocessing,
        setDitherMethod,
        setSplitCols,
        setSplitRows,
        resetAdjustments,
        resetGrid,
        resetAllConfig,
      }}
    >
      {children}
    </ImageConfigContext.Provider>
  );
}

export function useImageConfig(): ImageConfigContextType {
  const context = useContext(ImageConfigContext);
  if (!context) {
    throw new Error("useImageConfig must be used within an ImageConfigProvider");
  }
  return context;
}
