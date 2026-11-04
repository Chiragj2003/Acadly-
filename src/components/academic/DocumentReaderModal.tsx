import React from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { X, Download, FileText, CheckCircle2, BookOpen, Share2 } from 'lucide-react-native';
import { Badge } from '@/components/ui';
import { generateAndSharePDF, type PDFDocumentContent } from '@/services/dummyPdfService';

interface DocumentReaderModalProps {
  document: PDFDocumentContent | null;
  visible: boolean;
  onClose: () => void;
}

export const DocumentReaderModal: React.FC<DocumentReaderModalProps> = ({
  document,
  visible,
  onClose,
}) => {
  if (!document) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-slate-900">
        {/* Top Control Bar */}
        <View className="bg-slate-900 border-b border-slate-800 px-4 py-3.5 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2 flex-1 min-w-0 mr-3">
            <View className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 items-center justify-center shrink-0">
              <FileText size={16} color="#60A5FA" />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-xs font-bold text-white" numberOfLines={1}>
                {document.title}
              </Text>
              <Text className="text-[10px] text-slate-400 font-medium" numberOfLines={1}>
                {document.subject} • {document.author}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-2 shrink-0">
            <TouchableOpacity
              onPress={() => generateAndSharePDF(document)}
              className="bg-blue-600 px-3 py-1.5 rounded-xl flex-row items-center gap-1.5 active:scale-95 shadow-xs"
            >
              <Download size={13} color="#FFFFFF" />
              <Text className="text-xs font-bold text-white">Save PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 items-center justify-center active:scale-95"
            >
              <X size={16} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* In-App Document Canvas */}
        <ScrollView className="flex-1 bg-white p-5" contentContainerStyle={{ paddingBottom: 60 }}>
          {/* Document Header Plaque */}
          <View className="border-b border-slate-200 pb-4 mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Badge label={document.subject} variant="primary" />
              <Text className="text-[11px] font-semibold text-slate-400">{document.date}</Text>
            </View>

            <Text className="text-lg font-black text-slate-900 leading-snug">
              {document.title}
            </Text>
            <Text className="text-xs text-slate-500 mt-1 leading-relaxed">
              {document.subtitle}
            </Text>

            <View className="flex-row items-center gap-3 mt-3 pt-2.5 border-t border-slate-100">
              <Text className="text-[11px] font-bold text-slate-700">
                Author: <Text className="font-semibold text-slate-500">{document.author}</Text>
              </Text>
              <Text className="text-[11px] font-bold text-slate-700">
                Type: <Text className="font-semibold text-slate-500 uppercase">{document.category}</Text>
              </Text>
            </View>
          </View>

          {/* Document Sections */}
          <View className="gap-4">
            {document.sections.map((sec, idx) => (
              <View key={idx} className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 gap-2.5">
                <View className="flex-row items-center gap-2">
                  <View className="w-6 h-6 rounded-lg bg-blue-100 items-center justify-center">
                    <Text className="text-xs font-black text-blue-700">{idx + 1}</Text>
                  </View>
                  <Text className="text-sm font-black text-slate-900 flex-1">
                    {sec.heading}
                  </Text>
                </View>

                <View className="gap-2 pl-2">
                  {sec.items.map((item, itemIdx) => (
                    <View key={itemIdx} className="flex-row items-start gap-2">
                      <View className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                      <Text className="text-xs text-slate-700 leading-relaxed font-mono flex-1">
                        {item}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>

          {/* Footer Notice */}
          <View className="mt-6 p-4 rounded-2xl bg-blue-50/60 border border-blue-200/60 items-center gap-1">
            <View className="flex-row items-center gap-1.5">
              <CheckCircle2 size={14} color="#2563EB" />
              <Text className="text-xs font-bold text-blue-900">Verified Acadly Classroom Study Note</Text>
            </View>
            <Text className="text-[11px] text-blue-700/80 text-center">
              Tap "Save PDF" above to export this document directly to your device storage or print.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};
