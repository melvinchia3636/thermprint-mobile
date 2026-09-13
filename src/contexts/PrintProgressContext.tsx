import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

type PrintProgressContextType = {
  isPrinting: boolean;
  printProgress: string | null;
  setIsPrinting: (val: boolean) => void;
  setPrintProgress: (msg: string | null) => void;
  startPrinting: (msg?: string) => void;
  finishPrinting: () => void;
};

const PrintProgressContext = createContext<PrintProgressContextType | null>(
  null,
);

export function PrintProgressProvider({ children }: { children: ReactNode }) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [printProgress, setPrintProgress] = useState<string | null>(null);

  function startPrinting(msg?: string) {
    setIsPrinting(true);
    setPrintProgress(msg ?? "Streaming to thermal printer...");
  }

  function finishPrinting() {
    setIsPrinting(false);
    setPrintProgress(null);
  }

  return (
    <PrintProgressContext.Provider
      value={{
        isPrinting,
        printProgress,
        setIsPrinting,
        setPrintProgress,
        startPrinting,
        finishPrinting,
      }}
    >
      {children}
    </PrintProgressContext.Provider>
  );
}

export function usePrintProgress(): PrintProgressContextType {
  const context = useContext(PrintProgressContext);
  if (!context) {
    throw new Error(
      "usePrintProgress must be used within a PrintProgressProvider",
    );
  }
  return context;
}
