import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Import all translations
import enUS from "./en-US.json";
import es419 from "./es-419.json";
import esES from "./es-ES.json";

i18n.use(initReactI18next).init({
  resources: {
    "en-US": { translation: enUS },
    "es-419": { translation: es419 },
    "es-ES": { translation: esES },
    // Language-only fallbacks for i18next
    "en": { translation: enUS },
    // Use Spain Spanish as the default for language-only 'es'
    // to maximize coverage across the app's keys
    "es": { translation: esES },
  },
  lng: "es", // Hard-coded to Spanish
  fallbackLng: "en", // English as fallback
  interpolation: {
    escapeValue: false,
  },
  // Enable clean key separation
  keySeparator: ".",
  nsSeparator: false, // Disable namespace separator since we're not using namespaces
});

export default i18n;
