import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { GraduationCap, BookOpen, Users, Shield } from 'lucide-react-native';
import { type UserRole } from '@/types/database';

interface RoleSelectorProps {
  selectedRole: UserRole;
  onSelectRole: (role: UserRole) => void;
}

const ROLES: {
  role: UserRole;
  label: string;
  sub: string;
  icon: React.ReactNode;
}[] = [
  {
    role: 'student',
    label: 'Student',
    sub: 'Classes & DPPs',
    icon: <GraduationCap size={16} color="#2563eb" />,
  },
  {
    role: 'teacher',
    label: 'Teacher',
    sub: 'Roll call & DPPs',
    icon: <BookOpen size={16} color="#059669" />,
  },
  {
    role: 'parent',
    label: 'Parent',
    sub: 'Track child fees',
    icon: <Users size={16} color="#d97706" />,
  },
  {
    role: 'admin',
    label: 'Admin',
    sub: 'Coaching center',
    icon: <Shield size={16} color="#7c3aed" />,
  },
];

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  selectedRole,
  onSelectRole,
}) => {
  return (
    <View className="flex-row gap-2">
      {ROLES.map((r) => {
        const isSelected = selectedRole === r.role;
        return (
          <TouchableOpacity
            key={r.role}
            onPress={() => onSelectRole(r.role)}
            className={`flex-1 p-2.5 rounded-2xl items-center border-2 ${
              isSelected
                ? 'bg-blue-50/80 border-blue-600 shadow-xs'
                : 'bg-white border-slate-200/80'
            }`}
          >
            <View className="mb-1">{r.icon}</View>
            <Text
              className={`text-xs font-bold ${
                isSelected ? 'text-blue-900' : 'text-slate-700'
              }`}
            >
              {r.label}
            </Text>
            <Text className="text-[9px] text-slate-400 mt-0.5 text-center" numberOfLines={1}>
              {r.sub}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
