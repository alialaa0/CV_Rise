import { useContext } from "react";
import { LanguageContext } from "../context/LanguageContextCore";

export function useLanguage() {
  return useContext(LanguageContext);
}
