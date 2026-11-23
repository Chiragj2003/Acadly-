import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Languages } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { setAppLanguage } from '@/i18n';

const OPTIONS: { id: 'en' | 'hi'; label: string; a11y: string }[] = [
  { id: 'en', label: 'English', a11y: 'Switch to English' },
  { id: 'hi', label: 'हिन्दी', a11y: 'हिन्दी में बदलें' },
];

/** Soft Desk language row: label on the left, a two-option pill switch on the right. */
export const LanguageSwitcher: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { i18n, t } = useTranslation();
  const [selected, setSelected] = useState<'en' | 'hi'>(i18n.language?.startsWith('hi') ? 'hi' : 'en');

  const choose = async (lang: 'en' | 'hi') => {
    setSelected(lang);
    await setAppLanguage(lang);
  };

  return (
    <View className={`bg-white rounded-3xl px-4 min-h-[64px] flex-row items-center gap-3 ${className}`}>
      <View className="w-9 h-9 rounded-full bg-paper items-center justify-center">
        <Languages size={17} color="#1C1C1E" />
      </View>
      <Text className="flex-1 font-sans-semibold text-ink text-[15px]">{t('settings.language', 'Language')}</Text>
      <View accessibilityRole="radiogroup" className="flex-row bg-paper rounded-full p-1">
        {OPTIONS.map((o) => {
          const active = selected === o.id;
          return (
            <Pressable
              key={o.id}
              accessibilityRole="radio"
              accessibilityLabel={o.a11y}
              accessibilityState={{ selected: active }}
              onPress={() => choose(o.id)}
              className={`h-9 px-3.5 rounded-full items-center justify-center ${active ? 'bg-ink' : ''}`}
            >
              <Text className={`font-sans-bold text-[13px] ${active ? 'text-white' : 'text-ink'}`}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};
