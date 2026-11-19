import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { JoinRequestRow } from '@/services/admissionService';

interface VerifyRequestItemProps {
  request: JoinRequestRow;
  /** Pastel for the card; the first request in the queue gets the outlined hero look. */
  tone?: 'pink' | 'sky' | 'mint' | 'lilac';
  hero?: boolean;
  onApprove: (req: JoinRequestRow) => void;
  onWaitlist: (req: JoinRequestRow) => void;
  onReject: (req: JoinRequestRow) => void;
}

const TONES = { pink: 'bg-pastel-pink', sky: 'bg-pastel-sky', mint: 'bg-pastel-mint', lilac: 'bg-pastel-lilac' } as const;

/** Soft Desk join-request card: who, what they told us, and approve / waitlist / reject. */
export const VerifyRequestItem: React.FC<VerifyRequestItemProps> = ({ request, tone = 'pink', hero = false, onApprove, onWaitlist, onReject }) => {
  const d = request.student_details || {};
  const name = d.fullName || request.user?.full_name || 'Applicant';
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p: string) => p[0]?.toUpperCase())
    .join('');
  const applied = request.applied_at ? new Date(request.applied_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';

  // Only what the applicant actually entered — no invented class, board or exam.
  const answers = [
    ['Class', d.grade],
    ['Board', d.board],
    ['Target exam', d.targetExam],
    ['School', d.school],
    ['Last score', d.previousPercentage],
    ['Parent phone', d.guardianPhone],
  ].filter(([, v]) => Boolean(v)) as [string, string][];

  return (
    <View className={`rounded-[30px] p-[18px] gap-3 ${hero ? `${TONES[tone]} border-[1.5px] border-ink` : 'bg-white'}`}>
      <View className="flex-row items-center gap-3">
        <View className="w-14 h-14 rounded-full bg-white items-center justify-center">
          <Text className="font-display text-ink text-lg">{initials}</Text>
        </View>
        <View className="flex-1 min-w-0">
          <Text className="font-display text-ink text-[22px]" numberOfLines={1}>
            {name}
          </Text>
          <Text className="font-sans text-slate-700 text-[13px]" numberOfLines={1}>
            {['Student', request.user?.email, applied ? `applied ${applied}` : null].filter(Boolean).join(' · ')}
          </Text>
        </View>
      </View>

      {answers.length > 0 && (
        <View className={`rounded-[20px] px-3.5 py-1 ${hero ? 'bg-white/70' : 'bg-paper'}`}>
          {answers.map(([q, v], i) => (
            <View key={q} className={`flex-row justify-between gap-3 min-h-[42px] items-center ${i === answers.length - 1 ? '' : 'border-b border-black/5'}`}>
              <Text className="font-sans text-slate-600 text-[13px]">{q}</Text>
              <Text className="font-sans-bold text-ink text-sm text-right flex-shrink" numberOfLines={1}>
                {v}
              </Text>
            </View>
          ))}
        </View>
      )}

      {d.weakSubjects && d.weakSubjects.length > 0 ? (
        <View className="flex-row flex-wrap gap-1.5">
          {d.weakSubjects.map((sub: string) => (
            <View key={sub} className="bg-white px-2.5 py-1 rounded-xl">
              <Text className="font-sans-bold text-ink text-xs">Needs help: {sub}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View className="flex-row items-center gap-2.5 mt-1">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Reject ${name}`}
          onPress={() => onReject(request)}
          className="w-14 h-14 rounded-full bg-white items-center justify-center"
        >
          <X size={22} color="#B42318" />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => onApprove(request)}
          className="flex-1 h-14 rounded-full bg-ink flex-row items-center justify-center gap-2 active:opacity-90"
        >
          <Check size={18} color="#FFFFFF" />
          <Text className="font-sans-bold text-white text-[17px]">Approve</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity accessibilityRole="button" onPress={() => onWaitlist(request)} className="self-center min-h-[40px] justify-center">
        <Text className="font-sans-bold text-ink text-sm underline">Move to waitlist</Text>
      </TouchableOpacity>
    </View>
  );
};
