import React, { useState } from 'react';
import { View, Text, Pressable, Modal, Alert } from 'react-native';
import {
  FileText,
  Download,
  Upload,
  X,
  Plus,
  BookOpen,
  CheckCircle,
} from 'lucide-react-native';
import { useAcademic } from '@/context/AcademicContext';
import { useAuth } from '@/context/AuthContext';
import { Card, Button, Input, Badge } from '@/components/ui';

export const StudyMaterialsViewer: React.FC = () => {
  const { materials, uploadMaterial } = useAcademic();
  const { userRole } = useAuth();

  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [downloadedIds, setDownloadedIds] = useState<string[]>([]);

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Physics');
  const [description, setDescription] = useState('');

  const subjects = ['All', 'Physics', 'Chemistry', 'Mathematics'];

  const filtered = selectedSubject === 'All'
    ? materials
    : materials.filter((m) => m.subject.toLowerCase() === selectedSubject.toLowerCase());

  const handleDownload = (id: string, title: string) => {
    if (downloadedIds.includes(id)) {
      Alert.alert('File Ready', `"${title}" is already stored in your offline library.`);
      return;
    }
    Alert.alert('Downloading PDF', `Downloading "${title}"...`);
    setTimeout(() => {
      setDownloadedIds((prev) => [...prev, id]);
      Alert.alert('Download Complete', 'PDF saved to device.');
    }, 1000);
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title for the study notes.');
      return;
    }

    await uploadMaterial({
      title,
      subject,
      description,
      file_url: 'https://example.com/notes.pdf',
      file_type: 'pdf',
      file_size_formatted: '5.4 MB',
      page_count: 28,
      uploaded_by: userRole === 'teacher' ? 'Er. Rakesh Verma' : 'Director Sharma',
    });

    setIsUploadOpen(false);
    setTitle('');
    setDescription('');
    Alert.alert('Uploaded', 'Study material published to enrolled batches.');
  };

  return (
    <View className="gap-3">
      {/* Subject Filter Pills & Upload Action */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5 flex-1 overflow-hidden">
          {subjects.map((sub) => (
            <Pressable
              key={sub}
              onPress={() => setSelectedSubject(sub)}
              className={`px-3 py-1.5 rounded-xl ${
                selectedSubject === sub
                  ? 'bg-secondary'
                  : 'bg-surface-container active:bg-surface-container-high'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  selectedSubject === sub ? 'text-on-secondary' : 'text-on-surface-variant'
                }`}
              >
                {sub}
              </Text>
            </Pressable>
          ))}
        </View>

        {(userRole === 'admin' || userRole === 'teacher') && (
          <Button
            size="sm"
            variant="surface"
            title="+ Upload"
            onPress={() => setIsUploadOpen(true)}
          />
        )}
      </View>

      {/* Material List */}
      <View className="gap-2.5">
        {filtered.map((item) => (
          <Card key={item.id} elevation="lowest" className="gap-2.5">
            <View className="flex-row items-start justify-between gap-2">
              <View className="w-10 h-10 rounded-xl bg-secondary/10 items-center justify-center shrink-0">
                <FileText size={20} color="#0051d5" />
              </View>

              <View className="flex-1 min-w-0">
                <View className="flex-row items-center gap-1.5 mb-0.5">
                  <Badge label={item.subject} variant="info" />
                  <Text className="text-[11px] text-on-surface-variant">
                    {item.file_size_formatted} • {item.page_count} Pages
                  </Text>
                </View>
                <Text className="text-sm font-bold text-on-surface leading-snug">
                  {item.title}
                </Text>
                {item.description && (
                  <Text className="text-xs text-on-surface-variant mt-1" numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
              </View>
            </View>

            <View className="flex-row items-center justify-between pt-2 border-t border-black/5">
              <Text className="text-[11px] text-on-surface-variant">
                By {item.uploaded_by}
              </Text>

              <Button
                size="sm"
                variant={downloadedIds.includes(item.id) ? 'surface' : 'primary'}
                title={downloadedIds.includes(item.id) ? 'Downloaded' : 'Download PDF'}
                leftIcon={
                  downloadedIds.includes(item.id) ? (
                    <CheckCircle size={14} color="#069669" />
                  ) : (
                    <Download size={14} color="#ffffff" />
                  )
                }
                onPress={() => handleDownload(item.id, item.title)}
              />
            </View>
          </Card>
        ))}
      </View>

      {/* UPLOAD MATERIAL MODAL */}
      <Modal visible={isUploadOpen} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-surface rounded-t-3xl p-5 gap-3 max-h-[85%]">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-on-surface">Upload Study Material</Text>
              <Pressable onPress={() => setIsUploadOpen(false)}>
                <X size={20} color="#0b1c30" />
              </Pressable>
            </View>

            <Input
              label="Document Title"
              placeholder="e.g. Thermodynamics Chapter Notes & Formula Sheet"
              value={title}
              onChangeText={setTitle}
            />

            <Input
              label="Subject Domain"
              placeholder="Physics / Chemistry / Mathematics"
              value={subject}
              onChangeText={setSubject}
            />

            <Input
              label="Description / Syllabus Coverage"
              placeholder="e.g. Derivations, summary notes, and 2024 questions"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <Button
              variant="primary"
              title="Publish PDF Document"
              leftIcon={<Upload size={16} color="#ffffff" />}
              fullWidth
              onPress={handleUpload}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};
