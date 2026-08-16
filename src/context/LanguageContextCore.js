import { createContext } from "react";

export const LanguageContext = createContext({
  language: "en",
  dir: "ltr",
  setLanguage: () => {},
  t: (key, params, fallback) => fallback || key,
});
