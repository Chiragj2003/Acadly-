import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { ArrowRight, RotateCcw } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ScreenWrapper } from '@/components/ui';
import { useUI } from '@/context/UIContext';
import {
  useSubmitJoinRequest,
  useUserJoinRequest,
  useReapplyJoinRequest,
} from '@/hooks/queries/useAdmissionQueries';
import { type StudentExtraDetails } from '@/services/admissionService';
import { useAuth } from '@/context/AuthContext';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { JoinWaitingView } from '@/components/screens/join-institute/JoinWaitingView';
import { JoinFormFields } from '@/components/screens/join-institute/JoinFormFields';

export default function JoinInstituteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string; inviteCode?: string }>();
  const { isAuthorized, isLoading } = useRoleGuard(['student']);
  const { user, activeInstitute } = useAuth();
  const { teacherProfile, coachingProfile } = useUI();

  const submitJoinRequestMutation = useSubmitJoinRequest();
  const reapplyMutation = useReapplyJoinRequest();
  const { data: existingRequest, isLoading: isExistingLoading } = useUserJoinRequest(user?.id);

  const [activeJoinRequest, setActiveJoinRequest] = useState<{
    requestId?: string;
    matchedTargetName?: string;
    codeUsed?: string;
    status?: 'pending' | 'approved' | 'rejected' | 'waitlisted';
    rejectionReason?: string;
    waitlistReason?: string;
    studentDetails: StudentExtraDetails;
  } | null>(null);

  const [step, setStep] = useState<'form' | 'waiting'>('form');

  // Form State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [grade, setGrade] = useState('');
  const [board, setBoard] = useState('');
  const [targetExam, setTargetExam] = useState('');
  const [school, setSchool] = useState('');
  const [previousScore, setPreviousScore] = useState('');
  const [selectedWeakSubjects, setSelectedWeakSubjects] = useState<string[]>([]);
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [teacherCode, setTeacherCode] = useState('');

  // Pre-fill teacherCode from deep link param if available
  useEffect(() => {
    const incomingCode = params.code || params.inviteCode;
    if (incomingCode && typeof incomingCode === 'string') {
      setTeacherCode(incomingCode.trim().toUpperCase());
    }
  }, [params.code, params.inviteCode]);

  // Sync existing join request from database
  useEffect(() => {
    if (existingRequest) {
      const details = existingRequest.student_details || ({} as StudentExtraDetails);
      setActiveJoinRequest({
        requestId: existingRequest.id,
        matchedTargetName: `Institute (${existingRequest.teacher_code || 'Tuition'})`,
        codeUsed: existingRequest.teacher_code || 'JOIN',
        status: existingRequest.status,
        rejectionReason: existingRequest.rejection_reason,
        waitlistReason: existingRequest.waitlist_reason,
        studentDetails: details,
      });

      // Pre-fill form fields with student's previous answers
      if (details.fullName) setFullName(details.fullName);
      if (details.grade) setGrade(details.grade);
      if (details.board) setBoard(details.board);
      if (details.targetExam) setTargetExam(details.targetExam);
      if (details.school) setSchool(details.school);
      if (details.previousPercentage) setPreviousScore(details.previousPercentage);
      if (details.weakSubjects) setSelectedWeakSubjects(details.weakSubjects);
      if (details.guardianName) setGuardianName(details.guardianName);
      if (details.guardianPhone) setGuardianPhone(details.guardianPhone);
      if (details.bloodGroup) setBloodGroup(details.bloodGroup);
      if (existingRequest.teacher_code) setTeacherCode(existingRequest.teacher_code);

      // Default to waiting view if application is pending, waitlisted, or rejected
      setStep('waiting');
    }
  }, [existingRequest]);

  const toggleWeakSubject = (sub: string) => {
    setSelectedWeakSubjects((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  const cleanCode = teacherCode.trim().toUpperCase();

  // Look the code up on the server (rate-limited RPC that returns only id + name).
  // Previously any 4+ character code showed a fake "Verified Provider" card, and the
  // sample teacher / coaching profiles from UIContext were matched instead.
  const { data: codeMatch } = useQuery({
    queryKey: ['lookup_institute_by_code', cleanCode],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('lookup_institute_by_code', { p_code: cleanCode });
      if (error) return null;
      const inst = data as { id?: string; name?: string } | null;
      return inst?.id ? { id: inst.id, name: inst.name ?? '' } : null;
    },
    enabled: cleanCode.length >= 6,
    retry: false,
    staleTime: 60_000,
  });
  const matchedTarget: { name: string; type: string; detail: string; rate: string } | null = codeMatch
    ? { name: codeMatch.name, type: 'Institute', detail: '', rate: '' }
    : null;

  if (isLoading || isExistingLoading || !isAuthorized) {
    return (
      <ScreenWrapper headerProps={{ title: 'Join Classes', onBackPress: () => router.back() }}>
        <View className="flex-1 items-center justify-center p-8">
          <ActivityIndicator size="small" color="#1C1C1E" />
          <Text className="text-xs text-slate-500 mt-2 font-sans">Verifying admission status...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const handleSubmit = async () => {
    if (!teacherCode.trim()) {
      Alert.alert('Validation Error', 'Please enter your Teacher Code or Coaching Code.');
      return;
    }
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Please enter your full name.');
      return;
    }

    const details: StudentExtraDetails = {
      fullName,
      grade,
      board,
      targetExam,
      school,
      previousPercentage: previousScore,
      weakSubjects: selectedWeakSubjects,
      guardianName,
      guardianPhone,
      bloodGroup,
    };

    try {
      // If student was rejected or waitlisted and is re-applying for existing request
      if (
        activeJoinRequest?.requestId &&
        (activeJoinRequest.status === 'rejected' || activeJoinRequest.status === 'waitlisted')
      ) {
        await reapplyMutation.mutateAsync({
          requestId: activeJoinRequest.requestId,
          studentDetails: details,
        });

        setActiveJoinRequest((prev) =>
          prev
            ? {
                ...prev,
                status: 'pending',
                rejectionReason: undefined,
                waitlistReason: undefined,
                studentDetails: details,
              }
            : null
        );
        setStep('waiting');
        Alert.alert(
          'Application Resubmitted 📝',
          'Your updated details have been submitted to the faculty admissions desk.'
        );
        return;
      }

      // Initial join request submission
      const res = await submitJoinRequestMutation.mutateAsync({
        instituteId: activeInstitute?.id || '',
        userId: user?.id || '',
        teacherCode: teacherCode.trim().toUpperCase(),
        targetType: matchedTarget?.type,
        studentDetails: details,
      });

      if (res.success) {
        setActiveJoinRequest({
          requestId: res.requestId,
          matchedTargetName: matchedTarget?.name || 'Faculty Mentor',
          codeUsed: teacherCode.trim().toUpperCase(),
          status: 'pending',
          studentDetails: details,
        });
        setStep('waiting');
        Alert.alert(
          'Request Submitted',
          `Sent to ${matchedTarget?.name || 'Faculty Mentor'} for verification.`
        );
      } else {
        Alert.alert('Error', res.error || 'Could not submit join request.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not send request.';
      Alert.alert('Submission Failed', msg);
    }
  };

  return (
    <ScreenWrapper
      scrollable={false}
      headerProps={{
        title: 'Join with a code',
        onBackPress: () => router.back(),
      }}
    >
      {step === 'waiting' ? (
        <JoinWaitingView
          activeJoinRequest={activeJoinRequest}
          onModify={() => setStep('form')}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="gap-4 pb-16"
          contentContainerStyle={{ paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
          <JoinFormFields
            teacherCode={teacherCode}
            setTeacherCode={setTeacherCode}
            matchedTarget={matchedTarget}
            fullName={fullName}
            setFullName={setFullName}
            grade={grade}
            setGrade={setGrade}
            board={board}
            setBoard={setBoard}
            targetExam={targetExam}
            setTargetExam={setTargetExam}
            previousScore={previousScore}
            setPreviousScore={setPreviousScore}
            school={school}
            setSchool={setSchool}
            selectedWeakSubjects={selectedWeakSubjects}
            toggleWeakSubject={toggleWeakSubject}
            guardianName={guardianName}
            setGuardianName={setGuardianName}
            guardianPhone={guardianPhone}
            setGuardianPhone={setGuardianPhone}
            bloodGroup={bloodGroup}
            setBloodGroup={setBloodGroup}
          />

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleSubmit}
            disabled={submitJoinRequestMutation.isPending || reapplyMutation.isPending}
            accessibilityRole="button"
            className={`w-full bg-ink min-h-[56px] rounded-full items-center flex-row justify-center gap-2 active:opacity-90 ${
              submitJoinRequestMutation.isPending || reapplyMutation.isPending ? 'opacity-60' : ''
            }`}
          >
            {submitJoinRequestMutation.isPending || reapplyMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text className="text-[17px] font-sans-bold text-white">
                  {activeJoinRequest?.status === 'rejected' || activeJoinRequest?.status === 'waitlisted'
                    ? 'Send again with updated details'
                    : 'Send join request'}
                </Text>
                {activeJoinRequest?.status === 'rejected' || activeJoinRequest?.status === 'waitlisted' ? (
                  <RotateCcw size={14} color="#ffffff" />
                ) : (
                  <ArrowRight size={14} color="#ffffff" />
                )}
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </ScreenWrapper>
  );
}
