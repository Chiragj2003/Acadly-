import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useStudyMaterials } from '@/hooks/queries/useMaterialQueries';
import { openStudyMaterial } from '@/lib/openStudyMaterial';
import { type PDFMaterialItem } from '@/services/materialService';
import { ListEmptyState, ListErrorState, ListLoadingSkeleton, SectionTitle } from '@/components/ui';

interface StudentLibraryProps {
  instituteId?: string;
  batchId?: string;
}

const COVERS = ['bg-pastel-peach', 'bg-pastel-lilac', 'bg-pastel-mint', 'bg-pastel-pink', 'bg-pastel-sky', 'bg-pastel-butter'];

const SHELVES: { key: PDFMaterialItem['category']; title: string }[] = [
  { key: 'notes', title: 'Notes' },
  { key: 'dpp', title: 'DPP sheets' },
  { key: 'formula_sheet', title: 'Formula sheets' },
  { key: 'pyq', title: 'Past papers' },
];

/** Book-cover tile for one material; opens the real uploaded file. */
const Cover: React.FC<{ item: PDFMaterialItem; index: number }> = ({ item, index }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={`Open ${item.title}${item.subject ? `, ${item.subject}` : ''}`}
    onPress={() => openStudyMaterial(item.storagePath)}
    className="w-[96px] gap-2 active:opacity-80"
  >
    <View
      className={`h-[128px] rounded-l-md rounded-r-[14px] border-[1.5px] border-ink px-2 py-2.5 justify-between ${
        COVERS[index % COVERS.length]
      }`}
    >
      <Text className="font-serif text-ink text-sm leading-4" numberOfLines={4}>
        {item.title}
      </Text>
      {item.subject ? <Text className="font-sans-bold text-ink text-[9px] uppercase">{item.subject}</Text> : null}
    </View>
    <Text className="font-sans-semibold text-ink text-xs leading-4" numberOfLines={2}>
      {item.title}
    </Text>
  </Pressable>
);

/** Soft Desk library: the newest item as "continue", then a shelf per category. */
export const StudentLibrary: React.FC<StudentLibraryProps> = ({ instituteId, batchId }) => {
  const { data: materials = [], isLoading, error, refetch } = useStudyMaterials(instituteId, batchId);

  const shelves = useMemo(
    () => SHELVES.map((s) => ({ ...s, items: materials.filter((m) => m.category === s.key) })).filter((s) => s.items.length > 0),
    [materials]
  );

  if (isLoading) return <ListLoadingSkeleton count={3} height={120} />;
  if (error) return <ListErrorState title="Couldn't load your library" message="Check your connection and try again." onRetry={() => refetch()} />;
  if (materials.length === 0) {
    return <ListEmptyState title="Your library is empty" message="Notes and sheets your teachers share will appear here." />;
  }

  const latest = materials[0];

  return (
    <View className="gap-6">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open newest: ${latest.title}`}
        onPress={() => openStudyMaterial(latest.storagePath)}
        className="bg-white rounded-[28px] p-4 flex-row items-center gap-4 active:opacity-90"
      >
        <View className="w-[82px] h-[108px] rounded-l-md rounded-r-[14px] bg-pastel-sky border-[1.5px] border-ink px-2 py-2.5 justify-between">
          <Text className="font-serif text-ink text-sm leading-4" numberOfLines={4}>
            {latest.title}
          </Text>
          {latest.subject ? <Text className="font-sans-bold text-ink text-[9px] uppercase">{latest.subject}</Text> : null}
        </View>
        <View className="flex-1 min-w-0 gap-1">
          <Text className="font-sans-semibold text-muted text-[13px]">Newest from your teachers</Text>
          <Text className="font-display text-ink text-[19px] leading-6" numberOfLines={2}>
            {latest.title}
          </Text>
          <Text className="font-sans text-muted text-[13px]" numberOfLines={1}>
            {[latest.subject, latest.createdAt, latest.fileSizeBytes].filter(Boolean).join(' · ')}
          </Text>
        </View>
      </Pressable>

      {shelves.map((shelf) => (
        <View key={shelf.key} className="gap-3">
          <SectionTitle>{shelf.title}</SectionTitle>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
            {shelf.items.map((item, i) => (
              <Cover key={item.id} item={item} index={i} />
            ))}
          </ScrollView>
        </View>
      ))}
    </View>
  );
};
