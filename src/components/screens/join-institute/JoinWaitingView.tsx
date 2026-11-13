import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Clock, AlertCircle, CheckCircle2, RotateCcw, ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Mascot } from '@/components/ui';
import { type StudentExtraDetails } from '@/services/admissionService';

interface JoinWaitingViewProps {
  activeJoinRequest: {
    matchedTargetName?: string;
    codeUsed?: string;
    status?: 'pending' | 'approved' | 'rejected' | 'waitlisted';
    rejectionReason?: string;
    waitlistReason?: string;
    studentDetails: StudentExtraDetails;
  } | null;
  onModify: () => void;
}

export const JoinWaitingView: React.FC<JoinWaitingViewProps> = ({
  activeJoinRequest,
  onModify,
}) => {
  const router = useRouter();
  const status = activeJoinRequest?.status || 'pending';

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-12">
      <View className="bg-white border border-slate-200 rounded-[32px] p-6 items-center shadow-xs">
        <Mascot mood={status === 'rejected' ? 'curious' : status === 'approved' ? 'celebrating' : 'studying'} size="lg" />

        {/* Dynamic Status Badge */}
        {status === 'pending' && (
          <View className="bg-amber-50 border border-amber-200 px-3 py-1 rounded-full mt-3 flex-row items-center gap-1.5">
            <Clock size={12} color="#D97706" />
            <Text className="text-[11px] font-extrabold text-amber-800">Verification Pending</Text>
          </View>
        )}

        {status === 'waitlisted' && (
          <View className="bg-purple-50 border border-purple-200 px-3 py-1 rounded-full mt-3 flex-row items-center gap-1.5">
            <Clock size={12} color="#7C3AED" />
            <Text className="text-[11px] font-extrabold text-purple-800">Admissions Waitlist</Text>
          </View>
        )}

        {status === 'rejected' && (
          <View className="bg-rose-50 border border-rose-200 px-3 py-1 rounded-full mt-3 flex-row items-center gap-1.5">
            <AlertCircle size={12} color="#E11D48" />
            <Text className="text-[11px] font-extrabold text-rose-800">Application Not Accepted</Text>
          </View>
        )}

        {status === 'approved' && (
          <View className="bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full mt-3 flex-row items-center gap-1.5">
            <CheckCircle2 size={12} color="#059669" />
            <Text className="text-[11px] font-extrabold text-emerald-800">Approved & Enrolled</Text>
          </View>
        )}

        <Text className="text-xl font-black text-slate-800 mt-3 text-center">
          {status === 'approved'
            ? 'Welcome to Your Classroom!'
            : status === 'waitlisted'
            ? 'Placed on Intake Waitlist'
            : status === 'rejected'
            ? 'Admission Feedback'
            : 'Request Sent to Teacher'}
        </Text>

        <Text className="text-xs text-slate-500 text-center mt-1 max-w-[280px] leading-relaxed">
          {status === 'approved'
            ? 'Your application has been verified and enrolled. You now have full access to study materials, lectures, and live batches.'
            : status === 'waitlisted'
            ? activeJoinRequest?.waitlistReason || 'You are on the priority waitlist for the upcoming batch intake.'
            : status === 'rejected'
            ? activeJoinRequest?.rejectionReason || 'Your application was not approved for this batch intake.'
            : 'Your application has been received. Your teacher will review your background and assign your batch shortly.'}
        </Text>

        {/* Reason / Notice Card for Waitlist / Rejected */}
        {(status === 'rejected' || status === 'waitlisted') && (
          <View
            className={`w-full rounded-2xl p-3.5 my-3 border ${
              status === 'rejected'
                ? 'bg-rose-50/80 border-rose-200'
                : 'bg-purple-50/80 border-purple-200'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                status === 'rejected' ? 'text-rose-900' : 'text-purple-900'
              }`}
            >
              Faculty Note:
            </Text>
            <Text
              className={`text-xs mt-0.5 leading-relaxed ${
                status === 'rejected' ? 'text-rose-700' : 'text-purple-700'
              }`}
            >
              {status === 'rejected'
                ? activeJoinRequest?.rejectionReason || 'Seat capacity reached for current intake.'
                : activeJoinRequest?.waitlistReason || 'Waitlisted for upcoming batch intake.'}
            </Text>
          </View>
        )}

        {/* Target Card */}
        <View className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 my-3">
          <View className="flex-row items-center justify-between pb-2 mb-2 border-b border-slate-200">
            <Text className="text-xs font-black text-slate-800">
              {activeJoinRequest?.matchedTargetName || 'Faculty Mentor'}
            </Text>
            <View className="bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
              <Text className="text-[10px] font-bold text-blue-600">
                Code: {activeJoinRequest?.codeUsed || 'JOIN'}
              </Text>
            </View>
          </View>

          <View className="gap-1">
            <View className="flex-row justify-between">
              <Text className="text-xs text-slate-500">Target Exam:</Text>
              <Text className="text-xs font-bold text-slate-800">
                {activeJoinRequest?.studentDetails.targetExam || 'Competitive Exam'}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-slate-500">School & Board:</Text>
              <Text className="text-xs font-bold text-slate-800">
                {activeJoinRequest?.studentDetails.board || 'CBSE'} •{' '}
                {activeJoinRequest?.studentDetails.grade || 'Class 12'}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-slate-500">Guardian Phone:</Text>
              <Text className="text-xs font-bold text-slate-800">
                {activeJoinRequest?.studentDetails.guardianPhone || 'N/A'}
              </Text>
            </View>
          </View>

          {/* Weak Subject Tags */}
          {activeJoinRequest?.studentDetails.weakSubjects &&
            activeJoinRequest.studentDetails.weakSubjects.length > 0 && (
              <View className="mt-2.5 pt-2.5 border-t border-slate-200">
                <Text className="text-[10px] font-bold text-slate-500 mb-1.5">
                  Focus / Weak Areas:
                </Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {activeJoinRequest.studentDetails.weakSubjects.map((ws, idx) => (
                    <View
                      key={idx}
                      className="bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md"
                    >
                      <Text className="text-[10px] font-bold text-rose-800">{ws}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
        </View>

        {/* Action Buttons */}
        {status === 'approved' ? (
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.replace('/student')}
            className="w-full bg-blue-600 py-3 rounded-2xl items-center shadow-xs flex-row justify-center gap-1.5 active:scale-98"
          >
            <Text className="text-xs font-bold text-white">Go to Student Dashboard</Text>
            <ArrowRight size={14} color="#ffffff" />
          </TouchableOpacity>
        ) : status === 'rejected' || status === 'waitlisted' ? (
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={onModify}
            className="w-full bg-blue-600 py-3 rounded-2xl items-center shadow-xs flex-row justify-center gap-1.5 active:scale-98"
          >
            <RotateCcw size={14} color="#ffffff" />
            <Text className="text-xs font-bold text-white">Edit Details & Re-apply</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.replace('/student')}
            className="w-full bg-slate-900 py-3 rounded-2xl items-center shadow-xs active:scale-98"
          >
            <Text className="text-xs font-bold text-white">Return to Student Home</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};
