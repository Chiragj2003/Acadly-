import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
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
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper, Badge } from '@/components/ui';
import { useInstitute } from '@/context/InstituteContext';
import { CUTE_STUDY_NOTES, StudyNote } from '@/data/dummyAcademicData';

interface DiscussionPost {
  id: string;
  author: string;
  role: string;
  avatarEmoji: string;
  timeAgo: string;
  subject: string;
  title: string;
  content: string;
  upvotes: number;
  repliesCount: number;
  hasTeacherAnswer: boolean;
  teacherVerifiedText?: string;
  teacherName?: string;
}

const SAMPLE_POSTS: DiscussionPost[] = [
  {
    id: 'post-1',
    author: 'Amelia Sharma',
    role: 'Student',
    avatarEmoji: '🌸',
    timeAgo: '2h ago',
    subject: 'Physics',
    title: 'Why is electric field inside a hollow spherical conductor strictly zero?',
    content: 'In Gauss law we take a Gaussian sphere inside radius R. Since enclosed charge q=0, flux is 0. But how does charge on the outer shell cancel out the field at EVERY non-central point?',
    upvotes: 14,
    repliesCount: 4,
    hasTeacherAnswer: true,
    teacherName: 'Prof. Vikram Joshi (Physics Dept)',
    teacherVerifiedText: 'Great conceptual doubt! By inverse-square law, a larger patch of surface charge further away subtends the exact same solid angle as a smaller, closer patch. Their fields cancel vectorially everywhere inside!',
  },
  {
    id: 'post-2',
    author: 'Rohan Mehra',
    role: 'Student',
    avatarEmoji: '🚀',
    timeAgo: '5h ago',
    subject: 'Mathematics',
    title: 'Quick trick for evaluating limits with [1^infinity] form?',
    content: 'Whenever limit as x->a of [f(x)]^g(x) gives 1^inf, can we directly write e^lim [g(x) * (f(x) - 1)]?',
    upvotes: 9,
    repliesCount: 2,
    hasTeacherAnswer: true,
    teacherName: 'Prof. Meera Sen (Maths Dept)',
    teacherVerifiedText: 'Yes! That standard exponential identity holds whenever f(x) -> 1 and g(x) -> ∞. Always verify both conditions before applying.',
  },
];

