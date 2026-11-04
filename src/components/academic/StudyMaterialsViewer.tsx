import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Alert, ScrollView, TextInput } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import {
  FileText,
  Download,
  Upload,
  X,
  Plus,
  BookOpen,
  CheckCircle,
  Share2,
} from 'lucide-react-native';
import { useAcademic } from '@/context/AcademicContext';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui';
import { generateAndSharePDF, DUMMY_PDF_CATALOG, type PDFDocumentContent } from '@/services/dummyPdfService';
import { type StudyMaterial } from '@/types/database';

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
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    uri: string;
    sizeFormatted: string;
  } | null>(null);

  const subjects = ['All', 'Physics', 'Chemistry', 'Mathematics'];

  const filtered = selectedSubject === 'All'
    ? materials
    : materials.filter((m) => m.subject.toLowerCase() === selectedSubject.toLowerCase());

  const handlePickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        const sizeMB = asset.size ? `${(asset.size / (1024 * 1024)).toFixed(1)} MB` : '1.5 MB';
        setSelectedFile({
          name: asset.name,
          uri: asset.uri,
          sizeFormatted: sizeMB,
        });
        if (!title.trim()) {
          setTitle(asset.name.replace(/\.[^/.]+$/, ''));
        }
      }
    } catch {
      Alert.alert('File Picker', 'Unable to select file.');
    }
  };

  const handleDownload = async (item: StudyMaterial) => {
    try {
      const matched = DUMMY_PDF_CATALOG.find(
        (d) => d.subject.toLowerCase() === item.subject.toLowerCase()
      );
      const doc: PDFDocumentContent = matched || {
        id: item.id,
        title: item.title,
        subtitle: item.description || 'Verified Classroom Reference Document',
        subject: item.subject,
        author: item.uploaded_by,
        category: 'notes',
        date: 'Class 12 • JEE Advanced 2026',
        sections: [
          {
            heading: 'Key Conceptual Summaries',
            items: [
              'Fundamental derivations and vector formulations.',
              'Standard properties, limits, and boundary conditions.',
              'Worked example problems from recent national test series.',
            ],
          },
        ],
      };
      await generateAndSharePDF(doc);
      setDownloadedIds((prev) => [...prev, item.id]);
    } catch {
      Alert.alert('PDF Viewer', 'Could not open document preview.');
    }
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title for the study notes.');
      return;
    }

    if (!selectedFile) {
      Alert.alert('Document Required', 'Please attach a real PDF document to publish.');
      return;
    }

    await uploadMaterial({
      title,
      subject,
      description,
      file_url: selectedFile.uri,
      file_type: 'pdf',
      file_size_formatted: selectedFile.sizeFormatted,
      page_count: 12,
      uploaded_by: userRole === 'teacher' ? 'Prof. Vikram Joshi' : 'Director Sharma',
    });

    setIsUploadOpen(false);
    setTitle('');
    setDescription('');
    setSelectedFile(null);
    Alert.alert('Published! 📄', 'Study material is now accessible to all enrolled batches.');
  };

  return (
    <View className="gap-3">
      {/* Subject Filter Pills & Upload Action */}
      <View className="flex-row items-center justify-between">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1 mr-2">
          <View className="flex-row gap-1.5">
            {subjects.map((sub) => (
              <TouchableOpacity
                key={sub}
                onPress={() => setSelectedSubject(sub)}
                className={`px-3 py-1.5 rounded-xl border ${
                  selectedSubject === sub
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-white border-slate-200'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    selectedSubject === sub ? 'text-white' : 'text-slate-600'
                  }`}
                >
                  {sub}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {(userRole === 'admin' || userRole === 'teacher') && (
          <TouchableOpacity
            onPress={() => setIsUploadOpen(true)}
            className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl flex-row items-center gap-1 active:scale-95"
          >
            <Plus size={13} color="#2563EB" />
            <Text className="text-xs font-bold text-blue-600">Upload Note</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Material List */}
      <View className="gap-2.5">
        {filtered.map((item) => (
          <View
            key={item.id}
            className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs gap-3"
          >
            <View className="flex-row items-start justify-between gap-2">
              <View className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 items-center justify-center shrink-0">
                <FileText size={18} color="#2563EB" />
              </View>

              <View className="flex-1 min-w-0">
                <View className="flex-row items-center gap-1.5 mb-1">
                  <Badge label={item.subject} variant="info" />
                  <Text className="text-[11px] text-slate-400">
                    {item.file_size_formatted} • {item.page_count} Pages
                  </Text>
                </View>
                <Text className="text-sm font-bold text-slate-900 leading-snug">
                  {item.title}
                </Text>
                {item.description && (
                  <Text className="text-xs text-slate-500 mt-1" numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
              </View>
            </View>

            <View className="flex-row items-center justify-between pt-2.5 border-t border-slate-100">
              <Text className="text-[11px] text-slate-400">
                Faculty: {item.uploaded_by}
              </Text>

              <TouchableOpacity
                onPress={() => handleDownload(item)}
                className="bg-blue-600 px-3 py-1.5 rounded-xl flex-row items-center gap-1.5 active:scale-95 shadow-xs"
              >
                <Download size={13} color="#ffffff" />
                <Text className="text-xs font-bold text-white">View & Share PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* UPLOAD MATERIAL MODAL */}
      <Modal visible={isUploadOpen} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 gap-3.5 max-h-[85%] border-t border-slate-200">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-extrabold text-slate-900">Upload Study Material</Text>
              <TouchableOpacity onPress={() => setIsUploadOpen(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View>
              <Text className="text-xs font-bold text-slate-700 mb-1">Document Title</Text>
              <TextInput
                placeholder="e.g. Thermodynamics Chapter Notes & Formula Sheet"
                placeholderTextColor="#94a3b8"
                value={title}
                onChangeText={setTitle}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-bold"
              />
            </View>

            <View>
              <Text className="text-xs font-bold text-slate-700 mb-1">Subject Domain</Text>
              <TextInput
                placeholder="Physics / Chemistry / Mathematics"
                placeholderTextColor="#94a3b8"
                value={subject}
                onChangeText={setSubject}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-bold"
              />
            </View>

            <View>
              <Text className="text-xs font-bold text-slate-700 mb-1">Description / Syllabus Coverage</Text>
              <TextInput
                placeholder="e.g. Derivations, summary notes, and 2024 questions"
                placeholderTextColor="#94a3b8"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 min-h-[70px]"
              />
            </View>

            <View>
              <Text className="text-xs font-bold text-slate-700 mb-1">Attached PDF File</Text>
              <TouchableOpacity
                onPress={handlePickFile}
                className={`p-3 rounded-xl border flex-row items-center justify-between active:scale-98 ${
                  selectedFile
                    ? 'bg-emerald-50 border-emerald-300'
                    : 'bg-slate-50 border-dashed border-slate-300'
                }`}
              >
                <View className="flex-row items-center gap-2 flex-1 pr-2">
                  <FileText size={16} color={selectedFile ? '#059669' : '#64748B'} />
                  <Text
                    className={`text-xs font-semibold ${
                      selectedFile ? 'text-emerald-900 font-bold' : 'text-slate-600'
                    }`}
                    numberOfLines={1}
                  >
                    {selectedFile ? `${selectedFile.name} (${selectedFile.sizeFormatted})` : 'Choose PDF from device...'}
                  </Text>
                </View>
                {selectedFile ? (
                  <CheckCircle size={16} color="#059669" />
                ) : (
                  <Upload size={14} color="#64748B" />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleUpload}
              className="bg-blue-600 py-3 rounded-2xl items-center shadow-xs mt-1 active:scale-98"
            >
              <Text className="text-xs font-bold text-white">Publish PDF Document</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};
