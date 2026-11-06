import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
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
  Plus,
  Paperclip,
  Eye,
  X,
  Upload,
  Check,
  Send,
  Award,
  Star,
  ShieldCheck,
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { ScreenWrapper, Badge } from '@/components/ui';
import { DocumentReaderModal } from '@/components/academic';
import { useAcademic, CommunityPost, PDFMaterialItem } from '@/context/AcademicContext';
import { useAuth } from '@/context/AuthContext';
import {
  DUMMY_PDF_CATALOG,
  PDFDocumentContent,
  generateAndSharePDF,
} from '@/services/dummyPdfService';

const SUBJECTS = ['All', 'Physics', 'Mathematics', 'Chemistry', 'Biology'];

const PDF_CATEGORIES: { id: 'all' | 'notes' | 'formula_sheet' | 'pyq' | 'dpp'; label: string }[] = [
  { id: 'all', label: 'All Resources' },
  { id: 'formula_sheet', label: 'Formula Sheets' },
  { id: 'notes', label: 'Handwritten Notes' },
  { id: 'pyq', label: 'Solved PYQs' },
  { id: 'dpp', label: 'Daily DPPs' },
];

export default function PinterestCommunityScreen() {
  const router = useRouter();
  const { userRole } = useAuth();
  const {
    communityPosts,
    addCommunityPost,
    upvoteCommunityPost,
    addCommunityComment,
    verifyCommunityComment,
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

  // Active Discussion Modal (Replies & Teacher Verification)
  const [activeDiscussionPost, setActiveDiscussionPost] = useState<CommunityPost | null>(null);
  const [newReplyText, setNewReplyText] = useState('');

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
    Alert.alert('Question Published! 🎓', 'Your peer group and teachers have been notified in the forum.');
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
    Alert.alert('PDF Published! 📄', 'Now accessible in the batch library.');
  };

  // Submit Reply
  const handleSubmitReply = async () => {
    if (!activeDiscussionPost || !newReplyText.trim()) return;
    await addCommunityComment(activeDiscussionPost.id, newReplyText.trim(), userRole === 'teacher');
    setNewReplyText('');
    // refresh active discussion post
    const updated = communityPosts.find((p) => p.id === activeDiscussionPost.id);
    if (updated) {
      setActiveDiscussionPost(updated);
    }
  };

  // Toggle Verification on Comment
  const handleToggleVerifyComment = async (commentId: string) => {
    if (!activeDiscussionPost) return;
    verifyCommunityComment(activeDiscussionPost.id, commentId);
    const updated = communityPosts.find((p) => p.id === activeDiscussionPost.id);
    if (updated) {
      setActiveDiscussionPost(updated);
    }
  };

  // Filter Doubts
  const filteredPosts = communityPosts.filter((p) => {
    const matchesSubject = selectedSubject === 'All' || p.subject.toLowerCase() === selectedSubject.toLowerCase();
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  // Filter Library Items
  const filteredLibrary = pdfMaterials.filter((item) => {
    const matchesSubject = selectedSubject === 'All' || item.subject.toLowerCase() === selectedSubject.toLowerCase();
    const matchesCategory = selectedPdfCategory === 'all' || item.category === selectedPdfCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesCategory && matchesSearch;
  });

  return (
    <ScreenWrapper
      scrollable={false}
      headerProps={{
        title: 'Community & Doubts',
        instituteName: 'Peer Doubt Wall & Library',
        onBackPress: () => router.back(),
      }}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }} contentContainerClassName="gap-3.5">
        {/* Sub-Tabs: Doubts Wall vs. Resource Library */}
        <View className="flex-row bg-white p-1 rounded-2xl border border-slate-200/90 shadow-xs">
          <TouchableOpacity
            onPress={() => setActiveTab('doubts')}
            className={`flex-1 py-2.5 rounded-xl items-center flex-row justify-center gap-1.5 ${
              activeTab === 'doubts' ? 'bg-blue-600' : ''
            }`}
          >
            <MessageSquare size={14} color={activeTab === 'doubts' ? '#ffffff' : '#64748B'} />
            <Text
              className={`text-xs font-bold ${
                activeTab === 'doubts' ? 'text-white' : 'text-slate-600'
              }`}
            >
              Doubts Wall ({communityPosts.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('library')}
            className={`flex-1 py-2.5 rounded-xl items-center flex-row justify-center gap-1.5 ${
              activeTab === 'library' ? 'bg-blue-600' : ''
            }`}
          >
            <BookOpen size={14} color={activeTab === 'library' ? '#ffffff' : '#64748B'} />
            <Text
              className={`text-xs font-bold ${
                activeTab === 'library' ? 'text-white' : 'text-slate-600'
              }`}
            >
              PDF Library ({pdfMaterials.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar & Subject Filter Pills */}
        <View className="gap-2.5">
          <View className="bg-white border border-slate-200/90 rounded-2xl px-3.5 py-2.5 flex-row items-center gap-2 shadow-xs">
            <Search size={16} color="#94a3b8" />
            <TextInput
              placeholder={activeTab === 'doubts' ? 'Search questions or concepts...' : 'Search formula sheets, notes, DPPs...'}
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-xs text-slate-800"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={14} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-1.5">
              {SUBJECTS.map((sub) => (
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
        </View>

        {/* ================= TAB 1: DOUBTS WALL ================= */}
        {activeTab === 'doubts' && (
          <View className="gap-3.5">
            {/* Ask Doubt Prompt Card */}
            <View className="bg-white border border-slate-200/90 rounded-3xl p-4 shadow-xs">
              {!isAsking ? (
                <TouchableOpacity
                  onPress={() => setIsAsking(true)}
                  className="flex-row items-center justify-between"
                >
                  <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                    <View className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center">
                      <Plus size={18} color="#2563EB" />
                    </View>
                    <Text className="text-xs font-semibold text-slate-500">
                      Have a conceptual doubt? Ask your batch & faculty...
                    </Text>
                  </View>
                  <View className="bg-blue-600 px-3 py-1.5 rounded-xl">
                    <Text className="text-xs font-bold text-white">Ask Doubt</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <View className="gap-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-bold text-slate-900">Post a Concept Doubt</Text>
                    <TouchableOpacity onPress={() => setIsAsking(false)}>
                      <X size={18} color="#64748B" />
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    placeholder="Short Title (e.g. Why is torque zero about center of mass?)"
                    placeholderTextColor="#94a3b8"
                    value={newTitle}
                    onChangeText={setNewTitle}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-bold"
                  />

                  <TextInput
                    placeholder="Describe which step or formula you need clarity on..."
                    placeholderTextColor="#94a3b8"
                    multiline
                    value={newContent}
                    onChangeText={setNewContent}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 min-h-[70px]"
                  />

                  {attachedFileName ? (
                    <View className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl flex-row items-center justify-between">
                      <View className="flex-row items-center gap-1.5 flex-1 pr-2">
                        <Paperclip size={13} color="#2563EB" />
                        <Text className="text-xs font-bold text-blue-700" numberOfLines={1}>
                          {attachedFileName}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => setAttachedFileName(undefined)}>
                        <X size={13} color="#2563EB" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={handlePickDoubtAttachment}
                      className="flex-row items-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-200 self-start active:scale-98"
                    >
                      <Paperclip size={13} color="#64748B" />
                      <Text className="text-xs font-semibold text-slate-600">
                        Attach Image / Diagram
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={handleSubmitDoubt}
                    className="bg-blue-600 py-2.5 rounded-xl items-center shadow-xs active:scale-98 mt-1"
                  >
                    <Text className="text-xs font-bold text-white">Post Doubt to Forum</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Doubts List */}
            {filteredPosts.map((post) => (
              <View
                key={post.id}
                className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <View className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 items-center justify-center">
                      <Text className="text-sm">{post.avatarEmoji}</Text>
                    </View>
                    <View>
                      <Text className="text-xs font-bold text-slate-900">{post.author}</Text>
                      <Text className="text-[10px] text-slate-400">
                        {post.role} • {post.timeAgo}
                      </Text>
                    </View>
                  </View>

                  <Badge label={post.subject} variant="info" />
                </View>

                <Text className="text-sm font-bold text-slate-900 leading-snug">{post.title}</Text>
                <Text className="text-xs text-slate-600 leading-relaxed">{post.content}</Text>

                {post.attachmentName && (
                  <View className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex-row items-center gap-2">
                    <Paperclip size={13} color="#2563EB" />
                    <Text className="text-xs font-bold text-slate-800">{post.attachmentName}</Text>
                  </View>
                )}

                {/* Teacher Verified Solution Badge */}
                {post.hasTeacherAnswer && post.teacherVerifiedText && (
                  <View className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 gap-1">
                    <View className="flex-row items-center gap-1.5">
                      <CheckCircle2 size={14} color="#059669" />
                      <Text className="text-xs font-bold text-emerald-900">
                        Teacher Verified Answer • {post.teacherName}
                      </Text>
                    </View>
                    <Text className="text-xs text-emerald-950 leading-relaxed">
                      {post.teacherVerifiedText}
                    </Text>
                  </View>
                )}

                {/* Bottom Actions Bar */}
                <View className="flex-row items-center justify-between pt-2.5 border-t border-slate-100">
                  <TouchableOpacity
                    onPress={() => upvoteCommunityPost(post.id)}
                    className="flex-row items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 active:scale-95"
                  >
                    <ThumbsUp size={12} color="#2563EB" />
                    <Text className="text-xs font-bold text-slate-700">Helpful ({post.upvotes})</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setActiveDiscussionPost(post)}
                    className="flex-row items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 active:scale-95"
                  >
                    <MessageSquare size={13} color="#2563EB" />
                    <Text className="text-xs font-bold text-blue-700">
                      {post.comments ? post.comments.length : 0} Replies →
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ================= TAB 2: PDF RESOURCE LIBRARY ================= */}
        {activeTab === 'library' && (
          <View className="gap-3.5">
            {/* Category Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-1.5">
                {PDF_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setSelectedPdfCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl border ${
                      selectedPdfCategory === cat.id
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        selectedPdfCategory === cat.id ? 'text-white' : 'text-slate-600'
                      }`}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Upload PDF Button (Teachers/Admins) */}
            <TouchableOpacity
              onPress={() => setIsUploadingPdf(true)}
              className="bg-white border border-slate-200/90 p-4 rounded-3xl flex-row items-center justify-between shadow-xs active:scale-98"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-2xl bg-emerald-50 items-center justify-center">
                  <Upload size={18} color="#059669" />
                </View>
                <View>
                  <Text className="text-xs font-bold text-slate-900">+ Upload Study PDF</Text>
                  <Text className="text-[11px] text-slate-500">Share formula sheets, DPPs & solved PYQs</Text>
                </View>
              </View>
              <View className="bg-emerald-600 px-3 py-1 rounded-xl">
                <Text className="text-xs font-bold text-white">Upload</Text>
              </View>
            </TouchableOpacity>

            {/* PDF List */}
            <View className="gap-3">
              {filteredLibrary.map((item, idx) => {
                const rating = idx % 2 === 0 ? '4.9' : '4.8';
                const downloads = idx === 0 ? '520+ downloads' : idx === 1 ? '380+ downloads' : '260+ downloads';

                return (
                  <View
                    key={item.id}
                    className="bg-white border border-slate-200/80 rounded-3xl p-4 shadow-xs gap-3"
                  >
                    {/* Top Row: Subject Pill + Trust Rating */}
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <View className="bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg">
                          <Text className="text-[10px] font-extrabold text-blue-700 uppercase">
                            {item.subject}
                          </Text>
                        </View>

                        <View className="flex-row items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/80">
                          <Star size={11} color="#F59E0B" fill="#F59E0B" />
                          <Text className="text-[10px] font-extrabold text-amber-800">
                            {rating}
                          </Text>
                          <Text className="text-[10px] text-amber-600 font-medium">
                            • {downloads}
                          </Text>
                        </View>
                      </View>

                      <View className="bg-slate-100 px-2 py-0.5 rounded-md">
                        <Text className="text-[10px] font-bold text-slate-600 uppercase">
                          {item.category.replace('_', ' ')}
                        </Text>
                      </View>
                    </View>

                    {/* Middle: Thumbnail + Title & Verified Author */}
                    <View className="flex-row gap-3 items-start">
                      <View className="w-14 h-16 rounded-2xl bg-slate-50 border border-slate-200 items-center justify-between py-2 shrink-0">
                        <FileText size={20} color="#2563EB" />
                        <View className="bg-slate-200/80 px-1.5 py-0.5 rounded">
                          <Text className="text-[8px] font-black text-slate-700 uppercase">
                            {item.fileSizeBytes}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-1 min-w-0">
                        <Text className="text-sm font-extrabold text-slate-900 leading-snug" numberOfLines={2}>
                          {item.title}
                        </Text>

                        <View className="flex-row items-center gap-1 mt-1">
                          <ShieldCheck size={12} color="#10B981" />
                          <Text className="text-[11px] font-semibold text-slate-600" numberOfLines={1}>
                            {item.author}
                          </Text>
                        </View>

                        <Text className="text-xs text-slate-500 mt-1 leading-relaxed" numberOfLines={2}>
                          {item.subtitle}
                        </Text>
                      </View>
                    </View>

                    {/* Bottom Action Row */}
                    <View className="flex-row gap-2 pt-2 border-t border-slate-100">
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => {
                          const matchedDoc = DUMMY_PDF_CATALOG.find((d) => d.subject.toLowerCase() === item.subject.toLowerCase()) || DUMMY_PDF_CATALOG[0];
                          setPreviewDoc(matchedDoc);
                        }}
                        className="flex-1 bg-blue-600 py-2.5 rounded-xl flex-row items-center justify-center gap-1.5 active:scale-95 shadow-xs"
                      >
                        <BookOpen size={14} color="#FFFFFF" />
                        <Text className="text-xs font-bold text-white">Read Document</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={async () => {
                          const matchedDoc = DUMMY_PDF_CATALOG.find((d) => d.subject.toLowerCase() === item.subject.toLowerCase()) || DUMMY_PDF_CATALOG[0];
                          await generateAndSharePDF(matchedDoc);
                        }}
                        className="flex-1 bg-slate-100 border border-slate-200/80 py-2.5 rounded-xl flex-row items-center justify-center gap-1.5 active:scale-95"
                      >
                        <Download size={14} color="#334155" />
                        <Text className="text-xs font-bold text-slate-700">Save PDF</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ================= MODAL: DISCUSSION REPLIES & TEACHER VERIFICATION ================= */}
      <Modal visible={!!activeDiscussionPost} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end bg-black/50"
        >
          <View className="bg-white rounded-t-3xl p-6 gap-3.5 max-h-[85%] border-t border-slate-200">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-2">
                <Text className="text-base font-extrabold text-slate-900" numberOfLines={1}>
                  {activeDiscussionPost?.title}
                </Text>
                <Text className="text-xs text-slate-500">
                  {activeDiscussionPost?.author} • {activeDiscussionPost?.subject}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setActiveDiscussionPost(null)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} className="max-h-64 gap-2">
              <Text className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                {activeDiscussionPost?.content}
              </Text>

              <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-2 mb-1">
                Replies ({activeDiscussionPost?.comments ? activeDiscussionPost.comments.length : 0}):
              </Text>

              {activeDiscussionPost?.comments && activeDiscussionPost.comments.length > 0 ? (
                activeDiscussionPost.comments.map((comment) => (
                  <View
                    key={comment.id}
                    className={`p-3 rounded-2xl border ${
                      comment.isTeacherVerified
                        ? 'bg-emerald-50 border-emerald-300'
                        : 'bg-slate-50 border-slate-200/80'
                    } gap-1 mb-1.5`}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-1.5">
                        <Text className="text-xs font-bold text-slate-900">{comment.author}</Text>
                        <Text className="text-[10px] text-slate-400">• {(comment as any).timeAgo || comment.createdAt}</Text>
                        {comment.isTeacherVerified && (
                          <View className="bg-emerald-200/70 px-1.5 py-0.2 rounded border border-emerald-300">
                            <Text className="text-[9px] font-bold text-emerald-900">Verified Answer ✅</Text>
                          </View>
                        )}
                      </View>

                      {userRole === 'teacher' && (
                        <TouchableOpacity
                          onPress={() => handleToggleVerifyComment(comment.id)}
                          className="bg-white border border-slate-200 px-2 py-0.5 rounded-lg active:scale-95"
                        >
                          <Text className="text-[10px] font-bold text-blue-600">
                            {comment.isTeacherVerified ? 'Unverify' : 'Verify ✅'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text className="text-xs text-slate-700 leading-relaxed">{comment.text}</Text>
                  </View>
                ))
              ) : (
                <Text className="text-xs text-slate-400 italic p-2">No replies yet. Be the first to answer!</Text>
              )}
            </ScrollView>

            {/* Reply Input Bar */}
            <View className="flex-row gap-2 pt-2 border-t border-slate-100">
              <TextInput
                placeholder={userRole === 'teacher' ? 'Write teacher solution / feedback...' : 'Write an answer or helpful hint...'}
                placeholderTextColor="#94a3b8"
                value={newReplyText}
                onChangeText={setNewReplyText}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800"
              />
              <TouchableOpacity
                onPress={handleSubmitReply}
                className="bg-blue-600 px-4 rounded-xl items-center justify-center active:scale-95"
              >
                <Send size={15} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= MODAL: UPLOAD PDF NOTE ================= */}
      <Modal visible={isUploadingPdf} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end bg-black/50"
        >
          <View className="bg-white rounded-t-3xl p-6 gap-3.5 max-h-[85%] border-t border-slate-200">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-extrabold text-slate-900">Upload PDF Study Material</Text>
              <TouchableOpacity onPress={() => setIsUploadingPdf(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} className="gap-3.5">
              <View>
                <Text className="text-xs font-bold text-slate-700 mb-1">Document Title</Text>
                <TextInput
                  placeholder="e.g. Organic Reaction Mechanisms Cheat Sheet"
                  placeholderTextColor="#94a3b8"
                  value={pdfUploadTitle}
                  onChangeText={setPdfUploadTitle}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-bold"
                />
              </View>

              <View>
                <Text className="text-xs font-bold text-slate-700 mb-1">Subject</Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {['Physics', 'Chemistry', 'Mathematics', 'Biology'].map((sub) => (
                    <TouchableOpacity
                      key={sub}
                      onPress={() => setPdfUploadSubject(sub)}
                      className={`px-3 py-1.5 rounded-xl border ${
                        pdfUploadSubject === sub ? 'bg-blue-600 border-blue-600' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Text className={`text-[11px] font-bold ${pdfUploadSubject === sub ? 'text-white' : 'text-slate-700'}`}>
                        {sub}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                onPress={handlePickNoteFile}
                className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-2 flex-1 pr-2">
                  <FileText size={18} color="#2563EB" />
                  <Text className="text-xs font-bold text-slate-800" numberOfLines={1}>
                    {selectedUploadFile ? selectedUploadFile.name : 'Select PDF from Device'}
                  </Text>
                </View>
                <Text className="text-xs font-bold text-blue-600">Browse</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmPdfUpload}
                className="bg-blue-600 py-3 rounded-2xl items-center shadow-xs mt-2 mb-4 active:scale-98"
              >
                <Text className="text-xs font-bold text-white">Publish PDF to Library</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* IN-APP DOCUMENT READER MODAL */}
      <DocumentReaderModal
        document={previewDoc}
        visible={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
      />
    </ScreenWrapper>
  );
}
