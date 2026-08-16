import React, { useEffect, useState, useMemo } from "react";
import { LanguageContext } from "./LanguageContextCore";
import { translations } from "../i18n/translations";

const STORAGE_KEY = "cvrise_lang";

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "ar" || saved === "en") return saved;
      if (typeof navigator !== "undefined" && navigator.language?.startsWith("ar")) {
        return "ar";
      }
    } catch {
      // ignore storage access errors
    }
    return "en";
  });

  const dir = language === "ar" ? "rtl" : "ltr";

  const setLanguage = (newLang) => {
    if (newLang !== "en" && newLang !== "ar") return;
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
  }, [language, dir]);

  const t = useMemo(() => {
    return (key, params = {}, fallback = "") => {
      const dict = translations[language] || translations.en;
      let text = dict[key] || translations.en[key] || fallback || key;

      if (params && typeof params === "object") {
        Object.entries(params).forEach(([paramKey, val]) => {
          text = text.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(val));
        });
      }

      return text;
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, dir, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
