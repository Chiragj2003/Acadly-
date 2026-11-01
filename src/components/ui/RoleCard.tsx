import React from 'react';
import { View, Text, Pressable } from 'react-native';
import {
  ShieldCheck,
  GraduationCap,
  BookOpen,
  Users,
  Check,
  type LucideIcon,
} from 'lucide-react-native';

export type UserRoleType = 'admin' | 'teacher' | 'student' | 'parent';

export interface RoleCardConfig {
  role: UserRoleType;
  title: string;
  subtitle: string;
  badge: string;
  icon: LucideIcon;
}

export const ROLE_CONFIGS: Record<UserRoleType, RoleCardConfig> = {
  admin: {
    role: 'admin',
    title: 'Director / Admin',
    subtitle: 'Full ERP, Cashflow & Batches',
    badge: 'Center Super-Admin',
    icon: ShieldCheck,
  },
  teacher: {
    role: 'teacher',
    title: 'Faculty / Tutor',
    subtitle: 'Daily Attendance & Marks',
    badge: 'Faculty Portal',
    icon: BookOpen,
  },
  student: {
    role: 'student',
    title: 'Enrolled Student',
    subtitle: 'Mock Tests & Video Lectures',
    badge: 'Scholar Pass',
    icon: GraduationCap,
  },
  parent: {
    role: 'parent',
    title: 'Parent / Guardian',
    subtitle: 'Fee Receipts & SMS Reports',
    badge: 'Guardian Desk',
    icon: Users,
  },
};

export interface RoleCardProps {
  role: UserRoleType;
  isSelected: boolean;
  onSelect: (role: UserRoleType) => void;
  className?: string;
}

export const RoleCard: React.FC<RoleCardProps> = ({
  role,
  isSelected,
  onSelect,
  className = '',
}) => {
  const config = ROLE_CONFIGS[role];
  const IconComponent = config.icon;

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={config.title}
      onPress={() => onSelect(role)}
      className={`p-3.5 rounded-2xl flex-col justify-between border ${
        isSelected
          ? 'bg-surface-container-lowest border-secondary shadow-sm'
          : 'bg-surface-container-low border-transparent opacity-85 active:opacity-100'
      } ${className}`}
    >
      <View className="flex-row items-center justify-between w-full mb-2">
        <View
          className={`w-9 h-9 rounded-xl items-center justify-center ${
            isSelected ? 'bg-secondary/10' : 'bg-surface-container'
          }`}
        >
          <IconComponent
            size={18}
            color={isSelected ? '#0051d5' : '#45464d'}
          />
        </View>

        <View
          className={`w-5 h-5 rounded-full items-center justify-center ${
            isSelected
              ? 'bg-secondary'
              : 'bg-surface-container border border-outline-variant/30'
          }`}
        >
          {isSelected && <Check size={12} color="#ffffff" strokeWidth={3} />}
        </View>
      </View>

      <View className="gap-0.5">
        <Text
          className={`text-sm font-semibold ${
            isSelected ? 'text-on-surface' : 'text-on-surface-variant'
          }`}
          numberOfLines={1}
        >
          {config.title}
        </Text>
        <Text
          className="text-xs text-on-surface-variant leading-tight"
          numberOfLines={1}
        >
          {config.subtitle}
        </Text>
      </View>
    </Pressable>
  );
};
