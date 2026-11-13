import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { QrCode, GraduationCap, Phone, CheckCircle2 } from 'lucide-react-native';

const WEAK_SUBJECT_OPTIONS = [
  'Rotational Mechanics',
  'Calculus & Limits',
  'Ionic Equilibrium',
  'Organic Chemistry',
  'Electromagnetism',
  'Genetics & Biotech',
  'Coordinate Geometry',
  'Wave Optics',
];

const GRADE_OPTIONS = [
  'Class 10 (Board)',
  'Class 11 Science',
  'Class 12 Science',
  'Dropper / Repeater',
];

const BOARD_OPTIONS = ['CBSE', 'ICSE', 'State Board', 'IB / Cambridge'];

interface JoinFormFieldsProps {
  teacherCode: string;
  setTeacherCode: (val: string) => void;
  matchedTarget: { name: string; type: string; detail: string; rate: string } | null;
  fullName: string;
  setFullName: (val: string) => void;
  grade: string;
  setGrade: (val: string) => void;
  board: string;
  setBoard: (val: string) => void;
  targetExam: string;
  setTargetExam: (val: string) => void;
  previousScore: string;
  setPreviousScore: (val: string) => void;
  school: string;
  setSchool: (val: string) => void;
  selectedWeakSubjects: string[];
  toggleWeakSubject: (sub: string) => void;
  guardianName: string;
  setGuardianName: (val: string) => void;
  guardianPhone: string;
  setGuardianPhone: (val: string) => void;
  bloodGroup: string;
  setBloodGroup: (val: string) => void;
}

