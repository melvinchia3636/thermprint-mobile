import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

type YouTubeConfigContextType = {
  inputUrl: string;
  setInputUrl: (url: string) => void;
  resetConfig: () => void;
};

const YouTubeConfigContext = createContext<YouTubeConfigContextType | null>(null);

export function YouTubeConfigProvider({ children }: { children: ReactNode }) {
  const [inputUrl, setInputUrl] = useState("");

  return (
    <YouTubeConfigContext.Provider
      value={{
        inputUrl,
        setInputUrl,
        resetConfig: () => setInputUrl(""),
      }}
    >
      {children}
    </YouTubeConfigContext.Provider>
  );
}

export function useYouTubeConfig(): YouTubeConfigContextType {
  const context = useContext(YouTubeConfigContext);
  if (!context) {
    throw new Error(
      "useYouTubeConfig must be used within a YouTubeConfigProvider",
    );
  }
  return context;
}
