import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import {
  MessageSquare,
  Search,
  Plus,
  BookOpen,
  ArrowLeft,
  Upload,
} from 'lucide-react-native';
import {
  ScreenWrapper,
  ListLoadingSkeleton,
  ListEmptyState,
  ListErrorState,
} from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import {
  useCommunityPosts,
  useCreateCommunityPost,
  useUpvoteCommunityPost,
  useStudyMaterials,
  useUploadMaterial,
} from '@/hooks/queries';
import { type CommunityPost } from '@/types/database';
import { AskQuestionModal } from '@/components/screens/community/AskQuestionModal';
import { UploadPdfModal } from '@/components/screens/community/UploadPdfModal';
import { CommunityPostItem } from '@/components/screens/community/CommunityPostItem';

const SUBJECTS = ['All', 'Physics', 'Mathematics', 'Chemistry', 'Biology'];

export default function PinterestCommunityScreen() {
  const router = useRouter();
  const { user, userRole, activeInstitute } = useAuth();

  const {
    data: communityPosts = [],
    isLoading: postsLoading,
    error: postsError,
    refetch: refetchPosts,
  } = useCommunityPosts(activeInstitute?.id);

  const {
    data: pdfMaterials = [],
    isLoading: libraryLoading,
    error: libraryError,
    refetch: refetchLibrary,
  } = useStudyMaterials(activeInstitute?.id);

  const createPostMutation = useCreateCommunityPost();
  const upvotePostMutation = useUpvoteCommunityPost();
  const uploadMaterialMutation = useUploadMaterial();

  const [activeTab, setActiveTab] = useState<'doubts' | 'library'>('doubts');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAsking, setIsAsking] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  // Filtered posts
  const filteredPosts = useMemo(() => {
    return communityPosts
      .filter((p) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q);
        }
        return true;
      })
      .slice(0, 30); // Cursor / initial 30 limit
  }, [communityPosts, searchQuery]);

  const handleUpvote = async (postId: string) => {
    if (!user?.id) return;
    try {
      await upvotePostMutation.mutateAsync({
        postId,
        userId: user.id,
        instituteId: activeInstitute?.id,
      });
    } catch {
      // Handled by optimistic update
    }
  };

  const handleAskQuestion = async (data: {
    title: string;
    content: string;
    subject: string;
    fileUri?: string;
    fileName?: string;
  }) => {
    if (!activeInstitute?.id || !user?.id) {
      Alert.alert('Not ready', 'Join an institute before posting.');
      return;
    }
    try {
      await createPostMutation.mutateAsync({
        instituteId: activeInstitute.id,
        authorId: user.id,
        authorName: user?.full_name || 'Community Member',
        authorRole: (userRole as 'student' | 'teacher') || 'student',
        title: data.title,
        content: data.content,
        subject: data.subject,
        attachmentUrl: data.fileUri,
        attachmentName: data.fileName,
      });
      Alert.alert('Success', 'Question posted to community forum!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to post question';
      Alert.alert('Error', msg);
    }
  };

  const handleUploadPdf = async (data: {
    title: string;
    subject: string;
    category: string;
    fileUri: string;
    fileName: string;
  }) => {
    if (!activeInstitute?.id || !user?.id) {
      Alert.alert('Not ready', 'Join an institute before uploading.');
      return;
    }
    try {
      await uploadMaterialMutation.mutateAsync({
        fileUri: data.fileUri,
        fileName: data.fileName,
        title: data.title,
        instituteId: activeInstitute.id,
        category: data.category,
        uploadedBy: user.id,
      });
      Alert.alert('Success', 'Study material uploaded to library!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      Alert.alert('Error', msg);
    }
  };

  return (
    <ScreenWrapper>
      {/* Top Header */}
      <View className="px-4 pt-3 pb-2 border-b border-slate-200">
        <View className="flex-row items-center justify-between mb-2.5">
          <View className="flex-row items-center gap-2">
            <TouchableOpacity onPress={() => router.back()} className="p-1">
              <ArrowLeft size={18} color="#1C1C1E" />
            </TouchableOpacity>
            <View>
              <Text className="text-base font-display text-slate-900">Academic Forum & Library</Text>
              <Text className="text-[10px] text-slate-500">Peer discussions & shared study files</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            {activeTab === 'doubts' ? (
              <TouchableOpacity
                onPress={() => setIsAsking(true)}
                className="bg-ink h-11 px-4 rounded-full flex-row items-center gap-1.5 active:opacity-90"
              >
                <Plus size={14} color="white" />
                <Text className="text-sm font-sans-bold text-white">Ask a doubt</Text>
              </TouchableOpacity>
            ) : (
              (userRole === 'teacher' || userRole === 'admin') && (
                <TouchableOpacity
                  onPress={() => setIsUploadingPdf(true)}
                  className="bg-ink h-11 px-4 rounded-full flex-row items-center gap-1.5 active:opacity-90"
                >
                  <Upload size={14} color="white" />
                  <Text className="text-xs font-sans-bold text-white">Upload PDF</Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>

        {/* Tab Switcher */}
        <View className="flex-row bg-slate-100 p-1 rounded-2xl mb-2">
          <TouchableOpacity
            onPress={() => setActiveTab('doubts')}
            className={`flex-1 py-2 rounded-xl items-center ${
              activeTab === 'doubts' ? 'bg-white shadow-xs' : ''
            }`}
          >
            <Text
              className={`text-xs font-sans-bold ${
                activeTab === 'doubts' ? 'text-blue-900' : 'text-slate-600'
              }`}
            >
              Doubts & Discussions ({communityPosts.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('library')}
            className={`flex-1 py-2 rounded-xl items-center ${
              activeTab === 'library' ? 'bg-white shadow-xs' : ''
            }`}
          >
            <Text
              className={`text-xs font-sans-bold ${
                activeTab === 'library' ? 'text-blue-900' : 'text-slate-600'
              }`}
            >
              PDF Library ({pdfMaterials.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2">
          <Search size={14} color="#8C877E" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={activeTab === 'doubts' ? 'Search questions or topics...' : 'Search formula sheets, notes...'}
            className="flex-1 ml-2 text-xs text-slate-800"
          />
        </View>
      </View>

      {/* Main FlashList Content */}
      <View className="flex-1 px-4 pt-3">
        {activeTab === 'doubts' ? (
          postsLoading ? (
            <ListLoadingSkeleton count={4} height={120} />
          ) : postsError ? (
            <ListErrorState
              message={(postsError as Error).message}
              onRetry={() => refetchPosts()}
            />
          ) : filteredPosts.length === 0 ? (
            <ListEmptyState
              title="No Doubts or Questions Found"
              description="Be the first to post a question or topic for your batch peers and teachers!"
              actionLabel="Ask a Question"
              onAction={() => setIsAsking(true)}
            />
          ) : (
            <FlashList
              data={filteredPosts}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <CommunityPostItem
                  post={item}
                  hero={index === 0 && !item.hasTeacherAnswer}
                  onUpvote={handleUpvote}
                  onOpenComments={(post) =>
                    // Show the real replies (this used to be a placeholder alert).
                    Alert.alert(
                      post.title,
                      post.comments.length === 0
                        ? 'No replies yet.'
                        : post.comments
                            .map((c) => `${c.author}${c.role === 'teacher' ? ' (teacher)' : ''}: ${c.text}`)
                            .join('\n\n')
                    )
                  }
                />
              )}
            />
          )
        ) : (
          libraryLoading ? (
            <ListLoadingSkeleton count={4} height={80} />
          ) : libraryError ? (
            <ListErrorState
              message={(libraryError as Error).message}
              onRetry={() => refetchLibrary()}
            />
          ) : pdfMaterials.length === 0 ? (
            <ListEmptyState
              title="No Study Materials Yet"
              description="Uploaded PDF lecture notes, DPPs, and formula sheets will appear here."
            />
          ) : (
            <FlashList
              data={pdfMaterials.slice(0, 30)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View className="bg-white border border-slate-200 rounded-2xl p-3.5 mb-2.5 flex-row items-center justify-between shadow-xs">
                  <View className="flex-1 mr-2">
                    <Text className="text-xs font-sans-bold text-slate-900">{item.title}</Text>
                    <Text className="text-[11px] text-slate-500">
                      {item.subject} • {item.category || 'Notes'}
                    </Text>
                  </View>
                  <View className="bg-blue-50 px-2 py-1 rounded-lg border border-blue-200">
                    <Text className="text-[10px] font-sans-bold text-blue-700">PDF</Text>
                  </View>
                </View>
              )}
            />
          )
        )}
      </View>

      <AskQuestionModal
        visible={isAsking}
        onClose={() => setIsAsking(false)}
        subjects={SUBJECTS.filter((s) => s !== 'All')}
        onSubmit={handleAskQuestion}
        loading={createPostMutation.isPending}
      />

      <UploadPdfModal
        visible={isUploadingPdf}
        onClose={() => setIsUploadingPdf(false)}
        onSubmit={handleUploadPdf}
        loading={uploadMaterialMutation.isPending}
      />
    </ScreenWrapper>
  );
}
