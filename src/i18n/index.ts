import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './locales/en.json';
import hi from './locales/hi.json';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
};

export const LANGUAGE_STORAGE_KEY = '@acadly_language';

const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'en';

i18n.use(initReactI18next).init({
  resources,
  lng: deviceLanguage === 'hi' ? 'hi' : 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
});

// Load persisted language choice
AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
  .then((saved) => {
    if (saved === 'hi' || saved === 'en') {
      i18n.changeLanguage(saved);
    }
  })
  .catch(() => null);

export const setAppLanguage = async (lang: 'en' | 'hi') => {
  await i18n.changeLanguage(lang);
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
};

export default i18n;
