import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import {
  MessageSquare,
  BookOpen,
  ThumbsUp,
  CheckCircle2,
  Share2,
  FileText,
  Search,
  Download,
  Filter,
  Plus,
  ArrowLeft,
  Sparkles,
  Paperclip,
  Eye,
  X,
  Upload,
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { ScreenWrapper, Badge, Mascot } from '@/components/ui';
import { useAcademic, CommunityPost, PDFMaterialItem } from '@/context/AcademicContext';
import { useAuth } from '@/context/AuthContext';
import {
  DUMMY_PDF_CATALOG,
  PDFDocumentContent,
  generateAndSharePDF,
} from '@/services/dummyPdfService';

const SUBJECTS = ['All', 'Physics', 'Mathematics', 'Chemistry', 'Biology'];

const PDF_CATEGORIES: { id: 'all' | 'notes' | 'formula_sheet' | 'pyq' | 'dpp'; label: string }[] = [
  { id: 'all', label: 'All Resources 📚' },
  { id: 'formula_sheet', label: 'Formula Sheets 📐' },
  { id: 'notes', label: 'Handwritten Notes 📖' },
  { id: 'pyq', label: 'Solved PYQs 📝' },
  { id: 'dpp', label: 'Daily DPPs ⚡' },
];

export default function CommunityScreen() {
  const router = useRouter();
  const { userRole } = useAuth();
  const {
    communityPosts,
    addCommunityPost,
    upvoteCommunityPost,
    addCommunityComment,
    pdfMaterials,
    uploadPDFMaterial,
  } = useAcademic();

  const [activeTab, setActiveTab] = useState<'doubts' | 'library'>('doubts');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedPdfCategory, setSelectedPdfCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Ask Question Form
  const [isAsking, setIsAsking] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [attachedFileName, setAttachedFileName] = useState<string | undefined>();
  const [attachedFileUri, setAttachedFileUri] = useState<string | undefined>();

  // PDF Preview Modal
  const [previewDoc, setPreviewDoc] = useState<PDFDocumentContent | null>(null);

  // Upload PDF Modal
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [pdfUploadTitle, setPdfUploadTitle] = useState('');
  const [pdfUploadSubject, setPdfUploadSubject] = useState('Physics');
  const [pdfUploadCategory, setPdfUploadCategory] = useState<'notes' | 'formula_sheet' | 'pyq' | 'dpp'>('notes');
  const [selectedUploadFile, setSelectedUploadFile] = useState<{ name: string; size?: string } | null>(null);

  // Pick document for doubt attachment
  const handlePickDoubtAttachment = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        setAttachedFileName(res.assets[0].name);
        setAttachedFileUri(res.assets[0].uri);
      }
    } catch {
      Alert.alert('File Picker', 'Could not access documents.');
    }
  };

  // Submit Doubt Post
  const handleSubmitDoubt = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      Alert.alert('Validation Error', 'Please enter a title and question description.');
      return;
    }
    const subject = selectedSubject === 'All' ? 'Physics' : selectedSubject;
    await addCommunityPost(newTitle, newContent, subject, attachedFileName, attachedFileUri);
    setNewTitle('');
    setNewContent('');
    setAttachedFileName(undefined);
    setAttachedFileUri(undefined);
    setIsAsking(false);
    Alert.alert('Question Posted! 🌸', 'Your peer group and teachers have been notified.');
  };

  // Pick PDF for Uploading Note
  const handlePickNoteFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        const sizeMb = file.size ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : '1.8 MB';
        setSelectedUploadFile({ name: file.name, size: sizeMb });
      }
    } catch {
      Alert.alert('File Picker', 'Could not open document picker.');
    }
  };

  // Submit PDF Note
  const handleConfirmPdfUpload = async () => {
    if (!pdfUploadTitle.trim()) {
      Alert.alert('Required', 'Please enter a title for the study document.');
      return;
    }
    const fileName = selectedUploadFile?.name || `${pdfUploadTitle.replace(/\s+/g, '_')}.pdf`;
    const fileSize = selectedUploadFile?.size || '2.4 MB';
    await uploadPDFMaterial(pdfUploadTitle, pdfUploadSubject, pdfUploadCategory, fileName, fileSize);
    setIsUploadingPdf(false);
    setPdfUploadTitle('');
    setSelectedUploadFile(null);
    Alert.alert('PDF Material Published! 📚', 'All batch students can now download and view.');
  };

  // Trigger PDF Generation and Share
  const handleDownloadPDF = async (pdfItem: PDFMaterialItem) => {
    // Check if matched in catalog
    const matched = DUMMY_PDF_CATALOG.find(
      doc => doc.title.toLowerCase().includes(pdfItem.title.toLowerCase()) || doc.subject === pdfItem.subject
    ) || DUMMY_PDF_CATALOG[0];

    await generateAndSharePDF({
      ...matched,
      title: pdfItem.title,
      subject: pdfItem.subject,
      author: pdfItem.author,
      category: pdfItem.category,
    });
  };

  // Open PDF Preview
  const handleOpenPreview = (pdfItem: PDFMaterialItem) => {
    const matched = DUMMY_PDF_CATALOG.find(
      doc => doc.title.toLowerCase().includes(pdfItem.title.toLowerCase()) || doc.subject === pdfItem.subject
    ) || DUMMY_PDF_CATALOG[0];

    setPreviewDoc({
      ...matched,
      title: pdfItem.title,
      subject: pdfItem.subject,
      author: pdfItem.author,
      category: pdfItem.category,
    });
  };

  // Filter Doubts
  const filteredPosts = communityPosts.filter(p => {
    const matchesSubject = selectedSubject === 'All' || p.subject === selectedSubject;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  // Filter PDFs
  const filteredPdfs = pdfMaterials.filter(pdf => {
    const matchesCategory =
      selectedPdfCategory === 'all' || pdf.category === selectedPdfCategory;
    const matchesSubject = selectedSubject === 'All' || pdf.subject === selectedSubject;
    const matchesSearch =
      pdf.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pdf.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSubject && matchesSearch;
  });

  return (
    <ScreenWrapper
      headerProps={{
        title: 'Community & Resources 🌸',
        onBackPress: () => router.back(),
      }}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-4 pb-16">
        {/* Main Tabs Toggle */}
        <View className="flex-row bg-white p-1 rounded-2xl border-2 border-cute-border shadow-xs">
          <TouchableOpacity
            onPress={() => setActiveTab('doubts')}
            className={`flex-1 py-2.5 rounded-xl flex-row items-center justify-center gap-1.5 ${
              activeTab === 'doubts' ? 'bg-cute-peach' : ''
            }`}
          >
            <MessageSquare size={14} color={activeTab === 'doubts' ? '#ffffff' : '#7d6f6a'} />
            <Text
              className={`text-xs font-black ${
                activeTab === 'doubts' ? 'text-white' : 'text-cute-muted'
              }`}
            >
              Doubts & Discussion
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('library')}
            className={`flex-1 py-2.5 rounded-xl flex-row items-center justify-center gap-1.5 ${
              activeTab === 'library' ? 'bg-cute-peach' : ''
            }`}
          >
            <BookOpen size={14} color={activeTab === 'library' ? '#ffffff' : '#7d6f6a'} />
            <Text
              className={`text-xs font-black ${
                activeTab === 'library' ? 'text-white' : 'text-cute-muted'
              }`}
            >
              PDF Notes & DPPs
            </Text>
          </TouchableOpacity>
        </View>

        {/* Subject Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
          <View className="flex-row gap-1.5">
            {SUBJECTS.map(sub => (
              <TouchableOpacity
                key={sub}
                onPress={() => setSelectedSubject(sub)}
                className={`px-3 py-1.5 rounded-xl border ${
                  selectedSubject === sub
                    ? 'bg-cute-peach border-cute-peach'
                    : 'bg-white border-cute-border'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    selectedSubject === sub ? 'text-white' : 'text-cute-cocoa'
                  }`}
                >
                  {sub}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* ================= TAB 1: DOUBTS & FORUM ================= */}
        {activeTab === 'doubts' && (
          <View className="gap-4">
            {/* Ask a Doubt Action Box */}
            <View className="bg-white border-2 border-cute-border rounded-3xl p-5 shadow-xs">
              {!isAsking ? (
                <TouchableOpacity
                  onPress={() => setIsAsking(true)}
                  className="bg-cute-cream border border-cute-border rounded-2xl p-3 flex-row items-center justify-between"
                >
                  <View className="flex-row items-center gap-2.5">
                    <Text className="text-xl">🌸</Text>
                    <Text className="text-xs font-bold text-cute-muted">
                      Have a conceptual doubt? Ask your batch & faculty...
                    </Text>
                  </View>
                  <View className="bg-cute-peach w-7 h-7 rounded-xl items-center justify-center">
                    <Plus size={16} color="#ffffff" />
                  </View>
                </TouchableOpacity>
              ) : (
                <View className="gap-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-black text-cute-cocoa">Post a Doubt</Text>
                    <TouchableOpacity onPress={() => setIsAsking(false)}>
                      <X size={16} color="#a89993" />
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    placeholder="Short Title (e.g. Why does angular momentum remain constant?)"
                    placeholderTextColor="#a89993"
                    value={newTitle}
                    onChangeText={setNewTitle}
                    className="bg-cute-cream border border-cute-border rounded-2xl px-3.5 py-2 text-xs text-cute-cocoa font-bold"
                  />

                  <TextInput
                    placeholder="Explain what step or formula confuses you..."
                    placeholderTextColor="#a89993"
                    multiline
                    value={newContent}
                    onChangeText={setNewContent}
                    className="bg-cute-cream border border-cute-border rounded-2xl px-3.5 py-2.5 text-xs text-cute-cocoa min-h-[70px]"
                  />

                  {/* Attachment Pill */}
                  {attachedFileName ? (
                    <View className="bg-cute-peach-light border border-cute-peach px-3 py-1.5 rounded-xl flex-row items-center justify-between">
                      <View className="flex-row items-center gap-1.5 flex-1 pr-2">
                        <Paperclip size={13} color="#ff7d6b" />
                        <Text className="text-xs font-bold text-cute-peach" numberOfLines={1}>
                          {attachedFileName}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => setAttachedFileName(undefined)}>
                        <X size={13} color="#ff7d6b" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={handlePickDoubtAttachment}
                      className="flex-row items-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-cute-cream border border-cute-border self-start active:scale-98"
                    >
                      <Paperclip size={12} color="#7d6f6a" />
                      <Text className="text-[11px] font-bold text-cute-muted">
                        Attach Image / Diagram
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={handleSubmitDoubt}
                    className="bg-cute-peach py-2.5 rounded-2xl items-center shadow-xs active:scale-98 mt-1"
                  >
                    <Text className="text-xs font-black text-white">Post Doubt to Batch 🌸</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Doubts List */}
            {filteredPosts.map(post => (
              <View
                key={post.id}
                className="bg-white border-2 border-cute-border rounded-3xl p-5 shadow-xs gap-3"
              >
                {/* Author Info & Subject */}
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <View className="w-8 h-8 rounded-xl bg-cute-cream border border-cute-border items-center justify-center">
                      <Text className="text-sm">{post.avatarEmoji}</Text>
                    </View>
                    <View>
                      <Text className="text-xs font-black text-cute-cocoa">{post.author}</Text>
                      <Text className="text-[10px] text-cute-muted">
                        {post.role} • {post.timeAgo}
                      </Text>
                    </View>
                  </View>

                  <View className="bg-cute-peach-light border border-cute-peach px-2.5 py-0.5 rounded-full">
                    <Text className="text-[10px] font-bold text-cute-peach">{post.subject}</Text>
                  </View>
                </View>

                {/* Question Body */}
                <Text className="text-sm font-extrabold text-cute-cocoa leading-snug">
                  {post.title}
                </Text>
                <Text className="text-xs text-cute-muted leading-relaxed">
                  {post.content}
                </Text>

                {/* Attached File Indicator */}
                {post.attachmentName && (
                  <View className="bg-cute-cream border border-cute-border p-2 rounded-xl flex-row items-center gap-1.5">
                    <Paperclip size={12} color="#ff7d6b" />
                    <Text className="text-[11px] font-bold text-cute-cocoa">
                      {post.attachmentName}
                    </Text>
                  </View>
                )}

                {/* Teacher Verified Solution Badge */}
                {post.hasTeacherAnswer && post.teacherVerifiedText && (
                  <View className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 gap-1.5">
                    <View className="flex-row items-center gap-1.5">
                      <CheckCircle2 size={14} color="#059669" />
                      <Text className="text-xs font-black text-emerald-900">
                        Teacher Verified Answer • {post.teacherName}
                      </Text>
                    </View>
                    <Text className="text-xs text-emerald-950 leading-relaxed font-medium">
                      {post.teacherVerifiedText}
                    </Text>
                  </View>
                )}

                {/* Bottom Actions Bar */}
                <View className="flex-row items-center justify-between pt-2 border-t border-cute-border">
                  <TouchableOpacity
                    onPress={() => upvoteCommunityPost(post.id)}
                    className="flex-row items-center gap-1.5 bg-cute-cream px-3 py-1.5 rounded-xl border border-cute-border active:scale-95"
                  >
                    <ThumbsUp size={12} color="#ff7d6b" />
                    <Text className="text-xs font-bold text-cute-cocoa">
                      Helpful ({post.upvotes})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      Alert.prompt
                        ? Alert.prompt('Add Reply', 'Type your comment or answer:', text => {
                            if (text) addCommunityComment(post.id, text, userRole === 'teacher');
                          })
                        : Alert.alert('Reply', 'Community comments are active.')
                    }
                    className="flex-row items-center gap-1.5 px-3 py-1.5"
                  >
                    <MessageSquare size={13} color="#7d6f6a" />
                    <Text className="text-xs font-bold text-cute-muted">
                      {post.comments ? post.comments.length : 0} Replies
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ================= TAB 2: PDF RESOURCE LIBRARY ================= */}
        {activeTab === 'library' && (
          <View className="gap-4">
            {/* Category Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-1.5">
                {PDF_CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setSelectedPdfCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl border ${
                      selectedPdfCategory === cat.id
                        ? 'bg-cute-peach border-cute-peach'
                        : 'bg-white border-cute-border'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        selectedPdfCategory === cat.id ? 'text-white' : 'text-cute-cocoa'
                      }`}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Upload PDF Button for Faculty / Admins */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => setIsUploadingPdf(true)}
              className="bg-cute-cream border-2 border-dashed border-cute-peach p-4 rounded-3xl flex-row items-center justify-center gap-2 active:scale-98"
            >
              <Upload size={16} color="#ff7d6b" />
              <Text className="text-xs font-black text-cute-cocoa">
                + Upload New PDF Notes, Formula Sheet or DPP
              </Text>
            </TouchableOpacity>

            {/* PDF List */}
            {filteredPdfs.map(item => (
              <View
                key={item.id}
                className="bg-white border-2 border-cute-border rounded-3xl p-5 shadow-xs gap-3"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-row items-center gap-3 flex-1 pr-2">
                    <View className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 items-center justify-center shadow-xs">
                      <FileText size={22} color="#e11d48" />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-1.5 mb-0.5">
                        <Text className="text-sm font-black text-cute-cocoa leading-snug">
                          {item.title}
                        </Text>
                      </View>
                      <Text className="text-xs text-cute-muted" numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Meta details */}
                <View className="bg-cute-cream p-2.5 rounded-2xl border border-cute-border flex-row items-center justify-between text-xs">
                  <Text className="text-[11px] font-bold text-cute-cocoa">
                    {item.subject} • {item.fileSizeBytes}
                  </Text>
                  <Text className="text-[10px] text-cute-muted">By {item.author}</Text>
                </View>

                {/* Actions: Preview & Download */}
                <View className="flex-row gap-2 pt-1">
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={() => handleOpenPreview(item)}
                    className="flex-1 py-2.5 rounded-xl bg-cute-cream border border-cute-border flex-row items-center justify-center gap-1.5 active:scale-98"
                  >
                    <Eye size={13} color="#7d6f6a" />
                    <Text className="text-xs font-bold text-cute-cocoa">Quick Preview</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={() => handleDownloadPDF(item)}
                    className="flex-1 py-2.5 rounded-xl bg-cute-peach flex-row items-center justify-center gap-1.5 shadow-xs active:scale-98"
                  >
                    <Download size={13} color="#ffffff" />
                    <Text className="text-xs font-bold text-white">Download / Share PDF</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ================= MODAL 1: PDF QUICK PREVIEW ================= */}
      <Modal
        visible={previewDoc !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setPreviewDoc(null)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-[36px] max-h-[85%] border-t-2 border-cute-border p-6 shadow-2xl">
            {/* Header */}
            <View className="flex-row items-center justify-between pb-3 border-b border-cute-border">
              <View className="flex-1 pr-3">
                <Text className="text-base font-black text-cute-cocoa leading-tight">
                  {previewDoc?.title}
                </Text>
                <Text className="text-xs text-cute-peach font-bold mt-0.5">
                  {previewDoc?.subject} • {previewDoc?.author}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setPreviewDoc(null)}
                className="w-8 h-8 rounded-full bg-cute-cream items-center justify-center border border-cute-border"
              >
                <X size={16} color="#7d6f6a" />
              </TouchableOpacity>
            </View>

            {/* Document Content Scroll */}
            <ScrollView showsVerticalScrollIndicator={false} className="py-4">
              <View className="bg-cute-peach-light p-3 rounded-2xl border border-cute-peach mb-4">
                <Text className="text-xs font-bold text-cute-cocoa">
                  📑 Verified Classroom Study Document
                </Text>
                <Text className="text-[11px] text-cute-muted mt-0.5">
                  Formatted for NEET & JEE Advanced batch curriculum.
                </Text>
              </View>

              {previewDoc?.sections.map((sec, idx) => (
                <View
                  key={idx}
                  className="bg-cute-cream p-4 rounded-2xl border border-cute-border mb-3"
                >
                  <Text className="text-xs font-black text-cute-cocoa pb-2 mb-2 border-b border-cute-border">
                    {sec.heading}
                  </Text>
                  <View className="gap-1.5">
                    {sec.items.map((it, i) => (
                      <View key={i} className="flex-row items-start gap-2">
                        <Text className="text-xs text-cute-peach font-bold">•</Text>
                        <Text className="text-xs text-cute-cocoa font-medium flex-1 leading-relaxed">
                          {it}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Download Button */}
            <TouchableOpacity
              onPress={() => {
                if (previewDoc) generateAndSharePDF(previewDoc);
              }}
              className="bg-cute-peach py-3.5 rounded-2xl items-center flex-row justify-center gap-2 shadow-xs active:scale-98"
            >
              <Download size={15} color="#ffffff" />
              <Text className="text-xs font-black text-white">
                Download & Save to Files
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL 2: UPLOAD PDF MATERIAL ================= */}
      <Modal
        visible={isUploadingPdf}
        transparent
        animationType="fade"
        onRequestClose={() => setIsUploadingPdf(false)}
      >
        <View className="flex-1 bg-black/40 items-center justify-center p-5">
          <View className="bg-white rounded-[32px] p-6 w-full max-w-sm border-2 border-cute-border shadow-lg">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-black text-cute-cocoa">Upload Study PDF</Text>
              <TouchableOpacity onPress={() => setIsUploadingPdf(false)}>
                <X size={18} color="#a89993" />
              </TouchableOpacity>
            </View>

            <View className="gap-3 mb-5">
              <View>
                <Text className="text-xs font-bold text-cute-cocoa mb-1">Document Title</Text>
                <TextInput
                  placeholder="e.g. Thermodynamics Cheat Sheet"
                  placeholderTextColor="#a89993"
                  value={pdfUploadTitle}
                  onChangeText={setPdfUploadTitle}
                  className="bg-cute-cream border border-cute-border rounded-2xl px-3.5 py-2 text-xs text-cute-cocoa"
                />
              </View>

              <View>
                <Text className="text-xs font-bold text-cute-cocoa mb-1">Subject</Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {['Physics', 'Chemistry', 'Mathematics', 'Biology'].map(sub => (
                    <TouchableOpacity
                      key={sub}
                      onPress={() => setPdfUploadSubject(sub)}
                      className={`px-3 py-1.5 rounded-xl border ${
                        pdfUploadSubject === sub
                          ? 'bg-cute-peach border-cute-peach'
                          : 'bg-cute-cream border-cute-border'
                      }`}
                    >
                      <Text
                        className={`text-[11px] font-bold ${
                          pdfUploadSubject === sub ? 'text-white' : 'text-cute-cocoa'
                        }`}
                      >
                        {sub}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View>
                <Text className="text-xs font-bold text-cute-cocoa mb-1">Category</Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {[
                    { id: 'formula_sheet', name: 'Formula Sheet' },
                    { id: 'notes', name: 'Notes' },
                    { id: 'pyq', name: 'PYQ' },
                    { id: 'dpp', name: 'DPP' },
                  ].map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setPdfUploadCategory(cat.id as any)}
                      className={`px-2.5 py-1.5 rounded-xl border ${
                        pdfUploadCategory === cat.id
                          ? 'bg-cute-peach border-cute-peach'
                          : 'bg-cute-cream border-cute-border'
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${
                          pdfUploadCategory === cat.id ? 'text-white' : 'text-cute-cocoa'
                        }`}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Pick File Button */}
              <TouchableOpacity
                onPress={handlePickNoteFile}
                className="bg-cute-cream border border-cute-border p-3 rounded-2xl flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-2">
                  <FileText size={16} color="#ff7d6b" />
                  <Text className="text-xs font-bold text-cute-cocoa" numberOfLines={1}>
                    {selectedUploadFile ? selectedUploadFile.name : 'Select PDF File (Device)'}
                  </Text>
                </View>
                <Text className="text-[10px] font-bold text-cute-peach">Browse</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleConfirmPdfUpload}
              className="bg-cute-peach py-3 rounded-2xl items-center shadow-xs active:scale-98"
            >
              <Text className="text-xs font-black text-white">Publish PDF to Batch 🌸</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}
