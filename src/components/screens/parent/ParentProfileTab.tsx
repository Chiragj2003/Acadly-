import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Share, ActivityIndicator } from 'react-native';
import { LogOut, Download, Trash2, Plus } from 'lucide-react-native';
import { LanguageSwitcher } from '@/components/ui';
import { exportUserData, requestAccountDeletion } from '@/services/accountService';
import { type ChildStudent } from '@/stores/useChildStore';

interface ParentProfileTabProps {
  userEmail?: string;
  userName?: string;
  selectedChild?: ChildStudent | null;
  childrenList?: ChildStudent[];
  onLinkChild?: () => void;
  onLogout: () => void;
}

const CHILD_TONES = ['bg-pastel-pink', 'bg-pastel-lilac', 'bg-pastel-sky', 'bg-pastel-mint'];

const initialsOf = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

/** Soft Desk parent account: you, your linked children, data and sign out. */
export const ParentProfileTab: React.FC<ParentProfileTabProps> = ({
  userEmail,
  userName,
  childrenList = [],
  onLinkChild,
  onLogout,
}) => {
  const [isExportingData, setIsExportingData] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExportData = async () => {
    setIsExportingData(true);
    try {
      const data = await exportUserData();
      await Share.share({ message: JSON.stringify(data, null, 2), title: 'Acadly_Parent_Data_Export.json' });
    } catch (err: unknown) {
      Alert.alert('Export failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setIsExportingData(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert('Delete your account?', 'This removes your profile and child links and stops all notifications. It can’t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setIsDeleting(true);
          try {
            await requestAccountDeletion();
            onLogout();
          } catch (err: unknown) {
            Alert.alert('Couldn’t delete', err instanceof Error ? err.message : 'Please try again.');
          } finally {
            setIsDeleting(false);
          }
        },
      },
    ]);
  };

  return (
    <View className="gap-5">
      <View className="bg-white rounded-3xl px-4 py-3.5 flex-row items-center gap-3.5">
        <View className="w-14 h-14 rounded-full bg-pastel-peach items-center justify-center">
          <Text className="font-display text-ink text-xl">{initialsOf(userName || userEmail || 'P') || 'P'}</Text>
        </View>
        <View className="flex-1 min-w-0">
          <Text className="font-sans-bold text-ink text-[17px]" numberOfLines={1}>
            {userName || 'Parent'}
          </Text>
          {userEmail ? (
            <Text className="font-sans text-muted text-[13px]" numberOfLines={1}>
              {userEmail}
            </Text>
          ) : null}
        </View>
      </View>

      <View className="gap-2">
        <Text className="font-sans-bold text-muted text-[13px] px-1.5">Linked children</Text>
        <View className="bg-white rounded-3xl px-4 py-1">
          {childrenList.map((c, i) => (
            <View key={c.id} className="flex-row items-center gap-3 min-h-[62px] border-b border-hairline">
              <View className={`w-10 h-10 rounded-full items-center justify-center ${CHILD_TONES[i % CHILD_TONES.length]}`}>
                <Text className="font-display text-ink text-[13px]">{initialsOf(c.full_name)}</Text>
              </View>
              <View className="flex-1 min-w-0">
                <Text className="font-sans-bold text-ink text-[15px]" numberOfLines={1}>
                  {c.full_name}
                </Text>
                {c.batch_name ? (
                  <Text className="font-sans text-muted text-xs" numberOfLines={1}>
                    {c.batch_name}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
          {onLinkChild ? (
            <TouchableOpacity accessibilityRole="button" onPress={onLinkChild} className="flex-row items-center gap-3 min-h-[56px]">
              <View className="w-10 h-10 rounded-full border-[1.5px] border-dashed border-slate-400 items-center justify-center">
                <Plus size={18} color="#1C1C1E" />
              </View>
              <Text className="font-sans-bold text-ink text-[15px]">Link a child</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <Text className="font-sans text-muted text-xs leading-[17px] px-1.5">
          Only the institute can remove a link. Contact them if something looks wrong.
        </Text>
      </View>

      <View className="gap-2">
        <Text className="font-sans-bold text-muted text-[13px] px-1.5">Language</Text>
        <LanguageSwitcher />
      </View>

      <View className="bg-white rounded-3xl px-4">
        <TouchableOpacity
          accessibilityRole="button"
          onPress={handleExportData}
          disabled={isExportingData}
          className="flex-row items-center gap-3 min-h-[56px] border-b border-hairline"
        >
          <View className="w-9 h-9 rounded-full bg-paper items-center justify-center">
            <Download size={17} color="#1C1C1E" />
          </View>
          <Text className="flex-1 font-sans-semibold text-ink text-[15px]">Download my data</Text>
          {isExportingData ? <ActivityIndicator size="small" color="#1C1C1E" /> : null}
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={handleDeleteAccount}
          disabled={isDeleting}
          className="flex-row items-center gap-3 min-h-[56px]"
        >
          <View className="w-9 h-9 rounded-full bg-paper items-center justify-center">
            <Trash2 size={17} color="#B42318" />
          </View>
          <Text className="flex-1 font-sans-semibold text-ink text-[15px]">Delete account</Text>
          {isDeleting ? <ActivityIndicator size="small" color="#1C1C1E" /> : null}
        </TouchableOpacity>
      </View>

      <TouchableOpacity accessibilityRole="button" onPress={onLogout} className="self-center min-h-[44px] flex-row items-center gap-2 px-4">
        <LogOut size={16} color="#B42318" />
        <Text className="font-sans-bold text-rose-700 text-[15px]">Sign out</Text>
      </TouchableOpacity>
    </View>
  );
};
