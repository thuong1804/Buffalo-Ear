import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import type { Locale } from "./locale";
import viApp from "./locales/vi/app.json";
import viAuth from "./locales/vi/auth.json";
import viCommon from "./locales/vi/common.json";
import viErrors from "./locales/vi/errors.json";
import viFilters from "./locales/vi/filters.json";
import viIntro from "./locales/vi/intro.json";
import viLibrary from "./locales/vi/library.json";
import viPractice from "./locales/vi/practice.json";
import viProgress from "./locales/vi/progress.json";
import enApp from "./locales/en/app.json";
import enAuth from "./locales/en/auth.json";
import enCommon from "./locales/en/common.json";
import enErrors from "./locales/en/errors.json";
import enFilters from "./locales/en/filters.json";
import enIntro from "./locales/en/intro.json";
import enLibrary from "./locales/en/library.json";
import enPractice from "./locales/en/practice.json";
import enProgress from "./locales/en/progress.json";

export const resources = {
  vi: {
    app: viApp,
    auth: viAuth,
    common: viCommon,
    errors: viErrors,
    filters: viFilters,
    intro: viIntro,
    library: viLibrary,
    practice: viPractice,
    progress: viProgress,
  },
  en: {
    app: enApp,
    auth: enAuth,
    common: enCommon,
    errors: enErrors,
    filters: enFilters,
    intro: enIntro,
    library: enLibrary,
    practice: enPractice,
    progress: enProgress,
  },
};

export function createLocaleI18n(locale: Locale) {
  const instance = createInstance();
  void instance.use(initReactI18next).init({
    resources,
    lng: locale,
    fallbackLng: "vi",
    supportedLngs: ["vi", "en"],
    defaultNS: "common",
    initAsync: false,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
  return instance;
}
