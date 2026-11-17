import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { GraduationCap, ClipboardCheck, Users, Building2 } from 'lucide-react-native';
import { type UserRole } from '@/types/database';

interface RoleSelectorProps {
  selectedRole: UserRole;
  onSelectRole: (role: UserRole) => void;
}

const INK = '#1C1C1E';

// Each role keeps its Soft Desk pastel (pink / sky / peach / mint).
const ROLES: { role: UserRole; label: string; sub: string; bg: string; Icon: typeof GraduationCap }[] = [
  { role: 'student', label: 'Student', sub: 'Classes and practice', bg: 'bg-pastel-pink', Icon: GraduationCap },
  { role: 'teacher', label: 'Teacher', sub: 'Faculty or tutor', bg: 'bg-pastel-sky', Icon: ClipboardCheck },
  { role: 'parent', label: 'Parent', sub: 'Follow your child', bg: 'bg-pastel-peach', Icon: Users },
  { role: 'admin', label: 'Institute', sub: 'Run a centre', bg: 'bg-pastel-mint', Icon: Building2 },
];

/** 2×2 pastel role tiles; the chosen tile lifts with an ink outline. */
export const RoleSelector: React.FC<RoleSelectorProps> = ({ selectedRole, onSelectRole }) => (
  <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-3">
    {ROLES.map(({ role, label, sub, bg, Icon }) => {
      const isSelected = selectedRole === role;
      return (
        <Pressable
          key={role}
          accessibilityRole="radio"
          accessibilityState={{ checked: isSelected }}
          accessibilityLabel={`${label}. ${sub}`}
          onPress={() => onSelectRole(role)}
          style={isSelected ? { shadowColor: INK, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 } : undefined}
          className={`basis-[47%] grow h-[120px] rounded-[26px] p-3.5 justify-between ${bg} ${
            isSelected ? 'border-[1.5px] border-ink' : 'border-[1.5px] border-transparent'
          }`}
        >
          <View className="w-10 h-10 rounded-full bg-white items-center justify-center">
            <Icon size={20} color={INK} />
          </View>
          <View>
            <Text className="font-display text-ink text-[17px]">{label}</Text>
            <Text className="font-sans text-slate-700 text-xs" numberOfLines={1}>
              {sub}
            </Text>
          </View>
        </Pressable>
      );
    })}
  </View>
);
