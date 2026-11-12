import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Languages, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { setAppLanguage } from '@/i18n';

export const LanguageSwitcher: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { i18n, t } = useTranslation();
  const currentLang = i18n.language.startsWith('hi') ? 'hi' : 'en';
  const [selected, setSelected] = useState<'en' | 'hi'>(currentLang);

  const handleSelectLanguage = async (lang: 'en' | 'hi') => {
    setSelected(lang);
    await setAppLanguage(lang);
  };

  return (
    <View className={`bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs gap-3 ${className}`}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 items-center justify-center">
            <Languages size={16} color="#2563EB" />
          </View>
          <View>
            <Text className="text-xs font-black text-slate-900 uppercase tracking-wider">
              {t('settings.language', 'App Language')}
            </Text>
            <Text className="text-[11px] text-slate-500">
              {selected === 'hi' ? 'हिन्दी सक्रिय है' : 'English is active'}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row gap-2">
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handleSelectLanguage('en')}
          accessibilityRole="button"
          accessibilityLabel="Switch to English"
          accessibilityState={{ selected: selected === 'en' }}
          className={`flex-1 py-2.5 px-3 rounded-xl border flex-row items-center justify-between ${
            selected === 'en'
              ? 'bg-blue-50 border-blue-600 shadow-xs'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              selected === 'en' ? 'text-blue-900' : 'text-slate-700'
            }`}
          >
            English
          </Text>
          {selected === 'en' && <Check size={14} color="#2563EB" />}
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handleSelectLanguage('hi')}
          accessibilityRole="button"
          accessibilityLabel="हिन्दी में बदलें"
          accessibilityState={{ selected: selected === 'hi' }}
          className={`flex-1 py-2.5 px-3 rounded-xl border flex-row items-center justify-between ${
            selected === 'hi'
              ? 'bg-blue-50 border-blue-600 shadow-xs'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              selected === 'hi' ? 'text-blue-900' : 'text-slate-700'
            }`}
          >
            हिन्दी (Hindi)
          </Text>
          {selected === 'hi' && <Check size={14} color="#2563EB" />}
        </TouchableOpacity>
      </View>
    </View>
  );
};
