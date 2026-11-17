import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Check, X, Clock } from 'lucide-react-native';
import { JoinRequestRow } from '@/services/admissionService';

interface VerifyRequestItemProps {
  request: JoinRequestRow;
  onApprove: (req: JoinRequestRow) => void;
  onWaitlist: (req: JoinRequestRow) => void;
  onReject: (req: JoinRequestRow) => void;
}

export const VerifyRequestItem: React.FC<VerifyRequestItemProps> = ({
  request,
  onApprove,
  onWaitlist,
  onReject,
}) => {
  const d = request.student_details || {};

  return (
    <View className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs gap-3">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-base font-display text-slate-800">
            {d.fullName || request.user?.full_name || 'Student Applicant'}
          </Text>
          <Text className="text-xs text-slate-500">
            {d.grade || 'Class 12'} • {d.board || 'CBSE'}
          </Text>
        </View>
        <View className="bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
          <Text className="text-[10px] font-sans-bold text-amber-800">
            Target: {d.targetExam || 'Competitive Exam'}
          </Text>
        </View>
      </View>

      <View className="bg-slate-50 rounded-2xl p-3 border border-slate-200 gap-1.5">
        <View className="flex-row items-center justify-between">
          <Text className="text-[11px] text-slate-500">School / College:</Text>
          <Text className="text-[11px] font-sans-bold text-slate-800">{d.school || 'Not Specified'}</Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-[11px] text-slate-500">Prior Percentage:</Text>
          <Text className="text-[11px] font-sans-bold text-blue-600">{d.previousPercentage || 'N/A'}</Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-[11px] text-slate-500">Guardian Phone:</Text>
          <Text className="text-[11px] font-sans-bold text-slate-800">{d.guardianPhone || 'N/A'}</Text>
        </View>
      </View>

      {d.weakSubjects && d.weakSubjects.length > 0 && (
        <View>
          <Text className="text-[10px] font-display text-slate-500 uppercase tracking-wider mb-1.5">
            Requested Focus Areas:
          </Text>
          <View className="flex-row flex-wrap gap-1.5">
            {d.weakSubjects.map((sub: string, i: number) => (
              <View key={i} className="bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                <Text className="text-[10px] font-sans-bold text-rose-800">{sub}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className="flex-row gap-2 pt-2 border-t border-slate-200">
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => onApprove(request)}
          className="flex-1 bg-emerald-500 py-2.5 rounded-xl flex-row items-center justify-center gap-1.5 shadow-xs active:scale-98"
        >
          <Check size={14} color="#ffffff" />
          <Text className="text-xs font-display text-white">Admit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => onWaitlist(request)}
          className="px-3.5 py-2.5 rounded-xl bg-purple-50 border border-purple-200 items-center justify-center flex-row gap-1 active:scale-98"
        >
          <Clock size={13} color="#7C3AED" />
          <Text className="text-[11px] font-sans-bold text-purple-700">Waitlist</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => onReject(request)}
          className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 items-center justify-center active:scale-98"
        >
          <X size={14} color="#6E6A63" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
