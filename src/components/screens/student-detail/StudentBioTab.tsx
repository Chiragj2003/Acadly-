import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { DollarSign, MessageSquare, Plus } from 'lucide-react-native';
import { Student360Profile } from '@/types/database';

interface StudentBioTabProps {
  student: Student360Profile;
}

export const StudentBioTab: React.FC<StudentBioTabProps> = ({ student }) => {
  const [remarks, setRemarks] = useState<string[]>(student.teacherRemarks || []);
  const [newRemarkText, setNewRemarkText] = useState('');
  const [feeStatus, setFeeStatus] = useState<string>(student.feeStatus || 'Paid Full');

  const handleCycleFeeStatus = () => {
    const statuses = [
      'Paid in Full (₹42,000)',
      'Partially Paid (₹15,000 remaining)',
      'Pending Installment (Due in 5 days)',
    ];
    const currentIndex = statuses.indexOf(feeStatus);
    const nextIndex = (currentIndex + 1) % statuses.length;
    setFeeStatus(statuses[nextIndex]);
  };

  const handleAddRemark = () => {
    if (!newRemarkText.trim()) return;
    setRemarks((prev) => [...prev, newRemarkText.trim()]);
    setNewRemarkText('');
    Alert.alert('Observation Saved 📝', 'Teacher remark recorded in student 360 diagnostic profile.');
  };

  return (
    <View className="gap-3.5">
      {/* Student Background Details */}
      <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3">
        <Text className="text-sm font-sans-bold text-slate-900">Student Profile & Identity</Text>

        <View className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 gap-2">
          <View className="flex-row justify-between">
            <Text className="text-xs text-slate-500">Board & School:</Text>
            <Text className="text-xs font-sans-bold text-slate-800">
              {student.board} • {student.school}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-slate-500">Target Exam:</Text>
            <Text className="text-xs font-sans-bold text-slate-800">{student.targetExam}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-slate-500">Previous Exam Score:</Text>
            <Text className="text-xs font-sans-bold text-blue-600">{student.previousPercentage}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-slate-500">Blood Group:</Text>
            <Text className="text-xs font-sans-bold text-slate-800">{student.bloodGroup}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-slate-500">Residential Address:</Text>
            <Text className="text-xs font-sans-bold text-slate-800 max-w-[200px] text-right">
              {student.address}
            </Text>
          </View>
        </View>

        {/* Weak Subjects Tags */}
        {student.weakSubjects && student.weakSubjects.length > 0 && (
          <View>
            <Text className="text-xs font-sans-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Focus / Revision Priority:
            </Text>
            <View className="flex-row flex-wrap gap-1.5">
              {student.weakSubjects.map((sub, i) => (
                <View key={i} className="bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-xl">
                  <Text className="text-xs font-sans-bold text-rose-700">{sub}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Fee Collection Status Card */}
      <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-1.5">
            <DollarSign size={16} color="#1C1C1E" />
            <Text className="text-sm font-sans-bold text-slate-900">Tuition Fee Status</Text>
          </View>
          <TouchableOpacity
            onPress={handleCycleFeeStatus}
            className="bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 active:scale-98"
          >
            <Text className="text-[10px] font-sans-bold text-blue-700">Update Status ↺</Text>
          </TouchableOpacity>
        </View>
        <View className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
          <Text className="text-xs font-sans-bold text-slate-800">{feeStatus}</Text>
          <Text className="text-[10px] text-slate-500 mt-0.5">
            UPI payments automatically reconcile via parent notifications.
          </Text>
        </View>
      </View>

      {/* Teacher Remarks & Observations */}
      <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3">
        <View className="flex-row items-center gap-1.5">
          <MessageSquare size={16} color="#1C1C1E" />
          <Text className="text-sm font-sans-bold text-slate-900">Teacher Observations & Remarks</Text>
        </View>

        <View className="gap-2">
          {remarks.map((remark, idx) => (
            <View
              key={idx}
              className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex-row items-start gap-2"
            >
              <Text className="text-xs">📌</Text>
              <Text className="text-xs text-slate-700 flex-1 leading-relaxed">{remark}</Text>
            </View>
          ))}
        </View>

        {/* Add New Remark Input */}
        <View className="flex-row gap-2 mt-1">
          <TextInput
            placeholder="Record mentor note..."
            placeholderTextColor="#8C877E"
            value={newRemarkText}
            onChangeText={setNewRemarkText}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs text-slate-800"
          />
          <TouchableOpacity
            onPress={handleAddRemark}
            className="bg-blue-600 px-3.5 py-2 rounded-2xl items-center justify-center active:scale-98 shadow-xs"
          >
            <Plus size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
