import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import dayjs from "dayjs";
import { generateRandomCode } from "@/lib/services";

type SpineTagConfigContextType = {
  volume: string;
  startDate: string;
  endDate: string;
  code: string;
  setVolume: (val: string) => void;
  setStartDate: (val: string) => void;
  setEndDate: (val: string) => void;
  setCode: (val: string) => void;
  regenerateCode: () => void;
  resetConfig: () => void;
};

const SpineTagConfigContext = createContext<SpineTagConfigContextType | null>(null);

export function SpineTagConfigProvider({ children }: { children: ReactNode }) {
  const [volume, setVolume] = useState("1");
  const [startDate, setStartDate] = useState(() =>
    dayjs().startOf("month").format("YYYY-MM-DD"),
  );
  const [endDate, setEndDate] = useState(() =>
    dayjs().endOf("month").format("YYYY-MM-DD"),
  );
  const [code, setCode] = useState(() => generateRandomCode());

  return (
    <SpineTagConfigContext.Provider
      value={{
        volume,
        startDate,
        endDate,
        code,
        setVolume,
        setStartDate,
        setEndDate,
        setCode,
        regenerateCode: () => setCode(generateRandomCode()),
        resetConfig: () => {
          setVolume("1");
          setStartDate(dayjs().startOf("month").format("YYYY-MM-DD"));
          setEndDate(dayjs().endOf("month").format("YYYY-MM-DD"));
          setCode(generateRandomCode());
        },
      }}
    >
      {children}
    </SpineTagConfigContext.Provider>
  );
}

export function useSpineTagConfig(): SpineTagConfigContextType {
  const context = useContext(SpineTagConfigContext);
  if (!context) {
    throw new Error(
      "useSpineTagConfig must be used within a SpineTagConfigProvider",
    );
  }
  return context;
}
