import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { X, Plus, Trash2, Calendar, Clock, MapPin, Radio, BookOpen, Check } from 'lucide-react-native';
import { type BatchSchedule } from '@/types/database';
import {
  useBatchSchedule,
  useUpsertBatchSchedule,
  useDeleteBatchSchedule,
} from '@/hooks/queries/useScheduleQueries';
import { type Weekday } from '@/services/scheduleService';

interface BatchScheduleEditorModalProps {
  visible: boolean;
  onClose: () => void;
  batchId: string;
  batchName: string;
  instituteId: string;
}

const WEEKDAYS: Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const BatchScheduleEditorModal: React.FC<BatchScheduleEditorModalProps> = ({
  visible,
  onClose,
  batchId,
  batchName,
  instituteId,
}) => {
  const { data: scheduleList = [], isLoading } = useBatchSchedule(batchId);
  const upsertMutation = useUpsertBatchSchedule();
  const deleteMutation = useDeleteBatchSchedule();

  const [selectedDay, setSelectedDay] = useState<Weekday>('Mon');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);

  // Form fields
  const [subjectName, setSubjectName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:30');
  const [room, setRoom] = useState('');
  const [tag, setTag] = useState('Classroom');
  const [isLive, setIsLive] = useState(false);

  const daySlots = scheduleList.filter((s) => s.weekday === selectedDay);

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(undefined);
    setSubjectName('');
    setTeacherName('');
    setStartTime('10:00');
    setEndTime('11:30');
    setRoom('');
    setTag('Classroom');
    setIsLive(false);
  };

  const handleStartCreate = () => {
    resetForm();
    setIsEditing(true);
  };

  const handleStartEdit = (item: BatchSchedule) => {
    setEditingId(item.id);
    setSubjectName(item.subject_name || '');
    setTeacherName(item.teacher_name || '');
    setStartTime(item.start_time.substring(0, 5));
    setEndTime(item.end_time.substring(0, 5));
    setRoom(item.room || '');
    setTag(item.tag || 'Classroom');
    setIsLive(Boolean(item.is_live));
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!subjectName.trim()) {
      Alert.alert('Required', 'Please enter a subject or title.');
      return;
    }

    try {
      await upsertMutation.mutateAsync({
        id: editingId,
        institute_id: instituteId,
        batch_id: batchId,
        weekday: selectedDay,
        start_time: startTime,
        end_time: endTime,
        subject_name: subjectName.trim(),
        teacher_name: teacherName.trim() || undefined,
        room: room.trim() || undefined,
        tag: tag.trim() || 'Classroom',
        is_live: isLive,
      });

      resetForm();
      Alert.alert('Saved', 'Schedule slot saved successfully.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save schedule';
      Alert.alert('Error', msg);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Slot', 'Are you sure you want to delete this schedule slot?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync({ id, batchId });
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to delete slot';
            Alert.alert('Error', msg);
          }
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/60"
      >
        <View className="bg-white rounded-t-3xl max-h-[88%] p-5 border-t border-slate-200">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
            <View>
              <Text className="text-base font-bold text-slate-900">Weekly Batch Schedule</Text>
              <Text className="text-xs text-slate-500">{batchName}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
            >
              <X size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Weekday Tabs */}
          <View className="flex-row justify-between py-3 border-b border-slate-100">
            {WEEKDAYS.map((day) => {
              const isSelected = selectedDay === day;
              const count = scheduleList.filter((s) => s.weekday === day).length;
              return (
                <TouchableOpacity
                  key={day}
                  onPress={() => {
                    setSelectedDay(day);
                    resetForm();
                  }}
                  className={`items-center py-2 px-2.5 rounded-xl ${
                    isSelected ? 'bg-blue-600' : 'bg-slate-50'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      isSelected ? 'text-white' : 'text-slate-600'
                    }`}
                  >
                    {day}
                  </Text>
                  {count > 0 && (
                    <View
                      className={`w-1.5 h-1.5 rounded-full mt-1 ${
                        isSelected ? 'bg-white' : 'bg-blue-500'
                      }`}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Content */}
          <ScrollView className="py-3" keyboardShouldPersistTaps="handled">
            {isEditing ? (
              <View className="gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <Text className="text-xs font-bold text-slate-700 uppercase">
                  {editingId ? 'Edit Schedule Slot' : `Add Slot for ${selectedDay}`}
                </Text>

                <View>
                  <Text className="text-[11px] font-semibold text-slate-600 mb-1">Subject / Title</Text>
                  <TextInput
                    value={subjectName}
                    onChangeText={setSubjectName}
                    placeholder="e.g. Physics • Rotational Dynamics"
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                  />
                </View>

                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Text className="text-[11px] font-semibold text-slate-600 mb-1">Start Time (HH:MM)</Text>
                    <TextInput
                      value={startTime}
                      onChangeText={setStartTime}
                      placeholder="09:00"
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[11px] font-semibold text-slate-600 mb-1">End Time (HH:MM)</Text>
                    <TextInput
                      value={endTime}
                      onChangeText={setEndTime}
                      placeholder="10:30"
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                    />
                  </View>
                </View>

                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Text className="text-[11px] font-semibold text-slate-600 mb-1">Faculty Name</Text>
                    <TextInput
                      value={teacherName}
                      onChangeText={setTeacherName}
                      placeholder="e.g. Prof. Vikram Joshi"
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[11px] font-semibold text-slate-600 mb-1">Room</Text>
                    <TextInput
                      value={room}
                      onChangeText={setRoom}
                      placeholder="Hall A"
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                    />
                  </View>
                </View>

                <View className="flex-row items-center justify-between pt-1">
                  <TouchableOpacity
                    onPress={() => setIsLive(!isLive)}
                    className="flex-row items-center gap-2"
                  >
                    <View
                      className={`w-4 h-4 rounded border items-center justify-center ${
                        isLive ? 'bg-red-500 border-red-500' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isLive && <Check size={12} color="white" />}
                    </View>
                    <Text className="text-xs text-slate-700 font-medium">Broadcast Live Stream</Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-row gap-2 pt-2">
                  <TouchableOpacity
                    onPress={resetForm}
                    className="flex-1 py-2.5 rounded-xl bg-slate-200 items-center"
                  >
                    <Text className="text-xs font-bold text-slate-700">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSave}
                    disabled={upsertMutation.isPending}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 items-center"
                  >
                    <Text className="text-xs font-bold text-white">
                      {upsertMutation.isPending ? 'Saving...' : 'Save Slot'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View className="gap-2.5">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-xs font-bold text-slate-700">
                    Classes on {selectedDay} ({daySlots.length})
                  </Text>
                  <TouchableOpacity
                    onPress={handleStartCreate}
                    className="flex-row items-center gap-1 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-200"
                  >
                    <Plus size={14} color="#2563eb" />
                    <Text className="text-xs font-bold text-blue-600">Add Slot</Text>
                  </TouchableOpacity>
                </View>

                {isLoading ? (
                  <View className="p-6 items-center">
                    <Text className="text-xs text-slate-400">Loading schedule...</Text>
                  </View>
                ) : daySlots.length === 0 ? (
                  <View className="p-8 items-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Calendar size={28} color="#94a3b8" />
                    <Text className="text-xs font-bold text-slate-600 mt-2">
                      No classes scheduled for {selectedDay}
                    </Text>
                    <Text className="text-[11px] text-slate-400 mt-0.5 text-center">
                      Tap "+ Add Slot" above to configure timetable for this batch.
                    </Text>
                  </View>
                ) : (
                  daySlots.map((slot) => (
                    <View
                      key={slot.id}
                      className="bg-white border border-slate-200 rounded-2xl p-3.5 flex-row items-center justify-between shadow-xs"
                    >
                      <View className="flex-1 mr-2">
                        <View className="flex-row items-center gap-2 mb-1">
                          <Text className="text-xs font-bold text-slate-900">
                            {slot.subject_name}
                          </Text>
                          {slot.is_live && (
                            <View className="bg-red-100 px-1.5 py-0.5 rounded flex-row items-center gap-1">
                              <Radio size={10} color="#dc2626" />
                              <Text className="text-[10px] font-bold text-red-600">LIVE</Text>
                            </View>
                          )}
                        </View>
                        <View className="flex-row items-center gap-3 text-slate-500">
                          <View className="flex-row items-center gap-1">
                            <Clock size={11} color="#64748b" />
                            <Text className="text-[11px] text-slate-500">
                              {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                            </Text>
                          </View>
                          {slot.room && (
                            <View className="flex-row items-center gap-1">
                              <MapPin size={11} color="#64748b" />
                              <Text className="text-[11px] text-slate-500">{slot.room}</Text>
                            </View>
                          )}
                        </View>
                        {slot.teacher_name && (
                          <Text className="text-[11px] text-slate-400 mt-0.5">
                            Faculty: {slot.teacher_name}
                          </Text>
                        )}
                      </View>

                      <View className="flex-row items-center gap-1.5">
                        <TouchableOpacity
                          onPress={() => handleStartEdit(slot)}
                          className="px-2 py-1 bg-slate-100 rounded-lg"
                        >
                          <Text className="text-[11px] font-semibold text-slate-700">Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDelete(slot.id)}
                          className="p-1 bg-red-50 rounded-lg"
                        >
                          <Trash2 size={14} color="#dc2626" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
