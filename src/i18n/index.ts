import { useCallback, useEffect, useState } from "react";
import { enUS } from "./locales/en-US";
import { jaJP } from "./locales/ja-JP";
import { zhCN } from "./locales/zh-CN";
import type { TranslationDictionary } from "./locales/types";

export type Language = "zh-CN" | "ja-JP" | "en-US";
export type TranslationKey = keyof typeof zhCN;
export type TFunction = (key: TranslationKey, params?: Record<string, string | number>) => string;

const storageKey = "crm-ai-gateway-language";
const dictionaries: Record<Language, TranslationDictionary> = {
  "zh-CN": zhCN,
  "ja-JP": jaJP,
  "en-US": enUS,
};

export const languages: Array<{ value: Language; labelKey: TranslationKey }> = [
  { value: "zh-CN", labelKey: "language.zhCN" },
  { value: "ja-JP", labelKey: "language.jaJP" },
  { value: "en-US", labelKey: "language.enUS" },
];

export function translate(language: Language, key: TranslationKey, params: Record<string, string | number> = {}) {
  const template = dictionaries[language]?.[key] || zhCN[key] || key;
  return Object.entries(params).reduce((text, [paramKey, value]) => text.split(`{${paramKey}}`).join(String(value)), template);
}

export function useI18n() {
  const [language, setLanguageState] = useState<Language>(() => readStoredLanguage());

  useEffect(() => {
    localStorage.setItem(storageKey, language);
  }, [language]);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(dictionaries[nextLanguage] ? nextLanguage : "zh-CN");
  }, []);

  const t = useCallback<TFunction>((key, params) => translate(language, key, params), [language]);

  return { language, setLanguage, t };
}

function readStoredLanguage(): Language {
  if (typeof localStorage === "undefined") return "zh-CN";
  const value = localStorage.getItem(storageKey);
  return value === "ja-JP" || value === "en-US" || value === "zh-CN" ? value : "zh-CN";
}

export { zhCN, jaJP, enUS };
