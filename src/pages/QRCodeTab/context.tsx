import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { ErrorCorrectionLevel, EmbeddedLogoOptions } from "@/lib/services";

type QRCodeConfigContextType = {
  contentType: "url" | "text";
  text: string;
  size: number;
  errorCorrection: ErrorCorrectionLevel;
  logo: EmbeddedLogoOptions | null;
  setContentType: (type: "url" | "text") => void;
  setText: (text: string) => void;
  setSize: (size: number) => void;
  setErrorCorrection: (ec: ErrorCorrectionLevel) => void;
  setLogo: (logo: EmbeddedLogoOptions | null) => void;
  resetConfig: () => void;
};

const QRCodeConfigContext = createContext<QRCodeConfigContextType | null>(null);

export function QRCodeConfigProvider({ children }: { children: ReactNode }) {
  const [contentType, setContentType] = useState<"url" | "text">("url");
  const [text, setText] = useState("https://github.com");
  const [size, setSize] = useState(260);
  const [errorCorrection, setErrorCorrection] =
    useState<ErrorCorrectionLevel>("M");
  const [logo, setLogo] = useState<EmbeddedLogoOptions | null>(null);

  function resetConfig() {
    setContentType("url");
    setText("https://github.com");
    setSize(260);
    setErrorCorrection("M");
    setLogo(null);
  }

  return (
    <QRCodeConfigContext.Provider
      value={{
        contentType,
        text,
        size,
        errorCorrection,
        logo,
        setContentType,
        setText,
        setSize,
        setErrorCorrection,
        setLogo,
        resetConfig,
      }}
    >
      {children}
    </QRCodeConfigContext.Provider>
  );
}

export function useQRCodeConfig(): QRCodeConfigContextType {
  const context = useContext(QRCodeConfigContext);
  if (!context) {
    throw new Error(
      "useQRCodeConfig must be used within a QRCodeConfigProvider",
    );
  }
  return context;
}
