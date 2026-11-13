import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { type UserRole } from '@/types/database';

interface RoleOnboardingFieldsProps {
  role: UserRole;
  teacherOption: 'solo' | 'coaching_faculty';
  setTeacherOption: (opt: 'solo' | 'coaching_faculty') => void;
  facultyCoachingCode: string;
  setFacultyCoachingCode: (code: string) => void;
  teacherQualification: string;
  setTeacherQualification: (q: string) => void;
  teacherSubjects: string;
  setTeacherSubjects: (s: string) => void;
  teacherExperience: string;
  setTeacherExperience: (e: string) => void;
  teacherFeeRate: string;
  setTeacherFeeRate: (f: string) => void;
  instituteName: string;
  setInstituteName: (n: string) => void;
  instituteCity: string;
  setInstituteCity: (c: string) => void;
  instituteSubjects: string;
  setInstituteSubjects: (s: string) => void;
  directorPhone: string;
  setDirectorPhone: (p: string) => void;
  parentWardCode: string;
  setParentWardCode: (c: string) => void;
}

export const RoleOnboardingFields: React.FC<RoleOnboardingFieldsProps> = ({
  role,
  teacherOption,
  setTeacherOption,
  facultyCoachingCode,
  setFacultyCoachingCode,
  teacherQualification,
  setTeacherQualification,
  teacherSubjects,
  setTeacherSubjects,
  teacherExperience,
  setTeacherExperience,
  teacherFeeRate,
  setTeacherFeeRate,
  instituteName,
  setInstituteName,
  instituteCity,
  setInstituteCity,
  instituteSubjects,
  setInstituteSubjects,
  directorPhone,
  setDirectorPhone,
  parentWardCode,
  setParentWardCode,
}) => {
  if (role === 'teacher') {
    return (
      <View className="gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
        <Text className="text-[11px] font-bold text-slate-700 uppercase">
          Teacher Profile Setup
        </Text>

        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => setTeacherOption('solo')}
            className={`flex-1 p-2 rounded-xl border items-center ${
              teacherOption === 'solo'
                ? 'bg-blue-600 border-blue-600'
                : 'bg-white border-slate-200'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                teacherOption === 'solo' ? 'text-white' : 'text-slate-700'
              }`}
            >
              Independent Tutor
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTeacherOption('coaching_faculty')}
            className={`flex-1 p-2 rounded-xl border items-center ${
              teacherOption === 'coaching_faculty'
                ? 'bg-blue-600 border-blue-600'
                : 'bg-white border-slate-200'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                teacherOption === 'coaching_faculty' ? 'text-white' : 'text-slate-700'
              }`}
            >
              Faculty at Center
            </Text>
          </TouchableOpacity>
        </View>

        {teacherOption === 'coaching_faculty' && (
          <View>
            <Text className="text-[10px] text-slate-500 font-bold mb-1">Center Invite Code</Text>
            <TextInput
              value={facultyCoachingCode}
              onChangeText={setFacultyCoachingCode}
              placeholder="e.g. BLOOM2026"
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
            />
          </View>
        )}

        <View>
          <Text className="text-[10px] text-slate-500 font-bold mb-1">Qualification</Text>
          <TextInput
            value={teacherQualification}
            onChangeText={setTeacherQualification}
            placeholder="e.g. M.Sc Physics (IIT Bombay)"
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
          />
        </View>

        <View className="flex-row gap-2">
          <View className="flex-1">
            <Text className="text-[10px] text-slate-500 font-bold mb-1">Specialization Subjects</Text>
            <TextInput
              value={teacherSubjects}
              onChangeText={setTeacherSubjects}
              placeholder="Physics, Calculus"
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
            />
          </View>
          <View className="w-20">
            <Text className="text-[10px] text-slate-500 font-bold mb-1">Exp (Yrs)</Text>
            <TextInput
              value={teacherExperience}
              onChangeText={setTeacherExperience}
              keyboardType="numeric"
              placeholder="10"
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-center"
            />
          </View>
        </View>
      </View>
    );
  }

  if (role === 'admin') {
    return (
      <View className="gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
        <Text className="text-[11px] font-bold text-slate-700 uppercase">
          Coaching Institute Registration
        </Text>

        <View>
          <Text className="text-[10px] text-slate-500 font-bold mb-1">Institute / Academy Name</Text>
          <TextInput
            value={instituteName}
            onChangeText={setInstituteName}
            placeholder="Bloom Science Academy"
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
          />
        </View>

        <View className="flex-row gap-2">
          <View className="flex-1">
            <Text className="text-[10px] text-slate-500 font-bold mb-1">City</Text>
            <TextInput
              value={instituteCity}
              onChangeText={setInstituteCity}
              placeholder="Pune / Delhi"
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
            />
          </View>
          <View className="flex-1">
            <Text className="text-[10px] text-slate-500 font-bold mb-1">Director Contact Phone</Text>
            <TextInput
              value={directorPhone}
              onChangeText={setDirectorPhone}
              placeholder="+91 98230 11223"
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
            />
          </View>
        </View>
      </View>
    );
  }

  if (role === 'parent') {
    return (
      <View className="gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
        <Text className="text-[11px] font-bold text-slate-700 uppercase">
          Link Student Account
        </Text>
        <Text className="text-[11px] text-slate-500">
          Enter the Student Parent Link Code provided by your ward or their tuition teacher.
        </Text>
        <TextInput
          value={parentWardCode}
          onChangeText={setParentWardCode}
          placeholder="e.g. STU-12-AMELIA"
          autoCapitalize="characters"
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
        />
      </View>
    );
  }

  return null;
};