export const JoinFormFields: React.FC<JoinFormFieldsProps> = ({
  teacherCode,
  setTeacherCode,
  matchedTarget,
  fullName,
  setFullName,
  grade,
  setGrade,
  board,
  setBoard,
  targetExam,
  setTargetExam,
  previousScore,
  setPreviousScore,
  school,
  setSchool,
  selectedWeakSubjects,
  toggleWeakSubject,
  guardianName,
  setGuardianName,
  guardianPhone,
  setGuardianPhone,
  bloodGroup,
  setBloodGroup,
}) => {
  return (
    <View className="gap-4">
      {/* 1. Teacher Code & Live Preview */}
      <View className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
        <View className="flex-row items-center gap-2.5 mb-2">
          <View className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 items-center justify-center">
            <QrCode size={18} color="#2563EB" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-black text-slate-800">Enter Teacher / Coaching Code</Text>
            <Text className="text-xs text-slate-500">Share code provided by your teacher</Text>
          </View>
        </View>

        <TextInput
          placeholder="e.g. MATH-89 or APEX2026"
          placeholderTextColor="#94A3B8"
          autoCapitalize="characters"
          value={teacherCode}
          onChangeText={setTeacherCode}
          className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-black text-slate-800 tracking-wider mt-2 uppercase"
        />

        {matchedTarget && (
          <View className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 mt-3">
            <View className="flex-row items-center justify-between mb-1">
              <View className="flex-row items-center gap-1.5">
                <CheckCircle2 size={14} color="#2563EB" />
                <Text className="text-xs font-black text-slate-800">{matchedTarget.name}</Text>
              </View>
              <View className="bg-white/90 px-2 py-0.5 rounded-md border border-blue-200/30">
                <Text className="text-[10px] font-bold text-blue-600">{matchedTarget.type}</Text>
              </View>
            </View>
            <Text className="text-[11px] text-slate-800/80 leading-snug">{matchedTarget.detail}</Text>
            <Text className="text-[10px] font-bold text-blue-600 mt-1">Fee: {matchedTarget.rate}</Text>
          </View>
        )}
      </View>

      {/* 2. Academic Profile */}
      <View className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs gap-3">
        <View className="flex-row items-center gap-2 mb-1">
          <GraduationCap size={16} color="#2563EB" />
          <Text className="text-sm font-black text-slate-800">Student Academic Profile</Text>
        </View>

        <View>
          <Text className="text-xs font-bold text-slate-800 mb-1">Student Full Name</Text>
          <TextInput
            placeholder="e.g. Amelia Sharma"
            placeholderTextColor="#94A3B8"
            value={fullName}
            onChangeText={setFullName}
            className="bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs text-slate-800"
          />
        </View>

        <View>
          <Text className="text-xs font-bold text-slate-800 mb-1.5">Class / Grade</Text>
          <View className="flex-row flex-wrap gap-1.5">
            {GRADE_OPTIONS.map((g) => (
              <TouchableOpacity
                key={g}
                onPress={() => setGrade(g)}
                className={`px-3 py-1.5 rounded-xl border ${
                  grade === g ? 'bg-blue-600 border-blue-600' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <Text className={`text-xs font-bold ${grade === g ? 'text-white' : 'text-slate-700'}`}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View>
          <Text className="text-xs font-bold text-slate-800 mb-1.5">Affiliated Board</Text>
          <View className="flex-row flex-wrap gap-1.5">
            {BOARD_OPTIONS.map((b) => (
              <TouchableOpacity
                key={b}
                onPress={() => setBoard(b)}
                className={`px-3 py-1.5 rounded-xl border ${
                  board === b ? 'bg-blue-600 border-blue-600' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <Text className={`text-xs font-bold ${board === b ? 'text-white' : 'text-slate-700'}`}>
                  {b}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="flex-row gap-2">
          <View className="flex-1">
            <Text className="text-xs font-bold text-slate-800 mb-1">Target Exam</Text>
            <TextInput
              placeholder="e.g. IIT-JEE 2026"
              placeholderTextColor="#94A3B8"
              value={targetExam}
              onChangeText={setTargetExam}
              className="bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs text-slate-800"
            />
          </View>
          <View className="w-28">
            <Text className="text-xs font-bold text-slate-800 mb-1">Previous %</Text>
            <TextInput
              placeholder="e.g. 96.2%"
              placeholderTextColor="#94A3B8"
              value={previousScore}
              onChangeText={setPreviousScore}
              className="bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs text-slate-800"
            />
          </View>
        </View>

        <View>
          <Text className="text-xs font-bold text-slate-800 mb-1">School / College Name</Text>
          <TextInput
            placeholder="e.g. Delhi Public School"
            placeholderTextColor="#94A3B8"
            value={school}
            onChangeText={setSchool}
            className="bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs text-slate-800"
          />
        </View>

        {/* Weak Subject Checkboxes */}
        <View>
          <Text className="text-xs font-bold text-slate-800 mb-1.5">Focus Subject Areas</Text>
          <View className="flex-row flex-wrap gap-1.5">
            {WEAK_SUBJECT_OPTIONS.map((sub) => {
              const isSel = selectedWeakSubjects.includes(sub);
              return (
                <TouchableOpacity
                  key={sub}
                  onPress={() => toggleWeakSubject(sub)}
                  className={`px-2.5 py-1.5 rounded-xl border ${
                    isSel ? 'bg-rose-50 border-rose-300' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <Text className={`text-[11px] font-bold ${isSel ? 'text-rose-700' : 'text-slate-600'}`}>
                    {isSel ? '✓ ' : '+ '}
                    {sub}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* 3. Guardian & Emergency Contact */}
      <View className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs gap-3">
        <View className="flex-row items-center gap-2 mb-1">
          <Phone size={16} color="#2563EB" />
          <Text className="text-sm font-black text-slate-800">Guardian Contact & Bio</Text>
        </View>

        <View>
          <Text className="text-xs font-bold text-slate-800 mb-1">Guardian Full Name</Text>
          <TextInput
            placeholder="e.g. Sunita Sharma"
            placeholderTextColor="#94A3B8"
            value={guardianName}
            onChangeText={setGuardianName}
            className="bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs text-slate-800"
          />
        </View>

        <View className="flex-row gap-2">
          <View className="flex-1">
            <Text className="text-xs font-bold text-slate-800 mb-1">Guardian Phone (SMS Alerts)</Text>
            <TextInput
              placeholder="+91 98230 44551"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              value={guardianPhone}
              onChangeText={setGuardianPhone}
              className="bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs text-slate-800"
            />
          </View>
          <View className="w-24">
            <Text className="text-xs font-bold text-slate-800 mb-1">Blood Grp</Text>
            <TextInput
              placeholder="e.g. B+"
              placeholderTextColor="#94A3B8"
              value={bloodGroup}
              onChangeText={setBloodGroup}
              className="bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs text-slate-800"
            />
          </View>
        </View>
      </View>
    </View>
  );
};
