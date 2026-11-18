import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import {
  FileText,
  Download,
  Upload,
  X,
  BookOpen,
  CheckCircle,
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { useStudyMaterials, useUploadMaterial } from '@/hooks/queries/useMaterialQueries';
import { Badge } from '@/components/ui';
import { type PDFDocumentContent } from '@/services/dummyPdfService';
import { openStudyMaterial } from '@/lib/openStudyMaterial';
import { type StudyMaterial } from '@/types/database';
import { type PDFMaterialItem } from '@/services/materialService';
import { DocumentReaderModal } from './DocumentReaderModal';

export const StudyMaterialsViewer: React.FC = () => {
  const { user, userRole, activeInstitute } = useAuth();
  const { selectedBatchId } = useUI();

  const {
    data: materials = [],
    isLoading,
    isError,
    refetch,
  } = useStudyMaterials(activeInstitute?.id, selectedBatchId || undefined);

  const uploadMutation = useUploadMaterial();

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
  const [activeReaderDoc, setActiveReaderDoc] = useState<PDFDocumentContent | null>(null);

  const subjects = ['All', 'Physics', 'Chemistry', 'Mathematics'];

  const filtered = selectedSubject === 'All'
    ? materials
    : materials.filter((m) => (m.subject || '').toLowerCase() === selectedSubject.toLowerCase());

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

  const handleDownload = async (item: PDFMaterialItem) => {
    if (await openStudyMaterial(item.storagePath)) {
      setDownloadedIds((prev) => [...prev, item.id]);
    }
  };

  const handleOpenReader = (item: PDFMaterialItem) => {
    openStudyMaterial(item.storagePath);
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title for the study notes.');
      return;
    }

    if (!selectedFile) {
      Alert.alert('Document Required', 'Please attach a real PDF document (Max 20 MB).');
      return;
    }

    if (!user || !activeInstitute) {
      Alert.alert('Authentication Required', 'Please verify your active institute session.');
      return;
    }

    try {
      await uploadMutation.mutateAsync({
        fileUri: selectedFile.uri,
        fileName: selectedFile.name,
        title: title.trim(),
        subjectId: undefined,
        batchId: selectedBatchId || undefined,
        instituteId: activeInstitute.id,
        category: 'notes',
        description: description.trim(),
        uploadedBy: user.id,
      });

      setIsUploadOpen(false);
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      Alert.alert('Published', 'Study material is now accessible to all enrolled batches.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      Alert.alert('Upload Error', msg);
    }
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
                  className={`text-xs font-sans-bold ${
                    selectedSubject === sub ? 'text-white' : 'text-slate-600'
                  }`}
                >
                  {sub}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {(userRole === 'teacher' || userRole === 'admin') && (
          <TouchableOpacity
            onPress={() => setIsUploadOpen(true)}
            className="flex-row items-center gap-1.5 bg-blue-600 px-3 py-1.5 rounded-xl shadow-xs active:scale-95"
          >
            <Upload size={13} color="#FFFFFF" />
            <Text className="text-xs font-sans-bold text-white">Upload Notes</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Loading Skeleton */}
      {isLoading && (
        <View className="p-8 items-center justify-center bg-white rounded-2xl border border-slate-200">
          <ActivityIndicator size="small" color="#1C1C1E" />
          <Text className="text-xs text-slate-500 mt-2 font-sans">Loading PDF repository...</Text>
        </View>
      )}

      {/* Empty State */}
      {!isLoading && filtered.length === 0 && (
        <View className="p-8 items-center justify-center bg-white rounded-2xl border border-slate-200">
          <FileText size={28} color="#8C877E" />
          <Text className="text-sm font-sans-bold text-slate-800 mt-2">No Study Materials Found</Text>
          <Text className="text-xs text-slate-500 text-center mt-1">
            {selectedSubject === 'All'
              ? 'No notes or DPPs published yet. Tap Upload Notes to publish PDF materials.'
              : `No published materials for ${selectedSubject}.`}
          </Text>
        </View>
      )}

      {/* Materials List */}
      {!isLoading && (
        <View className="gap-2.5">
          {filtered.map((item) => {
            const isDownloaded = downloadedIds.includes(item.id);
            return (
              <View
                key={item.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs"
              >
                <View className="flex-row items-start justify-between gap-3">
                  <View className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 items-center justify-center shrink-0">
                    <FileText size={20} color="#1C1C1E" />
                  </View>

                  <View className="flex-1 min-w-0">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Badge label={item.subject || 'Physics'} variant="info" />
                      <Text className="text-[10px] text-slate-400 font-sans-bold">
                        {item.fileSizeBytes || '1.8 MB'}
                      </Text>
                    </View>

                    <Text className="text-sm font-display text-slate-900" numberOfLines={1}>
                      {item.title}
                    </Text>

                    {item.subtitle ? (
                      <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={2}>
                        {item.subtitle}
                      </Text>
                    ) : null}
                  </View>
                </View>

                {/* Actions */}
                <View className="flex-row items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-100">
                  <TouchableOpacity
                    onPress={() => handleOpenReader(item)}
                    className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 active:scale-95"
                  >
                    <BookOpen size={13} color="#3B372F" />
                    <Text className="text-xs font-sans-bold text-slate-700">Preview</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDownload(item)}
                    className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl ${
                      isDownloaded ? 'bg-emerald-50 border border-emerald-200' : 'bg-blue-600'
                    } active:scale-95`}
                  >
                    {isDownloaded ? (
                      <>
                        <CheckCircle size={13} color="#059669" />
                        <Text className="text-xs font-sans-bold text-emerald-800">Downloaded</Text>
                      </>
                    ) : (
                      <>
                        <Download size={13} color="#FFFFFF" />
                        <Text className="text-xs font-sans-bold text-white">Save PDF</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Upload Modal */}
      <Modal visible={isUploadOpen} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-5 gap-3.5 max-h-[85%]">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-display text-slate-900">Upload Study Material</Text>
              <TouchableOpacity onPress={() => setIsUploadOpen(false)}>
                <X size={20} color="#6E6A63" />
              </TouchableOpacity>
            </View>

            <View className="gap-1">
              <Text className="text-xs font-sans-bold text-slate-700">Title</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Rotational Mechanics Complete Formula Sheet"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-sans"
              />
            </View>

            <View className="gap-1">
              <Text className="text-xs font-sans-bold text-slate-700">Subject</Text>
              <View className="flex-row gap-2">
                {['Physics', 'Chemistry', 'Mathematics'].map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setSubject(s)}
                    className={`px-3 py-1.5 rounded-xl border ${
                      subject === s ? 'bg-blue-50 border-blue-500' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <Text
                      className={`text-xs font-sans-bold ${
                        subject === s ? 'text-blue-600' : 'text-slate-600'
                      }`}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="gap-1">
              <Text className="text-xs font-sans-bold text-slate-700">Description (Optional)</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Brief summary of what this document covers..."
                multiline
                numberOfLines={2}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-sans"
              />
            </View>

            {/* Document Picker */}
            <TouchableOpacity
              onPress={handlePickFile}
              className="p-4 rounded-xl border-2 border-dashed border-slate-200 items-center justify-center bg-slate-50"
            >
              {selectedFile ? (
                <View className="items-center">
                  <FileText size={24} color="#059669" />
                  <Text className="text-xs font-sans-bold text-slate-900 mt-1" numberOfLines={1}>
                    {selectedFile.name}
                  </Text>
                  <Text className="text-[10px] text-slate-500">{selectedFile.sizeFormatted}</Text>
                </View>
              ) : (
                <View className="items-center">
                  <Upload size={24} color="#6E6A63" />
                  <Text className="text-xs font-sans-bold text-slate-700 mt-1">Tap to select PDF</Text>
                  <Text className="text-[10px] text-slate-400">PDF documents up to 20 MB</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleUpload}
              disabled={uploadMutation.isPending}
              className={`py-3.5 bg-blue-600 rounded-xl items-center justify-center ${
                uploadMutation.isPending ? 'opacity-60' : ''
              }`}
            >
              {uploadMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text className="text-sm font-display text-white">Publish Study Material</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Native In-App Document Reader */}
      {activeReaderDoc && (
        <DocumentReaderModal
          document={activeReaderDoc}
          visible={Boolean(activeReaderDoc)}
          onClose={() => setActiveReaderDoc(null)}
        />
      )}
    </View>
  );
};