export default function CommunityScreen() {
  const router = useRouter();
  const { currentInstitute } = useInstitute();
  const [activeTab, setActiveTab] = useState<'doubts' | 'library'>('doubts');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<DiscussionPost[]>(SAMPLE_POSTS);
  const [newQuestionTitle, setNewQuestionTitle] = useState('');
  const [newQuestionContent, setNewQuestionContent] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  const handleUpvote = (postId: string) => {
    setPosts(prev =>
      prev.map(p => (p.id === postId ? { ...p, upvotes: p.upvotes + 1 } : p))
    );
  };

  const handlePostQuestion = () => {
    if (!newQuestionTitle.trim() || !newQuestionContent.trim()) {
      Alert.alert('Validation Error', 'Please enter a title and description for your question.');
      return;
    }

    const newPost: DiscussionPost = {
      id: `post-${Date.now()}`,
      author: 'Amelia Sharma (You)',
      role: 'Student',
      avatarEmoji: '🌸',
      timeAgo: 'Just now',
      subject: selectedSubject === 'All' ? 'Physics' : selectedSubject,
      title: newQuestionTitle,
      content: newQuestionContent,
      upvotes: 1,
      repliesCount: 0,
      hasTeacherAnswer: false,
    };

    setPosts([newPost, ...posts]);
    setNewQuestionTitle('');
    setNewQuestionContent('');
    setIsAsking(false);
    Alert.alert('Question Posted! 🌸', 'Your teachers and classmates will be notified.');
  };

  return (
    <ScreenWrapper
      headerProps={{
        title: 'Community & Notes Hub 🌸',
        instituteName: currentInstitute?.name || 'Bloom Academy',
        onBackPress: () => router.back(),
      }}
    >
      {/* Dual Tab Navigator */}
      <View className="flex-row bg-white p-1.5 rounded-[22px] border-2 border-cute-border mb-4 shadow-xs">
        <TouchableOpacity
          onPress={() => setActiveTab('doubts')}
          className={`flex-1 py-2.5 rounded-2xl items-center ${
            activeTab === 'doubts' ? 'bg-cute-peach shadow-xs' : ''
          }`}
        >
          <Text className={`text-xs font-black ${activeTab === 'doubts' ? 'text-white' : 'text-cute-muted'}`}>
            Doubt Discussions 💬
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('library')}
          className={`flex-1 py-2.5 rounded-2xl items-center ${
            activeTab === 'library' ? 'bg-cute-peach shadow-xs' : ''
          }`}
        >
          <Text className={`text-xs font-black ${activeTab === 'library' ? 'text-white' : 'text-cute-muted'}`}>
            PDF Notes Library 📚
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: DISCUSSIONS & DOUBTS */}
      {activeTab === 'doubts' && (
        <View>
          {/* Ask Question Bar */}
          <TouchableOpacity
            onPress={() => setIsAsking(!isAsking)}
            className="bg-cute-peach-light border-2 border-cute-peach rounded-[24px] p-4 flex-row items-center justify-between mb-4 shadow-xs"
          >
            <View className="flex-row items-center gap-2.5">
              <View className="w-9 h-9 rounded-full bg-white items-center justify-center border border-cute-peach">
                <Plus size={18} color="#ff7d6b" />
              </View>
              <View>
                <Text className="text-xs font-black text-cute-cocoa">Have a study doubt?</Text>
                <Text className="text-[10px] text-cute-muted">Ask teachers and peers in your batch</Text>
              </View>
            </View>
            <Text className="text-xs font-bold text-cute-peach">{isAsking ? 'Close ✕' : 'Ask Now →'}</Text>
          </TouchableOpacity>

          {/* New Question Form */}
          {isAsking && (
            <View className="bg-white border-2 border-cute-border rounded-[24px] p-4 mb-4 shadow-xs">
              <Text className="text-xs font-bold text-cute-cocoa mb-1">Question Title</Text>
              <TextInput
                placeholder="e.g. How does photosynthesis light reaction generate ATP?"
                placeholderTextColor="#a89993"
                value={newQuestionTitle}
                onChangeText={setNewQuestionTitle}
                className="bg-cute-cream border border-cute-border rounded-xl px-3 py-2 text-xs text-cute-cocoa mb-3 font-medium"
              />

              <Text className="text-xs font-bold text-cute-cocoa mb-1">Detailed Explanation / Formula</Text>
              <TextInput
                placeholder="Describe what you tried or where you got stuck..."
                placeholderTextColor="#a89993"
                multiline
                numberOfLines={3}
                value={newQuestionContent}
                onChangeText={setNewQuestionContent}
                className="bg-cute-cream border border-cute-border rounded-xl px-3 py-2 text-xs text-cute-cocoa mb-3 font-medium"
              />

              <TouchableOpacity
                onPress={handlePostQuestion}
                className="bg-cute-peach py-2.5 rounded-xl items-center shadow-xs"
              >
                <Text className="text-xs font-bold text-white">Post to Batch 🚀</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Discussion Posts Feed */}
          <View className="gap-3 mb-6">
            {posts.map((post) => (
              <View
                key={post.id}
                className="bg-white border-2 border-cute-border rounded-[26px] p-4 shadow-xs"
              >
                {/* Author Bar */}
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-2">
                    <View className="w-8 h-8 rounded-full bg-cute-cream border border-cute-border items-center justify-center">
                      <Text className="text-sm">{post.avatarEmoji}</Text>
                    </View>
                    <View>
                      <Text className="text-xs font-bold text-cute-cocoa">{post.author}</Text>
                      <Text className="text-[10px] text-cute-muted">{post.subject} • {post.timeAgo}</Text>
                    </View>
                  </View>

                  <View className="bg-cute-cream px-2 py-0.5 rounded-full border border-cute-border">
                    <Text className="text-[10px] font-bold text-cute-muted">{post.subject}</Text>
                  </View>
                </View>

                {/* Content */}
                <Text className="text-sm font-extrabold text-cute-cocoa mb-1">{post.title}</Text>
                <Text className="text-xs text-cute-muted leading-relaxed mb-3">{post.content}</Text>

                {/* Teacher Verified Answer Highlight */}
                {post.hasTeacherAnswer && (
                  <View className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-3 mb-3">
                    <View className="flex-row items-center gap-1.5 mb-1">
                      <CheckCircle2 size={14} color="#166534" />
                      <Text className="text-[11px] font-black text-emerald-900">
                        Teacher Verified Answer • {post.teacherName}
                      </Text>
                    </View>
                    <Text className="text-xs text-emerald-950 leading-relaxed font-medium">
                      {post.teacherVerifiedText}
                    </Text>
                  </View>
                )}

                {/* Footer Actions */}
                <View className="flex-row items-center justify-between pt-2 border-t border-cute-border">
                  <TouchableOpacity
                    onPress={() => handleUpvote(post.id)}
                    className="flex-row items-center gap-1.5 bg-cute-cream px-3 py-1 rounded-full border border-cute-border active:scale-95"
                  >
                    <ThumbsUp size={12} color="#ff7d6b" />
                    <Text className="text-xs font-bold text-cute-cocoa">{post.upvotes} Upvotes</Text>
                  </TouchableOpacity>

                  <View className="flex-row items-center gap-1 text-cute-muted">
                    <MessageSquare size={13} color="#7d6f6a" />
                    <Text className="text-xs font-semibold text-cute-muted">{post.repliesCount} replies</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* TAB 2: PDF & NOTES LIBRARY */}
      {activeTab === 'library' && (
        <View>
          {/* Search Bar */}
          <View className="bg-white border-2 border-cute-border rounded-2xl px-3 py-2 flex-row items-center gap-2 mb-4 shadow-xs">
            <Search size={16} color="#7d6f6a" />
            <TextInput
              placeholder="Search PDF notes, formula sheets, PYQs..."
              placeholderTextColor="#a89993"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-xs text-cute-cocoa font-medium"
            />
          </View>

          {/* Categorized PDF List */}
          <View className="gap-3 mb-6">
            {CUTE_STUDY_NOTES.map((note) => (
              <View
                key={note.id}
                style={{ backgroundColor: note.colorBg, borderColor: note.colorBorder }}
                className="p-4 rounded-[26px] border-2 shadow-xs"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-2xl">{note.emoji}</Text>
                    <View>
                      <Text className="text-xs font-bold text-cute-cocoa">{note.title}</Text>
                      <Text className="text-[10px] text-cute-muted">{note.author} • {note.chapter}</Text>
                    </View>
                  </View>

                  <View style={{ backgroundColor: note.badgeColor }} className="px-2 py-0.5 rounded-full">
                    <Text className="text-[10px] font-bold text-cute-cocoa">{note.badge}</Text>
                  </View>
                </View>

                <Text className="text-xs text-cute-muted mb-3" numberOfLines={2}>
                  {note.subtitle}
                </Text>

                <View className="flex-row items-center justify-between pt-2 border-t border-black/5">
                  <Text className="text-[11px] font-bold text-cute-muted">{note.fileSizeBytes}</Text>
                  <TouchableOpacity
                    onPress={() => Alert.alert('PDF Viewer', `Opening ${note.title} in offline PDF reader`)}
                    className="bg-white px-3 py-1.5 rounded-xl border border-cute-border flex-row items-center gap-1 shadow-xs"
                  >
                    <Download size={12} color="#ff7d6b" />
                    <Text className="text-xs font-bold text-cute-peach">Read / Save PDF</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScreenWrapper>
  );
}
